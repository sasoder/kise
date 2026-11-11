// ---------------------------------------------------------------------------
// SmarterCracksIt (rsi-derpy-interns, cut 97). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 172 frames.
//
// CHECK LINE: "today's AI intern has already cracked one of the seven Millennium Prize problems; a bigger,
// smarter version a year or two on steps up to the locked 'continual learning' problem and cracks that too."
//
// THE LINE: "… that the non-online learning models a year or two smarter than the ones that are currently
// solving millennium prize problems won't be able to crack it, even …" (it = continual learning).
// WORD -> FRAME: the 3 · non 9 · -online 17 · learning 27 · models 31 · a 40 · year 48 · or 54 · two 59 ·
//   smarter 62 · than 68 · the 82 · ones 85 · that 90 · are 92 · currently 95 · solving 106 · millennium 114 ·
//   prize 124 · problems 128 · won't 136 · be 151 · able 153 · to 156 · crack 159 · it 162 · even 169
//   (word_tables.md, composition frames).
// DURATION: the slot 97.931 -> 105.105 s = 7.174 s x 23.976 = 172 frames (f0..f171).
//
// THE MOTION: one white floor and one straight row of seven white squircle cards, one per Millennium Prize
// problem (white padlock = open; POINCARÉ white check = solved by a person; NAVIER–STOKES orange outline + orange
// check = solved by the AI), with one bigger dashed, padlocked card at the far right end, CONTINUAL LEARNING.
// f0: close (k 1.2) on today's orange intern (rsi-another-jump's AiFigure, age 1, OpenAI head, badge, cup)
// standing in the gap right of its orange NAVIER–STOKES card, POINCARÉ and P VS NP beside it, the row running
// off to the right. On "a year or two smarter" (f38-66) a bigger intern steps out of it, growing as it steps
// (age 1 -> 2.27, 1.7x the intern's height): drawn behind the intern (cut out round its silhouette), solid
// orange with cut 21's marching dashed forecast contour (jumpWorld ForecastOutline) = not real yet. The camera
// pulls back (k 1.2 -> 0.99) as it rises, so on "smarter" (f62) the small solid intern, its card and the
// dashed giant stand side by side. From "than the ones that are currently solving millennium prize problems"
// the giant walks right at constant speed BEHIND the row (the cards are filled with the field's own mean tone,
// so they look as before but hide its legs: it walks behind a counter of cards and every label reads as it
// passes); today's small intern stays in front of everything. The camera rides the walk, then on "currently
// solving millennium prize problems" eases back (k 0.77, f92-112) so POINCARÉ through BSD (six labels) read at
// once while the giant crosses behind them; the intern is left behind at its card (off frame from ~f75). Then
// the camera pushes on to the last card (in from ~f132). On "won't" the giant
// stops by it (f146) and on "be able to" its free (far) hand reaches out (f142-155) as the camera pushes in a
// little (k 1.04). On "crack" the card cracks: the dashes close and orange runs both ways round its outline
// from the hand, the padlock's shackle springs open, the padlock cross-fades out as an orange check writes in
// — it is now a card like NAVIER–STOKES. f166-171 settled and alive: breath, marching contour, creep, grid
// drift. No fade.
// CAUSE -> EFFECT: the far hand is on the card's left edge from ~f153 (target reached f155) -> crack starts
//   f155: shackle open f159, orange all round f163, check written f165.
// CAMERA: one key track (k, cx, floor's screen y held at 1062 so the giant's contour under its feet stays out
//   of the caption band) through the kit damper; the pan rides the walk's own eased travel (not the bobbing
//   pose), blended out to a wide frame over the row (WIDE) and back. Resolved f171: k 1.0374, cx 1862.46,
//   cy 878.43 (before sway).
// THE INTERN AT THE END: off frame left (1400 world px from the last card). Keeping it in would park the
//   payoff at the frame's right edge or shrink it to k ~0.7; the side-by-side comparison is f56-70.
// ROW LABELS: millenniumWorld's big variant (56 world = 43 screen px in the wide frame, the phone-size minimum of
//   42), long names wrapped at a syllable (POIN- CARÉ, RIE- MANN, P VS NP, NAVIER STOKES), smaller padlocks/checks.
// Orange = the AI, nothing else; white = people and structure (the floor, the cards, the labels); dashed = not
// real yet (the bigger future intern's contour, the continual-learning card).
//
// SOURCES: the seven Millennium Prize Problems (Clay Mathematics Institute): P vs NP, Hodge, Riemann,
// Yang–Mills, Navier–Stokes, Birch and Swinnerton-Dyer (shown as "BSD": the full name does not fit a card),
// Poincaré. Poincaré: solved by Grigori Perelman (2003). Navier–Stokes: solved by OpenAI's models (announced
// Sept 8 2026; Quanta, "AI Has Solved One of Math's $1 Million Millennium Prize Problems") — per the brief.
//
// THE WORLD is `millenniumWorld.tsx` (this clip, shared with cut 107) on rsi-another-jump's timelineWorld
// (the intern figure, its walk) and jumpWorld (the forecast contour), imported read-only.
// ---------------------------------------------------------------------------
import { DERPY_SHIFT_Y } from "./screenShift";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
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
  smoothstep,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { MARCH_PX_PER_F } from "../kits/dwarkesh/alignShared";
