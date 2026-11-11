// ---------------------------------------------------------------------------
// OneJobInParticular (rsi-years-in-days, cut 68). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 246 frames.
//
// CHECK LINE: "By the time most jobs have only just crept past the average-human line, one job is already up at the
// best-humans line — and that job is the AI's own."
//
// THE LINE: "That's because by the time we have AIs that can do most jobs passably well, we'll already have AIs that
// are as good as the best humans at one job in particular." (back on camera next: "Building better AIs.")
// WORD -> FRAME: That's -1 · because 4 · by 9 · the 20 · time 23 · we 31 · have 35 · AIs 39 · that 47 · can 51 ·
// do 54 · most 58 · jobs 66 · passably 76 · well 98 · we'll 108 · already 113 · have 123 · AIs 131 · that 142 ·
// are 146 · as 148 · good 155 · as 165 · the 176 · best 180 · humans 185 · at 194 · one 208 · job 214 · in 226 ·
// particular 230 (· "Building" 244).
// DURATION: the slot 68.610 -> 78.870 s = 10.260 s x 23.976 = 246 frames (f0..f245).
//
// THE MOTION: cut 55's chart again (spikyShared: baseline, AVERAGE HUMAN and BEST HUMANS, left-gutter labels), now
// with seven JOBS: a white station ring with a white Lucide job icon riding the top of an orange stem that grows
// from the baseline (a lollipop). A ring converts white -> orange on the frame its centre crosses the average line
// (crossing frames computed from the stem's own height curve). f0 opens close inside the row (k 2.12, five of
// the seven columns), BEST HUMANS above the top edge; six ordinary stems grow on one slow curve at hashed rates,
// five crossing between f46 and f98 (two of them off frame) and resting just above the line, one under it, white. The centre stem (the OpenAI mark in its ring: the job
// of building AI) takes off from ~f6, converts on crossing (~f20) and leaves by the top edge (~f41), its stem a
// bright orange column out of the frame. From ~f88 the camera rises along that column and pulls back to the whole
// chart (settled ~f180), where the ring has been waiting, centre exactly on BEST HUMANS (arrived ~f70 unseen,
// tiny bob, packets rising up its stem). f194-245 a slow push toward it; on "one" the ring and mark click
// ACCENT -> HIGHLIGHT (f198-208) while the six below recede (ACCENT_DEEP rings, INK_LO icons). No fade.
// Orange = the AI (stems, the rings it can do, the mark); white = jobs it cannot do yet, the human lines, labels.
//
// SOURCES: none. The heights are a schematic, not data (no numbers on screen). Icons: Lucide (ISC) outlines inlined:
// stethoscope, scale and wrench copied verbatim from jcb-experience/MillionsOfYears.tsx; truck, chef-hat and
// calculator drawn by hand from the Lucide geometry (lucide is not installed, no download). The mark is brandGlyphs
// OPENAI.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, INK_LO, hermite } from "../kits/dwarkesh/alignShared";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";
import { packetsOn } from "../kits/dwarkesh/levelUp";
import {
  AVG_V,
  BASE_Y,
  BEST_V,
  ChartLines,
  GUTTER_X,
  HIGHLIGHT,
  LevelLabel,
  ROW_L,
  ROW_R,
  STROKE,
  chartCamera,
  levelY,
  needleTone,
  screenX,
} from "./spikyShared";

export const FPS = 24000 / 1001;
export const DURATION = 246;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE ROW. Seven columns at an equal pitch inside cut 55's mark range (ROW_L..ROW_R, outer ring edges included),
// so nothing ever crosses the gutter labels. Seven rings at the brief's 52-58 px radius and 130 pitch need 890 px;
// the range is 706, so the ring is R 43 world at pitch 102 (9.5 px clear between ring strokes at equal height).
// ---------------------------------------------------------------------------
export const N_COLS = 7;
export const HERO = 3; // the centre column: building AI
export const RING_R = 43;
const RING_OUT = RING_R + STROKE / 2;
export const PITCH = (ROW_R - ROW_L - 2 * RING_OUT) / (N_COLS - 1);
export const COL_X = Array.from({ length: N_COLS }, (_, i) => ROW_L + RING_OUT + i * PITCH);
const STEM_W = 12; // the lollipop stick
const ICON_BOX = 2 * RING_R * 0.72; // Lucide 24-grid box inside the ring
const MARK_BOX = 2 * RING_R * 0.64; // the OpenAI mark fills its box edge to edge, so a touch smaller
const ICON_STROKE = STROKE * 0.92; // ~6 screen px at the rest zoom: the one weight

