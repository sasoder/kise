// ---------------------------------------------------------------------------
// CleanVerifiableProxies (rsi-derpy-interns, cut 78). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 96 frames.
//
// CHECK LINE: "online learning is a research problem you can score: every AI attempt gets a clean, checkable number,
// and the best score climbs."
//
// THE LINE: "Online learning is an ML research problem with clean, verifiable proxies."
// WORD -> FRAME: Online -3 · learning 3 · is 13 · an 23 · ML 27 · research 32 · problem 38 · with 48 · clean 61 ·
//   verifiable 67 · proxies 82 (word_tables.md, composition frames; Whisper reads 2-7 frames early).
// DURATION: the slot 78.704 -> 82.708 s = 4.004 s x 23.976 = 96 frames (f0..f95).
//
// THE MOTION: a white problem card, ONLINE LEARNING (cut 85's card look: squircle outline, label, lucide
// `refresh-cw`), slides up into place from f0 beside the orange OpenAI mark (the AI researcher); the white chart
// baseline under the card is there from f0. The mark lights and an accent thread runs to the card. From f11, on a
// steady 6-frame beat, the mark fires six attempts, and each is ONE orange dot for its whole trip: it leaves from
// behind the mark, runs the thread into the card's left edge (CONTACT: the card outline brightens), passes behind the
// card, drops out of the card's bottom edge straight down its own bar slot and LANDS on the baseline, where it spreads
// into the bar's top and pushes the bar up to its score: orange while it is measured, then white, then a white check
// (clean, verifiable). Contacts f16, 22, 28, 34, 40, 46; landings f35, 41, 47, 53, 59, 65; all measured by f73,
// checked by f77. A white best-so-far staircase rides a hair above the running maximum, so it ratchets up live when a
// rising bar passes it and stays flat over the two that fall short. The last bar beats the best by the most
// (half-step HIGHLIGHT for two frames as it passes). From f77 the mark breathes and small packets keep running into the
// card. One slow push-in f0 -> end, pivoted so the baseline holds just above the 1080 caption band.
// CAUSE -> EFFECT (per attempt i, launch L = 11 + 6i): visible on the thread L..L+5, contact with the card edge L+5
// (outline brightens that frame), hidden behind the card L+5..L+9, emerges from the bottom edge L+9, falls 15 frames
// (accelerating, <= 45 screen px/frame), lands L+24 = first frame of its bar.
// Orange = the AI (mark, thread, the attempt and its bar while unmeasured); white = the problem, its chart, verdicts.
// Bars are flat fills with no per-bar shadow; the Vignette goes last, over everything, as in every cut of this clip.
//
// SOURCES: none. The bars are ILLUSTRATIVE (no numbers, no axes, no real benchmark): a made-up rising series with
// two dips, so the best-so-far line visibly ratchets. Mark: brandGlyphs OPENAI. Glyph: lucide `refresh-cw` (ISC),
// the same loop cut 85 uses for continual learning. Check: jumpWorld `CheckMark` (lucide `check`).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
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
  camEase,
  clamp01,
  iconShadow,
  makeTone,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { Comet, INK, INK_HI, INK_LO, Label, STROKE_PX, THREAD_PX, worldPx } from "../kits/dwarkesh/alignShared";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";
import { EASE_ARRIVE, HIGHLIGHT, packetsOn } from "../kits/dwarkesh/levelUp";
import { CheckMark } from "../rsi-another-jump/jumpWorld";

