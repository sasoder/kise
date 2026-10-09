import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DashedPath,
  FONT_SANS,
  FeatherWipe,
  HatchFill,
  INK_HI,
  RED_DEEP,
  RED_HI,
  RedBar,
  V_INK,
  V_PAPER,
  VStage,
  VintagePhoto,
  WetLine,
  clamp01,
  constPx,
  cumLen,
  inkDiffuse,
  lineW,
  mixHex,
  pointAtLen,
  redW,
  runVCamera,
  smoothstep,
  subPathD,
  worldBlur,
  wpx,
} from "./chinatalkVintage";
import type { DashMod, Pt, VCamKey } from "./chinatalkVintage";

// ---------------------------------------------------------------------------
// BrezhnevChoseDecay — cut B of Logan Wright, "Brezhnev chose decay" (ChinaTalk,
// slightly vintage; kit chinatalkVintage.tsx).
//
// CHECK LINE: in the 1960s there was a fork in the road, reform or drift, and
// Brezhnev set the switch to the road that goes down.
// SPOKEN LINE: "Brezhnev basically chose decay" (local frames: Brezhnev 1-12,
// basically 12-21, chose 21-36, decay 36-45).
// IN = edit frame 330 (13.750 s). Slot 53 f + 12 f living tail = 65 f at 24 fps.
// RED = the road taken (the Soviet economy's actual course). Dashed ink = the
// roads on offer.
//
// MOTION (one gesture): the whole picture is there on frame 0: the 1972
// portrait as a print above the caption strip, and under it a track that forks
// at a switch, both roads dashed, the blade lying toward the upper road
// (REFORM), a red wet line already coming along the track from the left edge
// at 12 px / f. On "chose" the blade swings to the lower road (f17-25, settled
// f25); the red bead touches the pivot ring at f26, its centre is on the pivot
// at f30, it runs over the blade and down the falling road, gathering speed
// as the road drops away (constant on the level, then a steady gain; off the
// right edge at f48), while the deep-red hatch wash soaks into the wedge
// between the old level and the falling line and the upper road and REFORM
// bleed away (f31-48). From f48: settled; the wash finishes (f52), one slow
// highlight travels the red line, the camera keeps its slow push (k 1.00 ->
// 1.045) to the last frame.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const SLOT = 53;
export const TAIL = 12;
export const DURATION = SLOT + TAIL;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the photograph ---------------------------------------------------------------
// Leonid Brezhnev, official portrait, 9 June 1972. Nationaal Archief (Anefo, 925-6564), CC0.
const PHOTO_SRC = "brezhnev/brezhnev_1972.jpg";
/** the picture window (the 14 px print border lies outside it): ends above the caption strip */
const PHOTO = { x: 200, y: 100, w: 680, h: 930 };
/** the whole plate (its shape is the window's): the head whole, the eyes at y ~ 400, both medals in */
const PHOTO_FOCUS = { x: 0.5, y: 0 };
const PHOTO_ZOOM = 1;

// --- the switch: a track, a junction, two roads -----------------------------------
/** the junction: the pivot of the blade, right under him */
const J: Pt = { x: 430, y: 1450 };
/** the track starts off the left frame edge; both roads run on past the right one */
const X_IN = -120;
const X_OUT = 1270;
/** the turnout: both roads leave the track tangent to it and take their heading within this run, centred on the pivot */
const TURN = 36;
/** blade length from the pivot, its thickness and the pivot ring's radius: SCREEN px at k = 1 */
const BLADE_LEN = 150;
const BLADE_W = 28;
const RING_R = 26;
/** each road runs straight along the blade (to this run from the turnout's start) before it bends away */
const HOLD = TURN + BLADE_LEN;
const X0 = J.x - TURN / 2;
/** run from the turnout's start to the right frame edge (world x 1080) */
const RUN = 1080 - X0;
const STEP = 4;

/** Height change of a road at run s from the start of the turnout: tangent to
 *  the track at 0, slope m from TURN to HOLD (the blade's stretch: that straight
 *  passes through the pivot), then steepening to slope mE at run RUN as
 *  ((s - HOLD) / (RUN - HOLD))^q. */