import { AiFigure, GROUND_Y, figureHeight, ageForHeight, figurePose, makeWalk } from "../rsi-another-jump/timelineWorld";
import { ForecastOutline, OUTLINE_GAP, OUTLINE_SW, SilhouetteCut } from "../rsi-another-jump/jumpWorld";
import {
  CARD_MARCH,
  CL_H,
  CL_LEFT,
  CL_TOP,
  CL_W,
  ContinualCard,
  ContinualLabel,
  Floor,
  GIANT_X,
  INTERN_X,
  MillenniumRowFilledBig,
  MillenniumRowLabelsBig,
  PoseFigure,
  ROW_LEFT,
  leftEdgeFraction,
  withReach,
} from "./millenniumWorld";

export const FPS = 24000 / 1001;
export const DURATION = 172;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the bigger, smarter intern ----------------------------------------------------------
/** 1.7x today's intern (the brief: 1.6-1.8x) */
export const GIANT_H = figureHeight(1) * 1.7;
export const AGE_G = ageForHeight(GIANT_H); // 2.27
const GROW_F0 = 38; // grows out of the intern on "a year or two smarter", stepping forward as it grows
const GROW_F1 = 66;
const WALK_F0 = 36;
const WALK_F1 = 146;
const WALK_EASE_IN = 18; // a slow first step while it grows, so the two stand side by side on "smarter"
const ageTime = (f: number) => 1 + (AGE_G - 1) * smoothstep(clamp01((f - GROW_F0) / (GROW_F1 - GROW_F0)));
// the walk's travel does not depend on age: solve the frame the hip reaches x, so age can follow time
const WALK_T = makeWalk({ x0: INTERN_X, x1: GIANT_X, f0: WALK_F0, f1: WALK_F1, easeIn: WALK_EASE_IN, easeOut: 12, ageAt: () => AGE_G });
const frameAtX = (x: number) => {
  let lo = WALK_F0;
  let hi = WALK_F1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (WALK_T.hipX(m) < x) lo = m;
    else hi = m;
  }
  return hi;
};
const WALK = makeWalk({
  x0: INTERN_X,
  x1: GIANT_X,
  f0: WALK_F0,
  f1: WALK_F1,
  easeIn: WALK_EASE_IN,
  easeOut: 12,
  ageAt: (x) => ageTime(frameAtX(x)),
});

// --- the reach and the crack -------------------------------------------------------------
const REACH_F0 = 142;
const CONTACT_F = 155; // the far hand is on the card's left edge (crack starts this frame)
const CRACK_FRAMES = 14;
const HAND_DY = 36; // the hand lands this far below the card's top
const HAND_TARGET = { x: CL_LEFT + 4, y: CL_TOP + HAND_DY };
const CONTACT = leftEdgeFraction(CL_W, CL_H, HAND_DY);

// --- the camera ------------------------------------------------------------------------------
// One key track (k, cx, and the floor's SCREEN y, so cy is solved from k and the floor holds just above the
// caption band) through the kit's damper. Moves are summed eased deltas.
const GS = 1062; // the floor's screen y: the giant's dashed contour under its feet stays above the caption band
const cyFor = (k: number) => GROUND_Y - (GS - 960) / k;
const CAM0 = { k: 1.2, cx: 75 };
/** Before the walk the pan is keyed on the intern (a slow drift right as the giant rises out of it). From
 *  HAND_F0 it hands over to the walk's own schedule (its eased travel, not the bobbing pose, a few frames early
 *  so the damper's lag is absorbed) plus a lead: the walking giant sits left of centre with the cards ahead of
 *  it clear, and the camera never has to catch up with it. Then one push-in onto the last card. */
const PAN_LEAD_F = 4;
const HAND_F0 = 40;
const HAND_F1 = 80;
const PAN_LEAD_X = 100;
const PRE = { f0: 0, f1: 64, dcx: 135 };
const MOVES = [
  { f0: 0, f1: 70, dk: -0.21, dcx: 0, warp: 1.6 }, // close on the intern, pulling back as the giant rises
  { f0: 120, f1: 160, dk: 0.045, dcx: 135, warp: 1 }, // it stops left of centre, the card right: push in
  { f0: 160, f1: DURATION, dk: 0.004, dcx: 4, warp: 1 }, // creep
];
/** "ones that are currently solving millennium prize problems" (f100-130): the camera stops riding the giant and
 *  eases back over the row so POINCARÉ through YANG–MILLS (and BSD's label) read at once while the giant walks
 *  across behind them; then it pushes on to the last card (the walk's track + MOVES, as before). */