// Lucide (ISC), verbatim geometry.
const ICON_STETHOSCOPE = `<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>`;
const ICON_SCALE = `<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>`;
const ICON_WRENCH = `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`;
const ICON_TRUCK = `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>`;
const ICON_CHEF_HAT = `<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>`;
const ICON_CALCULATOR = `<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>`;
const ICONS = [ICON_STETHOSCOPE, ICON_SCALE, ICON_WRENCH, "", ICON_TRUCK, ICON_CHEF_HAT, ICON_CALCULATOR];

// ---------------------------------------------------------------------------
// THE GROWTH. One curve for the six ordinary stems, g(u) = 1 - (1-u)^P, from a short start V0 to a rest height
// V_END over its own span T, and T is solved so the ring's centre crosses the average line on CROSS_AT (spread
// f46..f97, the last on "well"). Column 5 (chef) stays under the line. A sway of +-0.6 % that grows with g keeps
// the resting stems alive without ever re-crossing the line.
// ---------------------------------------------------------------------------
const P = 2.2;
const g = (u: number) => 1 - Math.pow(1 - clamp01(u), P);
const V0 = [0.58, 0.63, 0.56, 0.58, 0.66, 0.57, 0.6];
const V_END = [1.13, 1.22, 1.07, BEST_V, 1.18, 0.84, 1.1];
const CROSS_AT = [57, 84, 95, 0, 46, 0, 69]; // design targets; the real frames are measured below
const UNDER = 5;
const T_UNDER = 150;
export const T_SPAN = V0.map((v0, i) => {
  if (i === HERO) return 0;
  if (i === UNDER) return T_UNDER;
  const uStar = 1 - Math.pow((V_END[i] - AVG_V) / (V_END[i] - v0), 1 / P);
  return CROSS_AT[i] / uStar;
});
const swayV = (i: number, f: number) => 0.006 * Math.sin(f * (0.05 + 0.03 * hash(i, 23)) + hash(i, 29) * 6.28);

// The hero: one flight on monotone Hermite knots (f, v). f0-8 it creeps like the others; from ~f6 it climbs several
// times faster (peak ~0.05 level/frame, ~22 screen px/frame), its centre crosses the average line ~f20, the ring
// clears the top edge ~f38 still moving, and it eases onto BEST_V at f70 (unseen, above the frame), where it bobs a
// hair (+-0.005 level, ~2 px).
const HERO_F1 = 70;
const heroCurve = hermite([0, 8, 20, 42, HERO_F1, HERO_F1 + 1], [0.58, 0.67, 1.0, 1.92, BEST_V, BEST_V]);
const heroV = (f: number) => {
  const bob = 0.005 * Math.sin((f - HERO_F1) * 0.085) * smoothstep((f - HERO_F1) / 24);
  return heroCurve(f) + (f > HERO_F1 ? bob : 0);
};

export const stemV = (i: number, f: number) => {
  if (i === HERO) return heroV(f);
  const gi = g(f / T_SPAN[i]);
  return (V0[i] + (V_END[i] - V0[i]) * gi) * (1 + swayV(i, f) * gi);
};

// The crossing frame of each ring: the first frame its centre is at or above the average line (from the curve,
// never a timer). The tone change starts on that frame.
export const CROSS_F = Array.from({ length: N_COLS }, (_, i) => {
  for (let f = 0; f < DURATION; f++) if (stemV(i, f) >= AVG_V) return f;
  return Infinity;
});
const CONVERT_DUR = 6;
const toLit = makeTone("#FFFFFF", ACCENT);
const toHigh = makeTone(ACCENT, HIGHLIGHT);
const toDim = makeTone(ACCENT, ACCENT_DEEP);

// The payoff: the hero clicks ACCENT -> HIGHLIGHT f198-208 (lands on "one"); the six recede f190-214.
const CLICK_F0 = 198;
const CLICK_F1 = 208;
const DIM_F0 = 190;
const DIM_F1 = 214;