export const FPS = 24000 / 1001;
export const DURATION = 96;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- camera ------------------------------------------------------------------------------------------------------
const K0 = 1.12;
const K1 = 1.2;
const K_REST = 1.16; // strokes and labels are sized for mid-push
const CX = 540; // centre of mark-left (160) .. card-right (920)
const BASE_Y = 1040; // the chart baseline, world
const BASE_SCREEN = 1055; // ...held at this screen y through the push (caption band starts at 1080)
const cyFor = (k: number) => BASE_Y - (BASE_SCREEN - 960) / k;
const CAM: { k: number; cy: number }[] = (() => {
  const tk = (f: number) => K0 + (K1 - K0) * camEase(f / DURATION, 0.85);
  let k = K0;
  let vk = 0.0006; // already creeping at f0
  const out = [{ k, cy: cyFor(k) }];
  for (let f = 1; f <= DURATION; f++) {
    vk += (tk(f) - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    out.push({ k, cy: cyFor(k) });
  }
  return out;
})();

// --- world (px at k 1) -------------------------------------------------------------------------------------------
const SW = worldPx(STROKE_PX, K_REST);
const TW = worldPx(THREAD_PX, K_REST);

const MARK_SIZE = 130;
const MARK_X = 160 + MARK_SIZE / 2;
const MARK_Y = 495;

const CARD_X = 380;
const CARD_W = 540;
const CARD_Y = 385;
const CARD_H = 220;
const CARD_RISE = 90; // the card slides up this far, f0 -> f14
const CARD_IN = 14;
const LABEL_PX = 48;
const LABEL_DY = 30;
const GLYPH = 84;
const EDGE_REST = 0.78; // the card outline at rest; a contact lifts it to 1.0
const EDGE_DECAY = 5;

// the chart sits under the card, so every attempt can drop straight out of the card's bottom edge into its slot
const CHART_X0 = CARD_X;
const CHART_X1 = CARD_X + CARD_W;
const N = 6;
const SLOT = (CHART_X1 - CHART_X0) / N;
const BAR_W = 62;
const BAR_H = 335; // the tallest bar
const SCORES = [0.26, 0.52, 0.3, 0.74, 0.48, 1.0]; // illustrative
const slotX = (i: number) => CHART_X0 + SLOT * (i + 0.5);
const BEST_GAP = 9; // the best line rides this far above the running max
const CHECK_SIZE = 46;
const CHECK_DY = 38; // check centre above the bar top

// --- the attempt -------------------------------------------------------------------------------------------------
const DOT_R = 13;
const T_FLY = 5; // behind the mark -> card edge
const T_HIDE = 4; // behind the card
const T_FALL = 15; // card bottom -> baseline
const FALL_V0 = 20; // world px/frame leaving the card; accelerates linearly to the landing speed
const LAUNCH = Array.from({ length: N }, (_, i) => 11 + 6 * i);
const CONTACT = LAUNCH.map((l) => l + T_FLY);
const EXIT = CONTACT.map((c) => c + T_HIDE);
const LAND = EXIT.map((e) => e + T_FALL);
const FLY_FROM = { x: MARK_X + 20, y: MARK_Y }; // starts behind the mark
const FALL_Y0 = CARD_Y + CARD_H - DOT_R - 6; // still inside the card when the fall starts
const LAND_Y = BASE_Y - SW / 2 - DOT_R; // resting on the baseline
const FALL_D = LAND_Y - FALL_Y0;
const FALL_V1 = (2 * FALL_D) / T_FALL - FALL_V0;
const SPREAD = 3; // frames for the landed dot to spread to the bar's width
const MERGE = 4; // frames for the dot's round top to merge into the bar

// --- timing ------------------------------------------------------------------------------------------------------
const LIGHT_F0 = 0; // the mark lights before its thread launches
const LIGHT_F1 = 7;
const THREAD_F0 = 3;
const THREAD_F1 = 10;
const GROW = 8;
const WHITE_IN = 2; // a quick swap: a slower mix passes through a washed-out cream
const CHECK_LEN = 4;
const EXT = 5; // the best line extends over a new slot

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};
const MARK_TONE = makeTone(ACCENT_DEEP, ACCENT);

const barH = (i: number, f: number) => BAR_H * SCORES[i] * EASE_ARRIVE(clamp01((f - LAND[i]) / GROW));

// the frame the last bar passes the previous best (for its two-frame highlight)
const LAST_PASS = (() => {
  const prev = Math.max(...SCORES.slice(0, N - 1)) * BAR_H;
  for (let f = LAND[N - 1]; f <= DURATION; f++) if (barH(N - 1, f) > prev) return f;
  return -1;
})();

/** The attempt dot on its trip, or null when it is not travelling (before launch, after landing). */
const dotAt = (i: number, f: number): { x: number; y: number; heading: number } | null => {
  if (f < LAUNCH[i] || f >= LAND[i]) return null;
  if (f < CONTACT[i]) {
    const u = (f - LAUNCH[i]) / T_FLY;
    return { x: FLY_FROM.x + (CARD_X - FLY_FROM.x) * u, y: MARK_Y, heading: 0 };
  }
  if (f < EXIT[i]) {
    // behind the card (masked): from the entry point to the top of its own fall
    const u = (f - CONTACT[i]) / T_HIDE;
    return { x: CARD_X + (slotX(i) - CARD_X) * u, y: MARK_Y + (FALL_Y0 - MARK_Y) * u, heading: Math.PI / 2 };
  }
  const t = f - EXIT[i];
  const y = FALL_Y0 + FALL_V0 * t + ((FALL_V1 - FALL_V0) * t * t) / (2 * T_FALL);
  return { x: slotX(i), y, heading: Math.PI / 2 };
};

