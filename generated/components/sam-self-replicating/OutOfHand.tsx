// ---------------------------------------------------------------------------
// OutOfHand (sam-self-replicating, cut 3). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 89 frames. Palette B1.
//
// CHECK LINE: "This curve is a timeline: ChatGPT, GPT-4, Stargate each kicked it higher, and now it's breaking out of
// the chart."
//
// THE LINE: "things, at various times along the curve, are gonna get somewhat out of hand."
// WORD -> FRAME: things 7 · at 17 · various 23 · times 30 · along 36 · the 42 · curve 47 · are 54 · gonna 56 · get 59 ·
// somewhat 63 · out 70 · of 75 · hand 77 · speech ends ~85.
// DURATION: the slot 3.629 -> 7.341 s = 3.712 s x 23.976 = 89 frames (f0..f88).
//
// THE MOTION: AlwaysMoreCompute's world, earlier: the same ground, the same amber line on the same geometry up to the
// crouch. The ground's top edge is the timeline, a cream rail with three ticks. The tip draws from f0 while the camera
// makes one eased pull-back and rise. As the tip reaches each tick's position, that tick's stem grows up behind the line
// to its full height, then the blank card unrolls sideways out of the stem like a flag (no vertical travel, its shadow
// growing with it), and its text arrives whole on the open face, so the jump leaves from a dated event.
// On "somewhat out of hand" the tip takes one steep overshoot, reaches the cream ceiling rule at CONTACT_F, the rule
// first bows on CONTACT_F + 1 (one damped lobe, settling to the end), and the line carries on over the open board.
// AMBER = compute (the demand for it); cream = rail, stems, cards, ceiling; the board = the world outside the chart.
//
// SOURCES: the milestone dates are real: ChatGPT launched 30 Nov 2022, GPT-4 14 Mar 2023, Stargate announced 21 Jan 2025.
// Their spacing along the rail is schematic (no year ticks, no scale). The curve's height is a schematic proxy: no data.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, FONT_LABEL, StoutStage, TRACK, amberBandFor, clamp01, lerp, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack } from "../kits/cheeky-pint/museShared";
import { CURVE_LEN, GROUND_Y, GroundFloor, KINK, LineStroke, curveAt } from "./computeCurve";

export const FPS = 24000 / 1001;
export const DURATION = 89;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const n6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

// --- the path: the shared geometry up to the crouch, then this cut's own overshoot through the ceiling -----------------
type P = { x: number; y: number };
const CEILING_Y = 680;
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
  for (let a = 0; a < KINK.crouch; a += 1.5) pts.push(curveAt(a / CURVE_LEN));
  const crouch = curveAt(KINK.crouch / CURVE_LEN);
  pts.push(crouch);
  const w1 = { x: 706, y: 1090 };
  const w2 = { x: 880, y: 330 };
  for (let i = 1; i <= 120; i++) pts.push(hermite(crouch, w1, { x: 120, y: -16 }, { x: 70, y: -300 }, i / 120));
  for (let i = 1; i <= 300; i++) pts.push(hermite(w1, w2, { x: 170, y: -760 }, { x: 170, y: -700 }, i / 300));
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
const ceilingIndex = LINE.findIndex((p) => p.y <= CEILING_Y);
const CEILING_ARC = LINE_ARC[ceilingIndex];
const CEILING_X = LINE[ceilingIndex].x;