const WIDE = { in0: 66, in1: 96, out0: 102, out1: 152, k: 0.77, cx0: 806, cx1: 822, drift0: 90, drift1: 114 };
const wideCx = (f: number) => WIDE.cx0 + (WIDE.cx1 - WIDE.cx0) * clamp01((f - WIDE.drift0) / (WIDE.drift1 - WIDE.drift0));
const CAM_TRACK = (() => {
  const target = (f: number) => {
    let k = CAM0.k;
    const pre = CAM0.cx + PRE.dcx * camEase((f - PRE.f0) / (PRE.f1 - PRE.f0), 1);
    const walk = WALK_T.hipX(f + PAN_LEAD_F) + PAN_LEAD_X;
    const w = camEase((f - HAND_F0) / (HAND_F1 - HAND_F0), 1);
    let cx = pre + w * (walk - pre);
    for (const m of MOVES) {
      const u = camEase((f - m.f0) / (m.f1 - m.f0), m.warp);
      k += m.dk * u;
      cx += m.dcx * u;
    }
    const wide = camEase((f - WIDE.in0) / (WIDE.in1 - WIDE.in0), 1) * (1 - camEase((f - WIDE.out0) / (WIDE.out1 - WIDE.out0), 1));
    k += wide * (WIDE.k - k);
    cx += wide * (wideCx(f) - cx);
    return { k, cx, cy: cyFor(k) };
  };
  const out: { k: number; cx: number; cy: number }[] = [];
  let { k, cx, cy } = target(0);
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k, cx, cy });
  for (let f = 1; f <= DURATION; f++) {
    const t = target(f);
    vk += (t.k - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (t.cx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (t.cy - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k, cx, cy });
  }
  return out;
})();
export const camAt = (f: number) => CAM_TRACK[Math.max(0, Math.min(DURATION, Math.round(f)))];
const CAM_REST = camAt(0);

const SmarterCracksIt: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = sway(frame);
  const k = cam.k;
  const cx = cam.cx + s.dx;
  const cy = cam.cy + s.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const march = frame * MARCH_PX_PER_F;

  // today's intern: standing at its card, alive
  const internPose = figurePose({ x: INTERN_X, age: 1, breathT: frame });

  // the bigger one: out of the intern, growing, then walking to the last card and reaching for it
  const gx = WALK.hipX(frame);
  const gAge = ageTime(frame);
  const gPose0 = figurePose({ x: gx, age: gAge, feet: WALK.feet(frame), gait: WALK.gaitW(frame), breathT: frame + 17 });
  const reachT = smoothstep(clamp01((frame - REACH_F0) / (CONTACT_F - REACH_F0)));
  const gPose = withReach(gPose0, HAND_TARGET, reachT);
  const crack = (frame - CONTACT_F) / CRACK_FRAMES;

  const world = {
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: 1080,
    height: 1920,
    transformOrigin: "0 0",
    transform: `translate(${tx}px, ${ty + DERPY_SHIFT_Y}px) scale(${k})`,
  };
  const svgStyle = { position: "absolute" as const, left: 0, top: 0, overflow: "visible" as const };

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM_REST.cy}
        cx={cx}
        cxRest={CAM_REST.cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div style={world}>
          <svg width={1080} height={1920} style={svgStyle}>
            <Floor k={k} x0={ROW_LEFT - 900} x1={CL_LEFT + CL_W + 900} />
            <ContinualCard k={k} crack={crack} contact={CONTACT} march={frame * CARD_MARCH} />
          </svg>
          <ContinualLabel k={k} />
          {/* the giant walks BEHIND the row (the cards are filled with the field's tone), so all seven labels read */}
          <svg width={1080} height={1920} style={svgStyle}>
            <defs>
              <mask id="internCut" maskUnits="userSpaceOnUse" x={-1e5} y={-1e5} width={2e5} height={2e5}>
                <rect x={-1e5} y={-1e5} width={2e5} height={2e5} fill="white" />
                <SilhouetteCut pose={internPose} grow={OUTLINE_GAP + OUTLINE_SW} />
              </mask>
            </defs>
            {frame >= GROW_F0 ? (
              <g mask="url(#internCut)">
                <PoseFigure k={k} g={gPose} />
                <ForecastOutline id="giantF" k={k} pose={gPose} march={march} />
              </g>
            ) : null}
          </svg>
          <svg width={1080} height={1920} style={svgStyle}>
            <MillenniumRowFilledBig k={k} />
          </svg>
          <MillenniumRowLabelsBig k={k} />
          <svg width={1080} height={1920} style={svgStyle}>
            <AiFigure id="intern" k={k} x={INTERN_X} age={1} breathT={frame} />
          </svg>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default SmarterCracksIt;
