// ---------------------------------------------------------------------------
// TopHumanInMonths (rsi-years-in-days, cut 69). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 204 frames. The LAST shot of the video.
//
// CHECK LINE: "Starting from day 1, every field's ring climbs at once; one after another they reach the TOP HUMANS
// line, and the last one is there before month four."
//
// THE LINE: "(we) should expect these future post-[model name] AIs to be able to get to top human performance in all
// domains within months of being developed."
// WORD -> FRAME: (we -5) · should 3 · expect 6 · these 13 · future 22 · post 41 · [name] 49 · AIs 57 · to 68 · be 77 ·
// able 80 · to 83 · get 86 · to 90 · top 93 · human 108 · performance 113 · in 121 · all 128 · domains 132 ·
// within 140 · months 155 · of 165 · being 178 · developed 184 · (end 204).
// DURATION: the slot 69.194 -> 77.703 s = 8.509 s x 23.976 = 204 frames (f0..f203).
//
// THE MOTION: one chart whose x-axis is the calendar. A white calendar rule (DAY 1 at the origin, where the orange
// OpenAI mark stands; MONTH 1-3 ticks), a white TOP HUMANS line high above, and seven fields between them: a station
// ring with a white Lucide icon on an orange stem growing up from the rule. ONE clock drives everything: the white
// calendar dot runs right along the rule at one constant speed, and each ring's height is derived from the dot's
// position so that its centre reaches the line on the exact frame the dot passes under its column (the column's
// place along the rule IS the month it got there); on that frame it parks centred on the line and converts white ->
// ACCENT (ring and icon). One damped camera move, anchored low: f0 close on the origin (k 1.48, the line just
// above the frame); one pull-back in which the rule only travels down (y 837 -> 985) while the zoom opens, so the
// TOP HUMANS line comes down into frame (label readable ~f30, inside the keep-in box f35) and the whole chart is
// in by ~f44, before MONTH 1 enters; settled k 0.949 ~f48, flowing into one slow 5.5 % creep about the rule
// (y 985 fixed) to the last frame. Rising HIGHLIGHT pulses on the parked stems, the dot creeps, the mark breathes.
// No fade: it is the last frame of the video. The vignette sits under the chart (it darkens only the grid).
// BEATS (contact = the dot under the column = the ring's centre on the line = first ACCENT frame):
//   landings f36 · f56 · f76 · f96 ("top" 93) · f116 · f136 · f156 ("months" 155); constant dot speed until f156,
//   then it eases to a creep. Tick labels slide up as the dot passes their tick: MONTH 1 f48, MONTH 2 f95,
//   MONTH 3 f143 ("within" 140). DAY 1 is there from f0.
// Orange = the AI (the mark, the stems, the rings it has brought to the line, the packets in HIGHLIGHT);
// white = the calendar rule and dot, the human line, the fields not reached yet, labels.
//
// SOURCES: none. A schematic of the speaker's forecast, no data: the months are illustrative. Icons: Lucide (ISC)
// outlines inlined. stethoscope, scale, wrench and calculator copied from rsi-years-in-days/OneJobInParticular.tsx;
// flask-conical from the repo's own inlined copy (rsi-another-jump/jumpWorld.tsx); code-xml and pen-line written
// from the Lucide geometry (lucide is not installed, no download). The mark is brandGlyphs OPENAI.
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
  breath,
  camEase,
  clamp01,
  iconShadow,
  makeTone,
  smoothstep,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, INK_LO, Label, labelIn, worldPx } from "../kits/dwarkesh/alignShared";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";

export const FPS = 24000 / 1001;
export const DURATION = 204;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// SCALE. World px = screen px at the LAST frame (k 1, cx 540, cy 960): every constant below is where it sits on
// screen when the cut ends. The settled wide (~f48) is the same picture 5.5 % smaller about the rule.
// ---------------------------------------------------------------------------
const K_END = 1;
const SW = worldPx(6.5, K_END); // the one stroke weight (rule, ticks, rings, icons)
const REF_SW = worldPx(4.5, K_END); // the human line, a touch lighter than the ground rule (as spikyShared)
const TICK = worldPx(22, K_END);
const CAL_DOT_R = worldPx(11, K_END);
const TICK_LABEL = worldPx(46, K_END);
const LINE_LABEL = worldPx(52, K_END);