// --- the tip: arc length against the frame, a monotone cubic with a real ease-in and a creep at the end -----------------
export const CONTACT_F = 71;
const TIP_KEYS: readonly [number, number][] = [
  [0, 322],
  [4, KINK.k1Foot],
  [21, KINK.k2Foot],
  [42, KINK.crouch],
  [63, lerp(KINK.crouch, CEILING_ARC, 0.46)],
  [CONTACT_F, CEILING_ARC],
  [80, CEILING_ARC + 248],
  [88, LINE_LEN - 46],
];
const TIP_M0 = 8;
const TIP_MN = 5;
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
  const K = TIP_KEYS;
  const hit = K.findIndex((q, j) => j < K.length - 1 && f < K[j + 1][0]);
  const i = hit < 0 ? K.length - 2 : hit;
  const h = K[i + 1][0] - K[i][0];
  const t = (f - K[i][0]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * tipSlopes[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * tipSlopes[i + 1];
};

// --- the camera: one eased pull-back and rise, still creeping on the last frame ----------------------------------------
export const CAM = makeClockCam(
  { x: 250, y: 1670, k: 1.55 },
  [{ f0: -8, f1: 100, dx: 220, dy: -406, k: 0.9 }],
  DURATION,
);
const POOL = makePoolTrack({ x: 300, y: 1700, strength: 1 }, [{ f0: -8, f1: 96, x: 560, y: 900, strength: 1.5 }], DURATION);

// --- the milestones: each stem starts on the frame the tip reaches it; then the flag opens, then its text arrives --------
const CARD_H = 130;
const CARD_R = 14;
const NAME_PX = 50.5;
const DATE_PX = 36;
const PAD_X = 24;
type Milestone = { name: string; date: string; arc: number; x0: number; x1: number; bottom: number };
const MILESTONES: readonly Milestone[] = [
  { name: "ChatGPT launch", date: "Nov 2022", arc: KINK.k1Foot, x0: -68, x1: 466, bottom: 1395 },
  { name: "GPT-4", date: "Mar 2023", arc: KINK.k2Foot, x0: 275, x1: 512, bottom: 1215 },
  { name: "Stargate", date: "Jan 2025", arc: KINK.crouch, x0: 322, x1: 652, bottom: 1035 },
];
const reachFrame = (arc: number) => {
  let f = 0;
  while (f < DURATION && tipArc(f) < arc) f++;
  return f;
};
const STARTS = MILESTONES.map((m) => reachFrame(m.arc));
const stemX = (m: Milestone) => curveAt(m.arc / CURVE_LEN).x;
const STEM_F = 7; // the stem's growth
const OPEN_F = 6; // the flag's opening, from the stem's last frame
const TEXT_F = 4; // the text's arrival, from the face's last frame
const openStart = (i: number) => STARTS[i] + STEM_F - 1;
const textStart = (i: number) => openStart(i) + OPEN_F - 1;
/** The house rise: a short ease-in, damped into its stop, no bounce. */
const damped = (v: number) => lerp(smoothstep(v), 1 - Math.pow(1 - v, 3), 0.55);
/** The stem's top: it runs up the full height of the flag, whose face then covers it. */
const stemTop = (f: number, i: number) => lerp(GROUND_Y + 6, MILESTONES[i].bottom - CARD_H, damped(clamp01((f - STARTS[i]) / STEM_F)));
/** The flag's open extent: its real outline widens out of the stem to its resting edges; nothing scales. */
const flagAt = (f: number, i: number) => {
  const m = MILESTONES[i];
  const e = damped(clamp01((f - openStart(i)) / OPEN_F));
  if (e <= 0) return null;
  const sx = stemX(m);
  const x0 = lerp(sx, m.x0, e);
  const x1 = lerp(sx, m.x1, e);
  return { x0, x1, y: m.bottom - CARD_H, w: x1 - x0, r: Math.min(CARD_R, (x1 - x0) / 2) };
};

const RULE_W = 6.5; // rail and ceiling share one weight, world px
const STEM_W = 5.5;
const TICK = { w: 7.5, down: 30 } as const;

// --- the ceiling: the plot's limit. Flat until contact, one damped lobe under the push, settling to the end -------------
const BOW = { a: 75, sigma: 210, tau: 5 } as const;
const bowAt = (f: number) => {
  if (f <= CONTACT_F) return 0;
  const t = (f - CONTACT_F) / BOW.tau;
  return t * t * Math.exp(2 * (1 - t));
};
const ceilingPath = (f: number) => {
  const b = bowAt(f);
  const X0 = -1600;
  const X1 = 6400;
  if (b === 0) return `M${X0} ${CEILING_Y}H${X1}`;
  let d = `M${X0} ${CEILING_Y}`;
  for (let x = CEILING_X - 3 * BOW.sigma; x <= CEILING_X + 3 * BOW.sigma; x += 8) {
    const u = (x - CEILING_X) / BOW.sigma;
    d += `L${n6(x)} ${n6(CEILING_Y - BOW.a * b * Math.exp(-u * u))}`;
  }
  return `${d}L${X1} ${CEILING_Y}`;
};

const CardText: React.FC<{ m: Milestone; top: number; enter: number }> = ({ m, top, enter }) => {
  if (enter <= 0) return null;
  const a = 1 - Math.pow(1 - clamp01(enter), 3);
  const lift = (1 - a) * 12;
  const common = { fontFamily: FONT_LABEL, fontWeight: 500, letterSpacing: `${TRACK.label}em`, fill: COLOR.inkDark, style: { fontFeatureSettings: '"case" 1, "lnum" 1' } };
  return (
    <g opacity={n6(a)} style={{ filter: a < 0.995 ? `blur(${n6(5 * (1 - a))}px)` : undefined }}>
      <text x={n6(m.x0 + PAD_X)} y={n6(top + 61 + lift)} fontSize={NAME_PX} {...common}>
        {m.name.toUpperCase()}
      </text>
      <text x={n6(m.x0 + PAD_X)} y={n6(top + 108 + lift)} fontSize={DATE_PX} {...common}>
        {m.date.toUpperCase()}
      </text>
    </g>
  );
};

const OutOfHand: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const arc = tipArc(S);
  const live = MILESTONES.map((m, i) => ({ m, i, sx: stemX(m), top: stemTop(S, i), flag: flagAt(S, i) })).filter((q) => S >= STARTS[q.i]);
  // one shared shadow for the stems and flags: only what is above the ground, growing as they do
  const sil = live.flatMap(({ top, sx, flag }) => {
    const parts: { d: string; stroke?: number }[] = [];
    if (top < GROUND_Y) parts.push({ d: `M${n6(sx)} ${n6(top)}V${GROUND_Y}`, stroke: STEM_W });
    if (flag) parts.push({ d: rectPath(flag.x0, flag.y, flag.w, CARD_H, flag.r) });
    return parts;
  });
  let d = "";
  for (let i = 0; i < LINE.length && LINE_ARC[i] < arc; i++) d += `${i ? "L" : "M"}${n6(LINE[i].x)} ${n6(LINE[i].y)}`;
  const e = lineAt(arc);
  d += `L${n6(e.x)} ${n6(e.y)}`;
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <path d={ceilingPath(S)} fill="none" stroke={COLOR.cream} strokeWidth={RULE_W} strokeLinejoin="round" />
      {sil.length ? <UnionShadow sil={sil} s={4} elevation="rest" /> : null}
      {live.map(({ m, i, sx, top, flag }) => (
        <g key={m.name}>
          <rect x={n6(sx - STEM_W / 2)} y={n6(top)} width={STEM_W} height={n6(Math.max(0, GROUND_Y + 8 - top))} rx={STEM_W / 2} fill={COLOR.cream} />
          {flag ? <path d={rectPath(flag.x0, flag.y, flag.w, CARD_H, flag.r)} fill={`url(#${uid}f)`} /> : null}
          {flag && flag.w > 2 * CARD_R ? (
            <path d={`M${n6(flag.x0 + CARD_R)} ${n6(flag.y + EDGE.CREAM / k / 2)}H${n6(flag.x1 - CARD_R)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={n6(EDGE.CREAM / k)} />
          ) : null}
          <CardText m={m} top={m.bottom - CARD_H} enter={(S - textStart(i)) / TEXT_F} />
        </g>
      ))}
      <LineStroke d={d} e={e} k={k} band={amberBandFor(cam)} />
      {/* the ground, in front of everything still inside it; on its top edge the timeline */}
      <GroundFloor k={k} />
      <path d={`M-1600 ${GROUND_Y + RULE_W / 2}H6400`} stroke={COLOR.cream} strokeWidth={RULE_W} fill="none" />
      {MILESTONES.map((m) => (
        <rect key={m.name} x={n6(stemX(m) - TICK.w / 2)} y={GROUND_Y} width={TICK.w} height={TICK.down} rx={TICK.w / 2} fill={COLOR.cream} />
      ))}
    </StoutStage>
  );
};

export default OutOfHand;