// --- glyph -------------------------------------------------------------------------------------------------------
const LOOP = [
  "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
  "M21 3v5h-5",
  "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
  "M8 16H3v5",
];

const CleanVerifiableProxies: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { k, cy } = CAM[Math.max(0, Math.min(DURATION, frame))];
  const s = sway(frame);
  const { tx, ty } = worldTransform(CX + s.dx, cy + s.dy, k);

  // card
  const cardRise = CARD_RISE * (1 - EASE_ARRIVE(clamp01(frame / CARD_IN)));
  const cardY = CARD_Y + cardRise;
  const hit = Math.max(
    0,
    ...CONTACT.map((c) => (frame >= c ? 1 - EASE_ARRIVE(clamp01((frame - c) / EDGE_DECAY)) : 0)),
  );
  const edgeOp = EDGE_REST + (INK_HI - EDGE_REST) * hit;

  // mark
  const lit = clamp01((frame - LIGHT_F0) / (LIGHT_F1 - LIGHT_F0));
  const breathe = 1 + 0.025 * Math.sin(frame * 0.16);
  const ms = (MARK_SIZE * breathe) / 24;

  // the thread mark -> card
  const tA = { x: MARK_X + MARK_SIZE * 0.5 + 6, y: MARK_Y };
  const tB = { x: CARD_X, y: MARK_Y };
  const thr = EASE_ARRIVE(clamp01((frame - THREAD_F0) / (THREAD_F1 - THREAD_F0)));
  const thrTip = tA.x + (tB.x - tA.x) * thr;

  // idle packets into the card after the last launch
  const idleF0 = LAUNCH[N - 1] + 8;
  const idleOp = clamp01((frame - idleF0) / 3);
  const idle = packetsOn({ frame, k, from: FLY_FROM, to: { x: CARD_X + 8, y: MARK_Y }, period: 12, phase: idleF0, speed: 10, opacity: idleOp, seed: 7 });

  // baseline (there from f0)
  const bx0 = CHART_X0 - 14;
  const bx1 = CHART_X1 + 14;

  // bars: a landed dot spreads into the bar's top and pushes it up
  const bars = SCORES.map((_, i) => {
    if (frame < LAND[i]) return null;
    const h = barH(i, frame);
    const w = 2 * DOT_R + (BAR_W - 2 * DOT_R) * EASE_ARRIVE(clamp01((frame - LAND[i]) / SPREAD));
    const capR = DOT_R * (1 - clamp01((frame - LAND[i]) / MERGE));
    const settle = LAND[i] + GROW;
    const wt = clamp01((frame - settle) / WHITE_IN);
    let fill = mix(ACCENT, "#FFFFFF", wt);
    if (i === N - 1 && LAST_PASS >= 0 && frame >= LAST_PASS && frame < LAST_PASS + 2) fill = HIGHLIGHT;
    const chk = clamp01((frame - settle) / CHECK_LEN);
    return { i, h, w, capR, fill, chk };
  });

  // best-so-far staircase: over slot i, the running max through bar i (live), a hair above it
  const pts: { x: number; y: number }[] = [];
  let runMax = 0;
  for (let i = 0; i < N; i++) {
    if (frame < LAND[i]) break;
    runMax = Math.max(runMax, barH(i, frame));
    const y = BASE_Y - SW / 2 - runMax - BEST_GAP;
    const xl = CHART_X0 + SLOT * i;
    const ext = EASE_ARRIVE(clamp01((frame - LAND[i]) / EXT));
    const x0 = i === 0 ? slotX(0) - BAR_W / 2 : xl;
    pts.push({ x: x0, y });
    pts.push({ x: x0 + (xl + SLOT - x0) * ext, y });
  }
  const bestD = pts.length > 1 ? `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}` : null;

  const gs = GLYPH / 24;
  const glyphX = CARD_X + CARD_W / 2;
  const glyphY = cardY + CARD_H - 26 - GLYPH / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground src="grid-background.jpg" blur={13} dim={BG_DIM} frame={frame} cy={cy} cyRest={CAM[0].cy} k={k} parallax={0.15} />
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
            <defs>
              {/* the attempt passes BEHIND the card: hidden over the card's outer box */}
              <mask id="cvp-behind-card" maskUnits="userSpaceOnUse" x={-500} y={-500} width={2080} height={2920}>
                <rect x={-500} y={-500} width={2080} height={2920} fill="#fff" />
                <rect x={CARD_X - SW / 2} y={cardY - SW / 2} width={CARD_W + SW} height={CARD_H + SW} fill="#000" />
                {/* ...and it leaves from inside the mark's disc, so nothing shows through the knot's gaps */}
                <circle cx={MARK_X} cy={MARK_Y} r={MARK_SIZE * 0.47} fill="#000" />
              </mask>
            </defs>

            {/* the chart baseline */}
            <line
              x1={bx0}
              y1={Math.round(BASE_Y) + 0.5}
              x2={bx1}
              y2={Math.round(BASE_Y) + 0.5}
              stroke={INK}
              strokeOpacity={INK_LO}
              strokeWidth={SW}
              strokeLinecap="round"
            />

            {/* the bars: flat fills, no per-bar shadow */}
            {bars.map((b) =>
              b && b.h + b.capR > 0.5 ? (
                <g key={b.i}>
                  {b.h > 0.5 ? (
                    <path
                      d={squirclePath(b.w, b.h)}
                      transform={`translate(${(slotX(b.i) - b.w / 2).toFixed(3)} ${(BASE_Y - SW / 2 - b.h).toFixed(3)})`}
                      fill={b.fill}
                    />
                  ) : null}
                  {b.capR > 0.05 ? (
                    <circle cx={slotX(b.i)} cy={BASE_Y - SW / 2 - b.h - b.capR * 0.15} r={b.capR} fill={b.fill} />
                  ) : null}
                </g>
              ) : null,
            )}

            {/* best so far */}
            {bestD ? (
              <g style={{ filter: iconShadow(k) }}>
                <path d={bestD} fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={TW} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ) : null}

            {/* checks */}
            {bars.map((b) =>
              b ? (
                <CheckMark
                  key={`c${b.i}`}
                  k={k}
                  x={slotX(b.i)}
                  y={BASE_Y - SW / 2 - BAR_H * SCORES[b.i] - CHECK_DY}
                  size={CHECK_SIZE}
                  progress={b.chk}
                  sw={SW * 0.85}
                />
              ) : null,
            )}

            {/* the thread */}
            {thr > 0 ? (
              <line x1={tA.x} y1={tA.y} x2={thrTip} y2={tA.y} stroke={ACCENT} strokeOpacity={0.45} strokeWidth={TW} strokeLinecap="round" />
            ) : null}
            {thr > 0 && thr < 1 ? <circle cx={thrTip} cy={tA.y} r={TW * 1.5} fill={INK} /> : null}

            {/* the attempts and idle packets, behind the card */}
            <g mask="url(#cvp-behind-card)">
              {LAUNCH.map((_, i) => {
                const d = dotAt(i, frame);
                return d ? <Comet key={i} x={d.x} y={d.y} heading={d.heading} r={DOT_R} tone={1} tipMul={2.2} /> : null;
              })}
              {idle.map((p, i) => (
                <circle key={`p${i}`} cx={p.x} cy={p.y} r={4.2} fill={ACCENT} opacity={idleOp} />
              ))}
            </g>

            {/* the card */}
            <g style={{ filter: iconShadow(k) }}>
              <path
                d={squirclePath(CARD_W, CARD_H)}
                transform={`translate(${CARD_X} ${cardY.toFixed(3)})`}
                fill="none"
                stroke={INK}
                strokeOpacity={edgeOp}
                strokeWidth={SW}
              />
              <g
                transform={`translate(${(glyphX - 12 * gs).toFixed(3)} ${(glyphY - 12 * gs).toFixed(3)}) scale(${gs.toFixed(5)})`}
                fill="none"
                stroke={INK}
                strokeWidth={SW / gs}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {LOOP.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            </g>

            {/* the AI: the OpenAI mark (over the attempts' launch point) */}
            <g style={{ filter: iconShadow(k, 2, 3, 0.27) }}>
              <g transform={`translate(${(MARK_X - 12 * ms).toFixed(3)} ${(MARK_Y - 12 * ms).toFixed(3)}) scale(${ms.toFixed(5)})`}>
                {OPENAI.paths.map((d, i) => (
                  <path key={i} d={d} fill={MARK_TONE(lit)} fillRule="evenodd" />
                ))}
              </g>
            </g>
          </svg>
          <Label k={k} x={CARD_X + CARD_W / 2} y={cardY + LABEL_DY} text="Online learning" inT={1} size={worldPx(LABEL_PX, K_REST)} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default CleanVerifiableProxies;