// ---------------------------------------------------------------------------
// THE CHART.
// ---------------------------------------------------------------------------
const RULE_Y = 985; // the calendar rule
const LINE_Y = 405; // TOP HUMANS
const LH = RULE_Y - LINE_Y; // a ring's centre height (above the rule) when it is on the line
const O_X = 130; // the origin tick: DAY 1, where the mark stands
const LINE_X0 = 72;
const LINE_X1 = 1010;
const RULE_X1 = 1012; // the rule runs on to here (about month 3.5)

// ONE clock: the dot's x. Constant speed V until the last landing, then it eases to a creep.
const N = 7;
const FIRST_F = 36; // col 0 lands
const STEP_F = 20; // one landing every STEP_F frames
const LAND_F = Array.from({ length: N }, (_, i) => FIRST_F + STEP_F * i); // 36 .. 156
const COL6_X = 962;
const V = (COL6_X - O_X) / LAND_F[N - 1]; // world px per frame (5.33)
export const COL_X = LAND_F.map((f) => O_X + V * f); // 322 .. 962, pitch 106.7
const MONTH3_F = 142; // the dot passes MONTH 3's tick here ("within" 140)
const MONTH = (V * MONTH3_F) / 3; // 252 world px a month
const TICK_X = [0, 1, 2, 3].map((m) => O_X + m * MONTH);

const SLOW_F = LAND_F[N - 1]; // after the last landing nothing hangs on the dot: it slows
const SLOW_LEN = 8;
const SLOW_TO = 0.05;
const DOT: number[] = (() => {
  const out: number[] = [];
  let x = O_X;
  const SUB = 20;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(x);
    for (let s = 0; s < SUB; s++) {
      const u = f + (s + 0.5) / SUB;
      const sp = 1 - (1 - SLOW_TO) * smoothstep((u - SLOW_F) / SLOW_LEN);
      x += (V * sp) / SUB;
    }
  }
  return out;
})();
export const dotX = (f: number) => DOT[Math.max(0, Math.min(DOT.length - 1, f))];
const frameOfDot = (x: number) => {
  for (let f = 0; f < DOT.length - 1; f++) if (DOT[f + 1] >= x) return f + (x - DOT[f]) / (DOT[f + 1] - DOT[f]);
  return 1e9;
};

// THE COLUMNS. Ring R 44 world (88 across, 94.5 outside the stroke, 12 px clear at pitch 106.7), icon box 55.
const RING_R = 44;
const ICON_BOX = 55;
const ICON_SW = SW * 0.95;
const STEM_W = 12;
// Ring-centre heights above the rule at f0: low and uneven.
const H0 = [270, 222, 246, 192, 214, 168, 200];

// The rise, as a function of the dot. u = how far the dot has come from the origin toward this column (0..1).
// q(u): constant rate, then a gentle deceleration over the last DECEL_F frames' worth of dot travel, arriving with
// END_R of the climbing speed: the centre is ON the line exactly when the dot is under the column (u = 1).
const DECEL_F = 9;
const END_R = 0.35;
const qOf = (u: number, uA: number) => {
  const s = 1 / (1 - ((1 - END_R) * (1 - uA)) / 2);
  if (u <= uA) return s * u;
  const c = (s * (1 - END_R)) / (2 * (1 - uA));
  const d = u - uA;
  return s * uA + s * d - c * d * d;
};
// After the landing, the last bit of momentum: e(t) = v t exp(-t / TAU), peak v TAU / e (<= ~3 px), back to 0.
const SETTLE_TAU = 2.6;
export const ringH = (i: number, f: number) => {
  const D = dotX(f);
  const span = COL_X[i] - O_X;
  const uA = 1 - (DECEL_F * V) / span;
  const u = (D - O_X) / span;
  if (u < 1) return H0[i] + (LH - H0[i]) * qOf(Math.max(0, u), uA);
  const sEnd = END_R / (1 - ((1 - END_R) * (1 - uA)) / 2); // dq/du at u = 1
  const vEnd = (sEnd * (LH - H0[i]) * V) / span; // world px per frame
  const t = f - frameOfDot(COL_X[i]);
  return LH + vEnd * t * Math.exp(-t / SETTLE_TAU);
};
/** The landing frame: the first frame the ring's centre is on (or above) the line. */
export const LANDED = COL_X.map((_, i) => {
  for (let f = 0; f <= DURATION; f++) if (ringH(i, f) >= LH - 1e-6) return f;
  return Infinity;
});