// ---------------------------------------------------------------------------
// THE CAMERA. Monotone Hermite knots through the kit's damper (spikyShared chartCamera), pre-rolled from f-24.
// y = the world point at the frame's centre (world = screen at k 1).
//   f0    k 2.12  : inside the row: five columns (scale .. chef-hat) in frame, the two outer columns fully off both
//                   edges (k between 2.07 and 2.15 keeps both true), cx on the centre column; the frame's top edge at
//                   world y ~558-562 so BEST HUMANS and the parked ring (to y 521) stay above it until the rise.
//                   AVERAGE HUMAN at screen ~587, the baseline ~1350, the rings start ~y 950-1020 (bottoms above 1080)
//   f86   k 2.105 : a slow creep out (the growth is the motion)
//   f176  k 1.02  : risen along the centre column and pulled back to the whole chart (one lobe, peak chart speed
//                   ~16 screen px/frame at f133; the outer columns come in from f97, the labels slide in f164-170),
//                   BEST HUMANS ~y 540, AVERAGE HUMAN ~y 905
//   f188  k 1.022 : the settle, flowing into the slow push toward the ring
//   f250  k 1.13  : (past the end; k 1.11 at f245) the gutter label still ~45 px inside the frame
// ---------------------------------------------------------------------------
const CAM_PRE = -24;
const K0 = 2.12;
const K_CREEP = 2.105;
const Y0 = 1011; // frame top at world y 562 (f0) -> 558 (f86)
const KNOTS = [
  { f: -24, k: K0 + 0.006, x: 653, y: Y0 },
  { f: 0, k: K0, x: 653, y: Y0 },
  { f: 86, k: K_CREEP, x: 653, y: Y0 },
  { f: 176, k: 1.02, x: 540, y: 890 },
  { f: 188, k: 1.022, x: 539, y: 884 },
  { f: 250, k: 1.13, x: 530, y: 846 },
];
export const camAt = chartCamera(KNOTS, CAM_PRE, DURATION + 4);
const CAM0 = camAt(0);

// The two level labels are off the left edge through the close opening. Rather than let the pull-back drag them in
// as cropped letters, both (same x) slide up into place the frame their left edge (x GUTTER_X) is whole inside the
// frame (LABEL_MARGIN screen px, sway included; the caps' own side bearing adds ~2), over a short LABEL_RISE frames:
// in from f164, readable by ~f168, settled f170, ahead of "best" (f180). Full white (INK_HI) from then on: the
// recede at f190-214 touches only the six ordinary rings and stems, never the labels or the lines.
const LABEL_MARGIN = 3;
const LABEL_RISE = 6;
export const LABEL_F0 = (() => {
  for (let f = 100; f < DURATION; f++) if (screenX(GUTTER_X, camAt(f)) + sway(f).dx >= LABEL_MARGIN) return f;
  return 0;
})();
const labelT = (frame: number) => smoothstep((frame - LABEL_F0) / LABEL_RISE);

// ---------------------------------------------------------------------------
// One job: a stem from the baseline to the ring's bottom, the ring, the icon (or the mark) inside it.
// ---------------------------------------------------------------------------
const Stem: React.FC<{ x: number; v: number; fill: string }> = ({ x, v, fill }) => {
  const top = levelY(v) + RING_R;
  if (top >= BASE_Y) return null;
  return <rect x={x - STEM_W / 2} y={top} width={STEM_W} height={BASE_Y - top} fill={fill} />;
};

const Ring: React.FC<{ k: number; x: number; y: number; ring: string; icon: string; iconOp: number; i: number; markFill: string }> = ({
  k,
  x,
  y,
  ring,
  icon,
  iconOp,
  i,
  markFill,
}) => (
  <g style={{ filter: iconShadow(k) }}>
    <circle cx={x} cy={y} r={RING_R} fill="none" stroke={ring} strokeWidth={STROKE} />
    {i === HERO ? (
      <g transform={`translate(${x} ${y}) scale(${MARK_BOX / 24}) translate(-12 -12)`}>
        {OPENAI.paths.map((d) => (
          <path key={d.length} d={d} fill={markFill} fillRule="evenodd" />
        ))}
      </g>
    ) : (
      <g
        transform={`translate(${x - ICON_BOX / 2} ${y - ICON_BOX / 2}) scale(${ICON_BOX / 24})`}
        fill="none"
        stroke={icon}
        strokeWidth={(ICON_STROKE * 24) / ICON_BOX}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={iconOp}
        dangerouslySetInnerHTML={{ __html: ICONS[i] }}
      />
    )}
  </g>
);