const roadDy = (s: number, m: number, mE: number, q: number) => {
  if (s <= TURN) return (m * s * s) / (2 * TURN);
  const lin = m * (s - TURN / 2);
  if (s <= HOLD) return lin;
  return lin + ((mE - m) * Math.pow(s - HOLD, q + 1)) / ((q + 1) * Math.pow(RUN - HOLD, q));
};
/** the end slope that makes a road of heading m change height by `dy` at the right frame edge */
const endSlope = (dy: number, m: number, q: number) => m + ((q + 1) * (dy - m * (RUN - TURN / 2))) / (RUN - HOLD);
const roadPts = (m: number, mE: number, q: number, sign: number): Pt[] => {
  const len = X_OUT - X0;
  const n = Math.ceil(len / STEP);
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = Math.min(len, i * STEP);
    return { x: X0 + s, y: J.y + sign * roadDy(s, m, mE, q) };
  });
};

/** the road down: leaves at LOW_M, then steeper and steeper (convex); crosses the right frame edge LOW_DROP under the level */
const LOW_M = 0.34;
const LOW_DROP = 445;
const LOW_Q = 1.5;
const LOWER = roadPts(LOW_M, endSlope(LOW_DROP, LOW_M, LOW_Q), LOW_Q, 1);
/** the road up (REFORM): one gentle straight climb to y 1290 at the right frame edge */
const UP_RISE = 160;
const UP_M = UP_RISE / (RUN - TURN / 2);
const UPPER = roadPts(UP_M, UP_M, 1, -1);
const INCOMING: Pt[] = [
  { x: X_IN, y: J.y },
  { x: X0, y: J.y },
];

/** the red line's whole course: along the track, through the junction, down the lower road */
const RED_PATH: Pt[] = [{ x: X_IN, y: J.y }, ...LOWER];
const RED_CUM = cumLen(RED_PATH);
const RED_TOTAL = RED_CUM[RED_CUM.length - 1];
/** arc length of the pivot on RED_PATH (the turnout adds under 0.1 px) */
const S_J = J.x - X_IN;
const RED_END = RED_PATH[RED_PATH.length - 1];
const RED_END_DIR = (() => {
  const a = RED_PATH[RED_PATH.length - 2];
  const d = Math.hypot(RED_END.x - a.x, RED_END.y - a.y);
  return { x: (RED_END.x - a.x) / d, y: (RED_END.y - a.y) / d };
})();
/** world x at arc length s of the red course (continues straight past its end) */
const redXAt = (s: number) => (s <= RED_TOTAL ? pointAtLen(RED_PATH, RED_CUM, s).x : RED_END.x + (s - RED_TOTAL) * RED_END_DIR.x);
/** arc length of the red course where it crosses world x (x past the turnout) */
const redArcAtX = (x: number) => {
  const i = Math.max(1, Math.min(RED_PATH.length - 2, RED_PATH.findIndex((p, j) => j > 0 && p.x >= x)));
  const a = RED_PATH[i - 1];
  const b = RED_PATH[i];
  return RED_CUM[i - 1] + ((x - a.x) / (b.x - a.x)) * (RED_CUM[i] - RED_CUM[i - 1]);
};

/** the wedge between the level the track came in on and the falling road */
const WEDGE: Pt[] = [...LOWER, { x: RED_END.x, y: J.y }];

// --- the blade ----------------------------------------------------------------------
/** the blade lies along a road's straight first stretch: both straights pass through the pivot */
const BLADE_UP = -Math.atan(UP_M);
const BLADE_DOWN = Math.atan(LOW_M);
/** ink at INK_HI as one opaque colour, so nothing shows through the switch */
const SWITCH_INK = mixHex(V_PAPER, V_INK, INK_HI);
/** the one eased turn, on "chose" (21-36): it has settled on SWING_F0 + SWING_F, before the bead touches the ring */
const SWING_F0 = 17;
const SWING_F = 8;

// --- the red line's clock ---------------------------------------------------------------
/** the frame the tip's centre is on the pivot */
const T_J = 30;
/** its one speed along the level track, world px per frame */
const V0 = 12;
/** the frame the tip leaves by the right frame edge (world x EXIT_X at the push's zoom then) */
const T_EXIT = 48;
const EXIT_X = 1062;
/** past the junction it gathers speed as the road falls away: the steady gain per frame that gets it out on T_EXIT */
const ACC = (2 * (redArcAtX(EXIT_X) - S_J - V0 * (T_EXIT - T_J))) / ((T_EXIT - T_J) * (T_EXIT - T_J));
/** arc length written at frame S */
const arcAt = (S: number) => {
  const t = S - T_J;
  return t <= 0 ? S_J + V0 * t : S_J + V0 * t + 0.5 * ACC * t * t;
};
/** the frame arc length s was written */
const frameAt = (s: number) => (s <= S_J ? T_J + (s - S_J) / V0 : T_J + (-V0 + Math.sqrt(V0 * V0 + 2 * ACC * (s - S_J))) / ACC);