const CONVERT_DUR = 5;
const toLit = makeTone("#FFFFFF", ACCENT);
const stemTone = makeTone(ACCENT_DEEP, ACCENT);
const stemFill = (h: number) => stemTone(clamp01((h - 0.25 * LH) / (0.75 * LH)));

// Lucide (ISC). Order: software, maths, science, writing, law, medicine, engineering.
const ICON_CODE_XML = `<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>`;
const ICON_CALCULATOR = `<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>`;
const ICON_FLASK = `<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/>`;
const ICON_PEN_LINE = `<path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>`;
const ICON_SCALE = `<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>`;
const ICON_STETHOSCOPE = `<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>`;
const ICON_WRENCH = `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`;
const ICONS = [ICON_CODE_XML, ICON_CALCULATOR, ICON_FLASK, ICON_PEN_LINE, ICON_SCALE, ICON_STETHOSCOPE, ICON_WRENCH];

// The mark on the origin tick: ~104 px, its foot just above the rule, breathing about its foot.
const MARK = 104;
const MARK_GAP = 6;

// ---------------------------------------------------------------------------
// THE CAMERA. A per-frame target through the kit's damper (CAM_STIFF / CAM_DAMP), pre-rolled from f-30 so f0 is
// already moving. The target is k plus where the origin (O_X, RULE_Y) sits on screen; the zoom is anchored LOW:
//   pull-back  f-16 -> f40, one eased curve (warp 0.85): k 1.6 -> 0.948, origin at screen (176, 805) -> (152, 985)
//              (pre-rolled: k 1.48 and the rule at y 837 on f0).
//              The rule only travels down (832 -> 985) while the zoom opens, so the TOP HUMANS line comes down into
//              frame from above (in frame ~f2, label readable by ~f30) and the wide is reached before MONTH 1 (f47).
//   creep      from f34, ramping in over 30 frames, then steady to the last frame: a 5.5 % zoom about the screen
//              pivot (560, 985), so the rule stays on y 985, reaching x1/0.948 at f203 (the end frame = world).
// ---------------------------------------------------------------------------
const PRE = 30;
const PB_F0 = -16;
const PB_F1 = 40;
const PB_WARP = 0.85;
const K0 = 1.6;
const K_R = 0.948;
const PIVOT = { x: 560, y: RULE_Y };
const SX0 = 176;
const SX_R = PIVOT.x + (O_X - PIVOT.x) * K_R;
const SY0 = 805;
const SY_R = RULE_Y;
const CREEP_F0 = 34;
const CREEP_IN = 30;
const CREEP: number[] = (() => {
  // the creep's progress, 0 at CREEP_F0 -> 1 at DURATION - 1, speed ramping in over CREEP_IN frames
  const raw: number[] = [];
  let a = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    raw.push(a);
    a += smoothstep((f + 0.5 - CREEP_F0) / CREEP_IN);
  }
  const end = raw[DURATION - 1];
  return raw.map((v) => v / end);
})();
const creepAt = (f: number) => (f < 0 ? 0 : CREEP[Math.min(CREEP.length - 1, f)]);

const camTarget = (f: number) => {
  const g = camEase((f - PB_F0) / (PB_F1 - PB_F0), PB_WARP);
  const kB = K0 + (K_R - K0) * g;
  const sx = SX0 + (SX_R - SX0) * g;
  const oyB = SY0 + (SY_R - SY0) * g;
  const m = 1 + (K_END / K_R - 1) * creepAt(f);
  const k = kB * m;
  const ox = PIVOT.x + (sx - PIVOT.x) * m;
  const oy = PIVOT.y + (oyB - PIVOT.y) * m;
  return { x: O_X - (ox - 540) / k, y: RULE_Y - (oy - 960) / k, k };
};