const OneJobInParticular: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const { k, cx, cy } = cam;
  const s = sway(frame);
  const { tx, ty } = worldTransform(cx, cy, k);

  const dimT = smoothstep((frame - DIM_F0) / (DIM_F1 - DIM_F0));
  const clickT = Easing.inOut(Easing.sin)(clamp01((frame - CLICK_F0) / (CLICK_F1 - CLICK_F0)));

  const cols = COL_X.map((x, i) => {
    const v = stemV(i, frame);
    const y = levelY(v);
    const lit = Easing.out(Easing.quad)(clamp01((frame - CROSS_F[i] + 1) / CONVERT_DUR));
    let ring: string;
    if (i === HERO) ring = clickT > 0 ? toHigh(clickT) : toLit(lit);
    else if (lit >= 1) ring = toDim(dimT);
    else ring = toLit(lit);
    // a white ring (a job the AI cannot do) recedes in opacity, an orange one in tone
    const ringOp = i !== HERO && lit <= 0 ? INK_HI - (INK_HI - INK_LO) * dimT : 1;
    const iconOp = INK_HI - (INK_HI - INK_LO) * dimT;
    const stem = i === HERO ? needleTone(v) : toDimStem(needleTone(v), dimT);
    return { x, v, y, ring, ringOp, iconOp, stem, markFill: ring };
  });

  // the line runs behind each ring's hole: a mask with the ring discs cut out (userSpaceOnUse, on a wrapper, so a
  // zero-height line keeps its box)
  const hero = cols[HERO];
  const packets = packetsOn({
    frame,
    k,
    from: { x: hero.x, y: BASE_Y - 14 },
    to: { x: hero.x, y: hero.y + RING_R - 4 },
    period: 19,
    phase: 30,
    speed: 7,
    opacity: 1,
    seed: 5,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM0.cy}
        cx={cx}
        cxRest={CAM0.cx}
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
            <defs>
              <mask id="oneJob-holes" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={5080} height={5920}>
                <rect x={-2000} y={-2000} width={5080} height={5920} fill="#FFFFFF" />
                {cols.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={RING_R - STROKE / 2} fill="#000000" />
                ))}
              </mask>
            </defs>
            <g mask="url(#oneJob-holes)">
              <ChartLines />
            </g>
            {cols.map((c, i) => (
              <Stem key={`s${i}`} x={c.x} v={c.v} fill={c.stem} />
            ))}
            {packets.map((p, j) => (
              <circle
                key={`p${j}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={INK}
                opacity={0.75 * smoothstep(p.u / 0.12) * smoothstep((1 - p.u) / 0.12)}
              />
            ))}
            {cols.map((c, i) => (
              <g key={`r${i}`} opacity={c.ringOp}>
                <Ring k={k} x={c.x} y={c.y} ring={c.ring} icon={INK} iconOp={c.iconOp} i={i} markFill={c.markFill} />
              </g>
            ))}
          </svg>
          <LevelLabel k={k} which="best" inT={labelT(frame)} />
          <LevelLabel k={k} which="avg" inT={labelT(frame)} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// the six ordinary stems recede with their rings: their tone eases toward the deep end
const deepMix = makeTone(ACCENT, ACCENT_DEEP);
function toDimStem(c: string, t: number) {
  return t <= 0 ? c : t >= 1 ? ACCENT_DEEP : mixRgb(c, deepMix(1), t);
}
function mixRgb(a: string, b: string, t: number) {
  const pa = parse(a);
  const pb = parse(b);
  return `rgb(${pa.map((v, j) => Math.round(v + (pb[j] - v) * t)).join(",")})`;
}
function parse(c: string): number[] {
  if (c.startsWith("#")) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return c
    .replace(/[^0-9,]/g, "")
    .split(",")
    .map(Number);
}

export default OneJobInParticular;