// --- the wash: RED_DEEP wash + hatch soaking into the wedge behind the tip -----------------------
/** the soak front follows the tip this many frames behind, with a soft front this wide (world px) */
const SOAK_LAG = 1.5;
const SOAK_FEATHER = 100;
/** the "below the line" material, raised until it is the most saturated area of the frame */
const WASH_FILL = 0.5;
const WASH_HATCH = 0.8;
const WASH_PITCH = 13;
const WASH_LINE = 3.5;

// --- the road not taken bleeds away ------------------------------------------------------
/** starts BLEED_AFTER frames after the red passes the pivot, runs out along the road over BLEED_RUN, each dash diffusing over BLEED_F */
const BLEED_AFTER = 1;
const BLEED_RUN = 6;
const BLEED_F = 11;
const LABEL_BLEED_AFTER = 4;
const LABEL_BLEED_F = 12;
/** REFORM names the road not taken and must read at phone width: the kit's word label (Source Sans 3 SemiBold
 *  caps, tracked 0.12 em, cap height 0.669 em) at a hand-set NAME_PX on screen instead of WORD_PX */
const NAME_PX = 62;
const NAME_TRACK = 0.12;
const NAME_CAP = 0.669;
/** the centre of its capitals: inside the V, 22 px under the upper road at its left end, 16 px above the level
 *  the wash will hang from, its right end 60 px inside the frame */
const REFORM_AT: Pt = { x: 886, y: 1413 };

// --- the travelling highlight (the settled frame's life) ---------------------------------------
/** it follows the tip's course this many frames behind; half its length along the line, world px */
const GLINT_DELAY = 40;
const GLINT_HALF = 70;

// --- the camera: one slow push toward the switch --------------------------------------------
/** the push's fixed point (between the portrait and the junction, so the print's top stays in frame) */
const PUSH: Pt = { x: 470, y: 1300 };
const pushKey = (f: number, k: number, ease?: VCamKey["ease"]): VCamKey => ({
  f,
  x: PUSH.x + (540 - PUSH.x) / k,
  y: PUSH.y + (960 - PUSH.y) / k,
  k,
  ease,
});
const camAt = runVCamera([pushKey(-24, 0.99), pushKey(76, 1.058, "linear")], DURATION);
const REST = camAt(0);

const Glint: React.FC<{ at: number; len: number; k: number }> = ({ at, len, k }) => {
  const s0 = Math.max(0, at - GLINT_HALF);
  const s1 = Math.min(len, RED_TOTAL, at + GLINT_HALF);
  if (s1 - s0 < 1) return null;
  const a = pointAtLen(RED_PATH, RED_CUM, at - GLINT_HALF);
  const b = pointAtLen(RED_PATH, RED_CUM, at + GLINT_HALF);
  return (
    <g>
      <defs>
        <linearGradient id="bcd-glint" gradientUnits="userSpaceOnUse" x1={a.x.toFixed(2)} y1={a.y.toFixed(2)} x2={b.x.toFixed(2)} y2={b.y.toFixed(2)}>
          {[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1].map((o) => (
            <stop key={o} offset={o} stopColor={RED_HI} stopOpacity={(0.95 * smoothstep(1 - Math.abs(2 * o - 1))).toFixed(4)} />
          ))}
        </linearGradient>
      </defs>
      <path d={subPathD(RED_PATH, RED_CUM, s0, s1)} fill="none" stroke="url(#bcd-glint)" strokeWidth={redW(k).toFixed(3)} strokeLinecap="butt" strokeLinejoin="round" />
    </g>
  );
};

/** The road's name: drawn as the kit Label draws a word (same face, weight, tracking, size law), at NAME_PX. It is
 *  part of the scene from frame 0; `diffuse` (0..1) retires it like ink on wet paper, in place. */