const CAM: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  const t0 = camTarget(-PRE);
  let cx = t0.x;
  let cy = t0.y;
  let k = t0.k;
  let vx = 0;
  let vy = 0;
  let vk = 0;
  for (let f = -PRE + 1; f <= DURATION; f++) {
    const T = camTarget(f);
    vx += (T.x - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (T.y - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (T.k - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    if (f >= 0) out.push({ cx, cy, k });
  }
  return out;
})();
export const camAt = (f: number) => CAM[Math.max(0, Math.min(DURATION - 1, f))];
const BG_CX_REST = CAM[0].cx;
const BG_CY_REST = CAM[0].cy;

// Tick labels slide up as the dot passes their tick (DAY 1 is there from the start).
const TICK_LABEL_F = TICK_X.map((x, m) => (m === 0 ? -1e9 : frameOfDot(x)));
const TICK_TEXT = ["DAY 1", "MONTH 1", "MONTH 2", "MONTH 3"];
// TOP HUMANS: in from the start (it is off frame above until the pull-back brings it in).
const LINE_LABEL_Y = LINE_Y - RING_R - SW / 2 - 8 - LINE_LABEL;

// Pulses: on each parked stem, at most two short HIGHLIGHT dashes (a hair wider than the stem) rise from the rule to
// the ring at ONE shared slow speed, half a travel apart, on a global clock staggered by column (PK_STAGGER frames
// per column, left to right), so the row reads as one steady rising pulse. A stem's first dash launches from the
// rule after its landing; none is ever born mid-stem.
const PK_LEN = LH - RING_R - SW / 2 - SW / 2 - 8; // rule top -> just under the parked ring
const PK_SPEED = 4.2; // world px per frame
const PK_TRAVEL = PK_LEN / PK_SPEED;
const PK_PERIOD = PK_TRAVEL / 2; // two on a stem at once, evenly phased
const PK_STAGGER = 6;
const PK_W = STEM_W + 3;
const PK_H = 40;
// levelUp HIGHLIGHT (#FFD98A) lifted halfway to white: the AI's brightest tone, so a dash reads on an ACCENT stem at phone size.
const PK_FILL = "#FFECC5";

const Field: React.FC<{ k: number; x: number; y: number; col: string; i: number }> = ({ k, x, y, col, i }) => (
  <g style={{ filter: iconShadow(k) }}>
    <circle cx={x} cy={y} r={RING_R} fill="none" stroke={col} strokeWidth={SW} />
    <g
      transform={`translate(${x - ICON_BOX / 2} ${y - ICON_BOX / 2}) scale(${ICON_BOX / 24})`}
      fill="none"
      stroke={col}
      strokeWidth={(ICON_SW * 24) / ICON_BOX}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[i] }}
    />
  </g>
);

const TopHumanInMonths: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = camAt(frame);
  const s = sway(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const D = dotX(frame);

  const cols = COL_X.map((x, i) => {
    const h = ringH(i, frame);
    const y = RULE_Y - h;
    const lit = clamp01((frame - LANDED[i] + 1) / CONVERT_DUR);
    const col = toLit(1 - Math.pow(1 - lit, 2));
    const stem = lit > 0 ? ACCENT : stemFill(h);
    return { x, y, h, col, stem };
  });

  const markS = MARK * breath(frame, 0.3);
  const markFoot = RULE_Y - SW / 2 - MARK_GAP;
  const lit = (x: number) => (D >= x ? INK_HI : INK_LO);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={BG_CY_REST}
        cx={cx}
        cxRest={BG_CX_REST}
        k={k}
        parallax={0.15}
      />
      {/* The vignette darkens only the grid: the whole chart is drawn above it (as YearsInDays draws its mark), so
          the rightmost ring is the same ACCENT as the others. */}
      <Vignette />
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
            <defs>
              <mask id="thim-holes" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={5080} height={5920}>
                <rect x={-2000} y={-2000} width={5080} height={5920} fill="#FFFFFF" />
                {cols.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={RING_R - SW / 2} fill="#000000" />
                ))}
              </mask>
            </defs>
            {/* TOP HUMANS: white, people's level; hidden inside every ring's hole */}
            <g mask="url(#thim-holes)" style={{ filter: iconShadow(k) }}>
              <line
                x1={LINE_X0}
                x2={LINE_X1}
                y1={LINE_Y}
                y2={LINE_Y}
                stroke={INK}
                strokeOpacity={INK_HI}
                strokeWidth={REF_SW}
                strokeLinecap="round"
              />
            </g>
            {/* the calendar rule (YearsInDays' rule): passed stretch INK_HI, ahead INK_LO; ticks light when passed */}
            <g style={{ filter: iconShadow(k) }}>
              <line x1={O_X} x2={Math.min(D, RULE_X1)} y1={RULE_Y} y2={RULE_Y} stroke={INK} strokeWidth={SW} opacity={INK_HI} />
              {D < RULE_X1 ? (
                <line x1={D} x2={RULE_X1} y1={RULE_Y} y2={RULE_Y} stroke={INK} strokeWidth={SW} opacity={INK_LO} />
              ) : null}
              {TICK_X.map((x, m) => (
                <line
                  key={`t${m}`}
                  x1={x}
                  x2={x}
                  y1={RULE_Y - SW / 2}
                  y2={RULE_Y + TICK}
                  stroke={INK}
                  strokeWidth={SW}
                  opacity={m === 0 ? INK_HI : lit(x)}
                />
              ))}
            </g>
            {/* the stems, from the rule to each ring's foot */}
            {cols.map((c, i) => {
              const top = c.y + RING_R;
              if (top >= RULE_Y) return null;
              return (
                <rect key={`s${i}`} x={c.x - STEM_W / 2} y={top} width={STEM_W} height={RULE_Y - SW / 2 - top} fill={c.stem} />
              );
            })}
            {/* rising pulses on the parked stems */}
            {cols.map((c, i) => {
              const out: React.ReactNode[] = [];
              const phase = i * PK_STAGGER;
              const nMax = Math.floor((frame - phase) / PK_PERIOD);
              for (let n = nMax - 2; n <= nMax; n++) {
                const launch = phase + n * PK_PERIOD;
                if (launch < LANDED[i] + 2) continue;
                const u = (frame - launch) / PK_TRAVEL;
                if (u < 0 || u > 1) continue;
                const yC = RULE_Y - SW / 2 - PK_H / 2 - u * (PK_LEN - PK_H);
                out.push(
                  <line
                    key={`p${i}-${n}`}
                    x1={c.x}
                    x2={c.x}
                    y1={yC - (PK_H - PK_W) / 2}
                    y2={yC + (PK_H - PK_W) / 2}
                    stroke={PK_FILL}
                    strokeWidth={PK_W}
                    strokeLinecap="round"
                    opacity={smoothstep(u / 0.08) * smoothstep((1 - u) / 0.08)}
                  />,
                );
              }
              return <g key={`pk${i}`}>{out}</g>;
            })}
            {/* the rings */}
            {cols.map((c, i) => (
              <Field key={`r${i}`} k={k} x={c.x} y={c.y} col={c.col} i={i} />
            ))}
            {/* the calendar dot: where the calendar is */}
            <g style={{ filter: iconShadow(k) }}>
              <circle cx={D} cy={RULE_Y} r={CAL_DOT_R} fill={INK} />
            </g>
            {/* the AI, just developed: the OpenAI mark on DAY 1, breathing about its foot */}
            <g style={{ filter: iconShadow(k, 2, 3, 0.27) }}>
              <g transform={`translate(${O_X} ${markFoot - markS / 2}) scale(${markS / 24}) translate(-12 -12)`}>
                {OPENAI.paths.map((d, i) => (
                  <path key={i} d={d} fill={ACCENT} fillRule="evenodd" />
                ))}
              </g>
            </g>
          </svg>
          <Label k={k} x={LINE_X0} y={LINE_LABEL_Y} text="TOP HUMANS" inT={1} size={LINE_LABEL} align="left" />
          {TICK_X.map((x, m) => (
            <Label
              key={`l${m}`}
              k={k}
              x={x}
              y={RULE_Y + worldPx(22, K_END)}
              text={TICK_TEXT[m]}
              inT={m === 0 ? 1 : labelIn(frame, TICK_LABEL_F[m])}
              size={TICK_LABEL}
              align="center"
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default TopHumanInMonths;