const RoadName: React.FC<{ text: string; x: number; y: number; k: number; diffuse: number }> = ({ text, x, y, k, diffuse }) => {
  const d = inkDiffuse(diffuse);
  if (d.opacity <= 0.002) return null;
  const fs = Math.max(wpx(NAME_PX, k), constPx(NAME_PX, k));
  const s = 1 + (diffuse > 0 ? d.spread : 0);
  return (
    <g opacity={(INK_HI * d.opacity).toFixed(4)} style={{ filter: diffuse > 0 ? worldBlur(d.blur, k) : undefined }}>
      <text
        x={(x + (NAME_TRACK / 2) * fs).toFixed(3)}
        y={(y + (NAME_CAP / 2) * fs).toFixed(3)}
        fontFamily={FONT_SANS}
        fontWeight={600}
        fontSize={fs.toFixed(3)}
        letterSpacing={`${NAME_TRACK}em`}
        textAnchor="middle"
        fill={V_INK}
        transform={s !== 1 ? `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)}) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})` : undefined}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
};

const BrezhnevChoseDecay: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;

  // the red line
  const len = arcAt(S);
  // the blade
  const ang = BLADE_UP + (BLADE_DOWN - BLADE_UP) * smoothstep((S - SWING_F0) / SWING_F);
  const dir = { x: Math.cos(ang), y: Math.sin(ang) };
  const bw = wpx(BLADE_W, k);
  const bl = wpx(BLADE_LEN, k);
  // the road not taken
  const bleed0 = T_J + BLEED_AFTER;
  const upperMod = (_i: number, sMid: number, total: number): DashMod => {
    const u = clamp01((S - bleed0 - (sMid / total) * BLEED_RUN) / BLEED_F);
    if (u <= 0) return null;
    const d = inkDiffuse(u);
    return { opacity: d.opacity, blur: d.blur, spread: d.spread };
  };
  const upperGone = S >= bleed0 + BLEED_RUN + BLEED_F;
  // the wash
  const soakX = redXAt(Math.max(S_J, arcAt(S - SOAK_LAG)));
  const soakU = (soakX - X0) / (RED_END.x - X0 + SOAK_FEATHER);

  return (
    <VStage S={S} cam={cam} rest={REST} photos={<VintagePhoto src={PHOTO_SRC} box={PHOTO} focus={PHOTO_FOCUS} zoom={PHOTO_ZOOM} />}>
      {/* the wash under the falling line: RED_DEEP wash + hatch, soaking in behind the tip */}
      <FeatherWipe id="bcd-soak" box={{ x0: X0, y0: J.y - 10, x1: RED_END.x, y1: RED_END.y + 10 }} u={soakU} feather={SOAK_FEATHER} dir="right">
        <HatchFill
          id="bcd-wash"
          region={WEDGE}
          k={k}
          color={RED_DEEP}
          fill={WASH_FILL}
          lineOpacity={WASH_HATCH}
          pitch={WASH_PITCH}
          width={WASH_LINE}
          angleDeg={-45}
          anchor={J}
        />
      </FeatherWipe>

      {/* the track and the two roads on offer: dashed ink, marching */}
      <DashedPath points={INCOMING} k={k} S={S} />
      {upperGone ? null : <DashedPath points={UPPER} k={k} S={S} dashMod={upperMod} />}
      <DashedPath points={LOWER} k={k} S={S} />
      <RoadName text="Reform" x={REFORM_AT.x} y={REFORM_AT.y} k={k} diffuse={clamp01((S - T_J - LABEL_BLEED_AFTER) / LABEL_BLEED_F)} />

      {/* the switch: the blade on its pivot ring */}
      <RedBar
        id="bcd-blade"
        from={{ x: J.x - (dir.x * bw) / 2, y: J.y - (dir.y * bw) / 2 }}
        to={{ x: J.x + dir.x * bl, y: J.y + dir.y * bl }}
        width={bw}
        k={k}
        color={SWITCH_INK}
        shadow={false}
      />
      <circle
        cx={J.x}
        cy={J.y}
        r={wpx(RING_R, k).toFixed(3)}
        fill={V_PAPER}
        stroke={SWITCH_INK}
        strokeWidth={lineW(k).toFixed(3)}
      />

      {/* the road taken */}
      <WetLine id="bcd-red" points={RED_PATH} len={len} k={k} bead={1} ageAt={(s) => S - frameAt(s)} />
      <Glint at={arcAt(S - GLINT_DELAY)} len={len} k={k} />
    </VStage>
  );
};

export default BrezhnevChoseDecay;
