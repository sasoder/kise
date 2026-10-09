import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import { hash } from "./fieldShared";
import {
  BLUE,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  CROWN_STEP,
  EASE_LAND,
  Inked,
  OP_LOW,
  OP_MID,
  ORANGE,
  PAPER_BASE,
  PAPER_BLUR,
  PAPER_DIM,
  PAPER_PARALLAX,
  PAPER_SRC,
  PURPLE,
  Person,
  SHADOW_OFF,
  camEase,
  clamp,
  runCamera2,
  sway,
  textRise,
} from "./cerroShared";

export const FPS = 24;
// Trailer sequence SRT: "The old caretaker handed me this keyring with like 80
// keys on it. And he's just like — good luck". The graphic opens on "The",
// trailer 26.526 s, and ENDS on the onset of "good luck", 30.989 s, where the
// editor cuts back to Brent's face: round((30.989 - 26.526) * 24) = 107. Plus
// an 8-frame HANDLE that simply continues the hold, so the editor can trim to
// the cut point: 107 + 8 = 115.
export const DURATION = 115;

// ---------------------------------------------------------------------------
// "EIGHTY KEYS", TALL — the 9:16 sibling (1080 x 1920) of `EightyKeys.tsx`
// v4 (no text), cut 4 of the Cerro Gordo set. Same audio, same 115 frames,
// same word table, same gestures. The 16:9 file is not touched; this is a
// copy with the staging and the camera turned for a tall frame.
//
// CHECK LINE: "What he was handed wasn't a key, it was a whole ring of them:
// far too many for one person to know what they open."
//
// WORD -> FRAME:  The old caretaker f0 | caretaker f17 | handed me this
//   keyring f32 | keyring f38 | with like f54 | 80 f63 | keys f78 | on it f88 |
//   And he's just like f95 | good luck (CUT POINT) f107, handle to f114.
//
// TRANSLATED UNCHANGED from the 16:9 v4: the hoop (14 px stroke, r 155), the
// 80 chunky skeleton keys in three layers (22 / 28 / 30 at 1.0 / 0.55 / 0.3),
// their hanging rule, slots and paint order, the crown clipped outside the
// hoop (f59 / 61 / 63), the fan f60-76, the 10 px dip, the f81 sway, the
// caretaker's rise, the pendulum's constants, no text.
//
// REIMAGINED for the tall frame (v2 of the tall cut, on the director's review:
// the first take opened small in the upper-left third):
//   * IT OPENS BIG AND CENTRED. k 1.06: the caretaker is ~520 screen px tall,
//     the hoop with its five keys at his side, the group ~82% of the frame
//     width (x 97-983) around the frame middle (centre ~x 540, y 860).
//   * THE HANDOVER IS VERTICAL. Vertical travel is cheap here: the hoop's top
//     leaves his side, goes a little out to the right and comes DOWN 740 world
//     px into the centre column (16:9: 880 px across). The camera follows it
//     down, so he slides out through the TOP of the frame, gone at f59, at most
//     42 screen px/frame, growing only 1.06 -> 1.31 as he goes.
//   * THE PENDULUM, with a sixth of the 16:9 toss's sideways travel, is given a
//     shorter effective length (130 world, 16:9: 300) to keep its swing:
//     +18.9 deg trailing at f38, -8.5 deg forward at f45, still by ~f60.
//   * THE HOOP IS ALREADY BIG: 404 screen px across at f45, 420+ from f48,
//     428 at f63, arriving with its centre on screen y ~740.
//   * THE PAYOFF SITS ON THE TRUE MIDDLE (pass 3: the first framing kept the
//     bits above the caption strip and left the lower half of the frame
//     empty). f61-78 the camera moves in 1.32 -> 1.50: the crown's top on
//     screen y 430, the hoop's centre on 727, the lowest bits ~1318, the bunch
//     ~90% of the frame width. Shanks and bits pass through the caption strip;
//     the hoop, the crown and the upper keys carry the read.
//   * THE HOLD IS ALIVE: the closing creep is +4% over f81-115 (16:9: +1.5%),
//     the hoop's centre held still on screen, alongside the sway.
//   * FRONT LAYER 20 keys, mid 30, back 30 (16:9: 22 / 28 / 30; still 80): a
//     touch more paper between the front shanks at this scale. The hard shadow
//     is the same 4 world px = 6 screen px at k 1.5.
//   * The ground is PeakForSolar's portrait paper (rotated 90 deg), local.
//
// THE CAMERA (damped by the house tracker; cy from the eased k and an anchor):
//   OPEN   f0-19   k 1.06 -> 1.068, the group's centre on screen y 860.
//   FOLLOW f19-60  k 1.068 -> 1.32, x 564 -> 960, down to the arrived bunch on
//                  screen y 880 (zoom and pan lead on warp 0.7).
//   IN     f61-78  k 1.32 -> 1.50 (warp 0.75), crown top -> screen y 430.
//   CREEP  f81-115 k 1.50 -> 1.56 (+4%), the hoop's centre held on screen y 727.
//   DAMPED NUMBERS (tall/probe.ts; alpha = the hoop's swing, deg clockwise;
//   crown / bottom = screen y of the crown's top and the lowest bit):
//     f    k        cx      cy      alpha   crown  bottom
//     0    1.0600   564.0   130.5    0.00
//     17   1.0658   568.4   130.0    0.00
//     32   1.1365   676.0   231.7    2.02
//     38   1.1895   758.0   371.6   18.88
//     45   1.2451   844.1   580.4   -8.52
//     54   1.2963   923.3   823.4    1.88    673   1440
//     63   1.3205   956.7   947.3   -0.19    504   1285
//     70   1.3844   959.9   958.4    0.01    467   1285
//     78   1.4750   960.0   956.1    0.00    438   1310
//     88   1.5020   960.0   955.1    2.82    430   1318
//     114  1.5552   960.0   949.8   -0.23    419   1339
// ---------------------------------------------------------------------------

export const schema = z.object({
  keyCount: z.number().int(),
  beats: z.object({
    rise: z.number(), // "The old caretaker"   — he rises with the hoop
    toss: z.number(), // "handed me"           — the arc starts
    land: z.number(), // the arc lands, ahead of "with like"
    echo: z.number(), // "80" lead             — the hoop's crown (orange)
    fan: z.number(), // the fan starts out of the bunch
    fanEnd: z.number(), // the last keys reach the top sides
    sway: z.number(), // the weight: the hoop swings once, peak on "on it"
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  keyCount: 80,
  beats: {
    rise: -2, // already 2 f into its rise at the cut, so f0 is never a blank sheet
    toss: 30,
    land: 53,
    echo: 59,
    fan: 60,
    fanEnd: 78,
    sway: 81,
  },
});

// ---------------------------------------------------------------------------
// GEOMETRY (world px). The world was laid out (v2/v3) so the rest camera was
// k 1.0; v4 frames the rest at K_FRAME (~1.27) now the text is gone.
// ---------------------------------------------------------------------------
const HOOP_R = 155; // hoop centre-line radius
const HOOP_W = 14; // the hoop's stroke (the director's 14 screen px at rest)
const HOOP_OUT = HOOP_R + HOOP_W / 2;
// A skeleton key, drawn along +x from its bow's centre: a bold antique-key
// icon that reads at half size on its own. v3 sizes (the director's): ~210 px
// overall, a 64 px bow with a 26 px hole, a collar ring, an 18 px shank, a
// 44 x 38 bit with two clear notches.
const BOW_OUT = 32; // bow outer radius -> 64 px across
const BOW_HOLE = 13; // -> 26 px hole
const BOW_R = (BOW_OUT + BOW_HOLE) / 2; // band centre-line, 22.5
const BOW_BAND = BOW_OUT - BOW_HOLE; // 19
const SHANK = 18;
const BIT_L = 44; // bit length along the shank
const BIT_D = 38; // bit depth from the shank's centre-line
const NOTCH_W = 9;
const NOTCH_D = 15;
// The bow hangs OUTSIDE the hoop: its centre sits BOW_R out from the hoop's
// centre-line, RADIALLY, so the hoop runs along the top of the bow's hole and
// the loop shows below it. The key then hangs from its bow's centre.
const BOW_HANG = BOW_R;
// Three depth layers, back to front: density by layer, not by count. The front
// layer is few enough that paper shows between its shanks; the mid and back
// fill in behind on the 0.55 and 0.3 rungs, each offset by half a slot.
const LAYERS = [
  { name: "back", n: 30, len: 196, opacity: OP_LOW, offset: 0, span: 0.93 },
  { name: "mid", n: 30, len: 186, opacity: OP_MID, offset: 0.5, span: 0.97 },
  { name: "front", n: 20, len: 178, opacity: 1, offset: 0, span: 1 },
] as const;
const LEN_FRONT = LAYERS[2].len + BOW_HANG; // hoop -> tip
const LEN_BACK = LAYERS[0].len + BOW_HANG;
// Gravity: a key's hanging angle is radial-outward mixed toward straight down.
const GRAVITY_MIX = 0.65;
// Bow centres at phi = 90 +- 104; with each bow's own +-10 deg of width the
// keys' ink covers the hoop's lower ~240 deg and the crown's ends sit on paper.
const PHI_SPAN = 104;

// -- the tall frame ------------------------------------------------------------
const FRAME_W = 1080;
const FRAME_H = 1920;

const RC = { x: 960, y: 800 }; // hoop centre at rest
const PIVOT_END = { x: RC.x, y: RC.y - HOOP_R }; // the hoop hangs from its top

// THE CARETAKER, UPPER-LEFT. `Person` takes the 512-box's top-left and side.
// The glyph's ink runs 0.078..0.918 of the box vertically and 0.08..0.92
// sideways. Horizontal room is tight in a tall frame, so the handover is
// staged on a DIAGONAL: he stands up and to the left, the hoop travels DOWN
// and right to the centre column.
const PERSON_S = 588; // ink 494 world tall -> 330 screen px at the open k 0.668
const PERSON_RIGHT = 640; // world x of his ink's right edge
const DROP = 740; // world px the hoop's top travels DOWN in the handover
const PIVOT_START = {
  x: PERSON_RIGHT + HOOP_OUT + 18,
  y: PIVOT_END.y - DROP,
};
// The hoop hangs in his hand at his side, from about his collar.
const PERSON_BOX = {
  x: PERSON_RIGHT - 0.92 * PERSON_S,
  y: PIVOT_START.y - 0.5 * PERSON_S,
};
// The arc's control point: out to the right and a little up, so the hoop is
// lobbed across and then drops into the centre column.
const PIVOT_CTRL = {
  x: PIVOT_END.x + 70,
  y: PIVOT_START.y + 0.3 * DROP,
};

const DIP = 10; // world px the hoop dips under the load (see THE WEIGHT)
const CROWN_TOP = RC.y - HOOP_OUT - 3 * CROWN_STEP;
const BUNCH_BOTTOM = RC.y + HOOP_R + LEN_BACK + 6 + DIP + SHADOW_OFF;

// The opening group: the glyph's ink to the bunch's tips.
const OPEN_TOP = PERSON_BOX.y + 0.078 * PERSON_S;
const OPEN_BOTTOM = PIVOT_START.y + 2 * HOOP_R + LEN_FRONT;
const C_OPEN = (OPEN_TOP + OPEN_BOTTOM) / 2;
const X_OPEN = (PERSON_BOX.x + 0.08 * PERSON_S + PIVOT_START.x + HOOP_OUT) / 2;
// The bunch on arrival: hoop top to the hanging tips.
const C_ARRIVE = (PIVOT_END.y + PIVOT_END.y + 2 * HOOP_R + LEN_FRONT) / 2;

// ---------------------------------------------------------------------------
// THE CAMERA, re-authored for the tall frame on the same damped rig. A key is
// k, cx and an ANCHOR: world y `wy` held on screen y `sy`; cy comes off the
// SAME eased k (cy = wy + (FRAME_H / 2 - sy) / k), one key per frame, so zoom
// and framing settle together (camMove169's rule, with a free screen target).
// ---------------------------------------------------------------------------
const K_OPEN = 1.06; // the caretaker ~520 screen px tall, the group ~82% of the width
const K_OPEN2 = 1.068;
const K_PUSH = 1.32; // 1.25x the open; the hoop is 428 screen px across
const K_FRAME = 1.5; // the hoop of 80 keys ~90% of the frame width
const K_REST2 = K_FRAME * 1.04; // the closing creep: +4%, so the hold is alive
const SY_OPEN = 860; // the opening group, around the frame middle
const SY_ARRIVE = 880; // puts the arriving hoop's centre on ~739, the payoff's 727
const SY_CROWN = 430; // the crown's top at rest: the bunch on the true middle

type Move = { F: number[]; K: number[]; CY: number[]; CX: number[] };
const camMoveTall = (m: {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  x0: number;
  x1: number;
  wy0: number;
  wy1: number;
  sy0: number;
  sy1: number;
  warp?: number;
  kWarp?: number; // the zoom's own warp (< 1 = the push leads the pan)
}): Move => {
  const out: Move = { F: [], K: [], CY: [], CX: [] };
  const span = m.f1 - m.f0;
  for (let i = 0; i <= span; i++) {
    const g = camEase(i / span, m.warp ?? 1);
    const k = m.k0 + (m.k1 - m.k0) * camEase(i / span, m.kWarp ?? m.warp ?? 1);
    const wy = m.wy0 + (m.wy1 - m.wy0) * g;
    const sy = m.sy0 + (m.sy1 - m.sy0) * g;
    out.F.push(m.f0 + i);
    out.K.push(k);
    out.CX.push(
      m.x0 + (m.x1 - m.x0) * camEase(i / span, m.kWarp ?? m.warp ?? 1),
    );
    out.CY.push(wy + (FRAME_H / 2 - sy) / k);
  }
  return out;
};

const M0 = camMoveTall({
  f0: 0,
  f1: 19,
  k0: K_OPEN,
  k1: K_OPEN2,
  x0: X_OPEN,
  x1: X_OPEN + 6,
  wy0: C_OPEN,
  wy1: C_OPEN,
  sy0: SY_OPEN,
  sy1: SY_OPEN,
});
const M1 = camMoveTall({
  f0: 19,
  f1: 60,
  kWarp: 0.7,
  k0: K_OPEN2,
  k1: K_PUSH,
  x0: X_OPEN + 6,
  x1: RC.x,
  wy0: C_OPEN,
  wy1: C_ARRIVE,
  sy0: SY_OPEN,
  sy1: SY_ARRIVE,
});
// the settle: from the bunch's centre on 900 to the crown's top on 328, i.e.
// the same world point re-expressed, so the anchor does not jump
const ARRIVE_CY = C_ARRIVE + (FRAME_H / 2 - SY_ARRIVE) / K_PUSH;
const REST_CY = CROWN_TOP + (FRAME_H / 2 - SY_CROWN) / K_FRAME;
const M2: Move = (() => {
  const out: Move = { F: [], K: [], CY: [], CX: [] };
  const f0 = 61;
  const f1 = 78;
  for (let i = 0; i <= f1 - f0; i++) {
    const g = camEase(i / (f1 - f0), 0.75);
    const k = K_PUSH + (K_FRAME - K_PUSH) * g;
    // interpolate the SCREEN position of the crown's top, then solve cy
    const syA = FRAME_H / 2 + (CROWN_TOP - ARRIVE_CY) * K_PUSH;
    const sy = syA + (SY_CROWN - syA) * g;
    out.F.push(f0 + i);
    out.K.push(k);
    out.CX.push(RC.x);
    out.CY.push(CROWN_TOP + (FRAME_H / 2 - sy) / k);
  }
  return out;
})();
// the creep holds the HOOP'S CENTRE still on screen
const HOOP_SY = FRAME_H / 2 + (RC.y - REST_CY) * K_FRAME;
const M3 = camMoveTall({
  f0: 81,
  f1: 115,
  k0: K_FRAME,
  k1: K_REST2,
  x0: RC.x,
  x1: RC.x,
  wy0: RC.y,
  wy1: RC.y,
  sy0: HOOP_SY,
  sy1: HOOP_SY,
});

const join = (...moves: Move[]) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  for (const m of moves) {
    m.F.forEach((f, i) => {
      if (F.length && f <= F[F.length - 1]) return;
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CX.push(m.CX[i]);
    });
  }
  return { F, K, CY, CX };
};
export const CAM = join(M0, M1, M2, M3);
export const camAt = (f: number) => runCamera2(f, CAM.F, CAM.CY, CAM.CX, CAM.K);

// ---------------------------------------------------------------------------
// THE GROUND, portrait: PeakForSolar's PaperGround. The landscape photograph
// (3864 x 2164) turned 90 deg in a 1920*1.6 x 1080*1.6 box, objectFit cover =
// 0.7985 of source; at this cut's tightest (k 1.56, bgScale 1.168) 0.933 — never
// upscaled. brightness(0.88) blur(3px) on the image only, parallax 0.15 in
// both axes, drift -0.3 px/frame, root #C0C0C0.
// ---------------------------------------------------------------------------
const BG_OVERSIZE = 1.6;
const PaperGroundTall: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  cxRest: number;
  cyRest: number;
  k: number;
}> = ({ frame, cx, cy, cxRest, cyRest, k }) => {
  const bgY = -(cy - cyRest) * k * PAPER_PARALLAX - frame * 0.3;
  const bgX = -(cx - cxRest) * k * PAPER_PARALLAX;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      <Img
        src={staticFile(PAPER_SRC)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${PAPER_DIM}) blur(${PAPER_BLUR}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** The world layer: a 1080 x 1920 SVG under translate + scale(k). */
const WorldTall: React.FC<{
  cx: number;
  cy: number;
  k: number;
  children: React.ReactNode;
}> = ({ cx, cy, k, children }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: FRAME_W,
        height: FRAME_H,
        transformOrigin: "0 0",
        transform: `translate(${FRAME_W / 2 - cx * k}px, ${FRAME_H / 2 - cy * k}px) scale(${k})`,
      }}
    >
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {children}
      </svg>
    </div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// THE HANDOVER: the pivot's arc, and the pendulum it drives (the whole hoop).
// ---------------------------------------------------------------------------
const TOSS_EASE = Easing.bezier(0.45, 0, 0.2, 1);
const pivotAt = (f: number, toss: number, land: number) => {
  const u = TOSS_EASE(Math.max(0, Math.min(1, (f - toss) / (land - toss))));
  const a = (1 - u) * (1 - u);
  const b = 2 * (1 - u) * u;
  const c = u * u;
  return {
    x: a * PIVOT_START.x + b * PIVOT_CTRL.x + c * PIVOT_END.x,
    y: a * PIVOT_START.y + b * PIVOT_CTRL.y + c * PIVOT_END.y,
  };
};

// A damped pendulum, angle in degrees-clockwise (SVG's rotate sense): in the
// pivot's accelerating frame l * a'' = -(g - ay) sin a + ax cos a, plus
// 2 * zeta * w0 damping.
const PEND_W0 = (2 * Math.PI) / 16; // natural period 16 f
// 16:9 uses 300; the tall toss has a sixth of the sideways travel, so the
// bunch is given a shorter effective length to get the same ~+-15 deg swing
const PEND_L = 130;
const PEND_G = PEND_W0 * PEND_W0 * PEND_L;
const PEND_ZETA = 0.6; // one visible overshoot, the next is under a degree
const SUB = 8;

export const simulatePendulum = (toss: number, land: number, upto: number) => {
  const out: number[] = [0];
  let a = 0;
  let w = 0;
  const h = 1 / SUB;
  const acc = (t: number) => {
    const e = 0.25;
    const p0 = pivotAt(t - e, toss, land);
    const p1 = pivotAt(t, toss, land);
    const p2 = pivotAt(t + e, toss, land);
    return {
      x: (p2.x - 2 * p1.x + p0.x) / (e * e),
      y: (p2.y - 2 * p1.y + p0.y) / (e * e),
    };
  };
  for (let f = 1; f <= upto; f++) {
    for (let s = 0; s < SUB; s++) {
      const t = f - 1 + s * h;
      const ac = acc(t);
      const dd =
        (-(PEND_G - ac.y) * Math.sin(a) + ac.x * Math.cos(a)) / PEND_L -
        2 * PEND_ZETA * PEND_W0 * w;
      w += dd * h;
      a += w * h;
    }
    out.push((a * 180) / Math.PI);
  }
  return out;
};
const PEND = simulatePendulum(
  defaultProps.beats.toss,
  defaultProps.beats.land,
  DURATION,
);

// THE WEIGHT: the hoop dips as the keys load it, then swings once.
const dipAt = (f: number, fan: number, fanEnd: number) =>
  DIP * camEase((f - (fan + 4)) / (fanEnd + 6 - (fan + 4)), 1);
const SWAY_A = 3.0; // deg
const SWAY_T = 36; // frames
const SWAY_TAU = 13;
const swayAt = (f: number, f0: number) => {
  if (f <= f0) return 0;
  const t = f - f0;
  const ramp = 1 - Math.exp(-t / 3); // the angular velocity starts at 0
  return (
    SWAY_A *
    ramp *
    Math.sin((2 * Math.PI * t) / SWAY_T) *
    Math.exp(-t / SWAY_TAU) *
    1.9
  );
};

// ---------------------------------------------------------------------------
// THE KEYS
// ---------------------------------------------------------------------------
type KeySpec = {
  i: number;
  layer: number; // 0 back .. 2 front
  phi: number; // where its bow hangs on the hoop, deg, SVG sense (90 = bottom)
  phi0: number; // where it starts the fan
  len: number;
  jit: number; // its own small deviation from the hanging angle, deg
  bow: number; // 0 round, 1 trefoil, 2 oval
  bit: number; // tooth pattern
  side: 1 | -1; // which side of the shank the bit hangs
  bunch: boolean; // one of the five in his hand from the start
};

/** The hanging angle of a key whose bow is at `phi` on the hoop. */
const hangAngle = (phi: number) => phi + GRAVITY_MIX * (90 - phi);

// SLOTS BY SEPARATION. Neighbouring keys are separated by their arc pitch
// times sin(A), A being the angle between the hoop's tangent and the hanging
// key: 1 at the bottom (keys hang across the hoop), ~0.23 at the upper sides
// (keys hang almost along it, like shingles). So the slot density follows
// sin(A) — dense at the bottom where a real bunch is heaviest, sparse up the
// sides — and the gap between neighbours is even all the way round.
const SLOT_TABLE = (() => {
  const N = 2000;
  const phis: number[] = [];
  const cdf: number[] = [0];
  for (let k = 0; k <= N; k++)
    phis.push(90 - PHI_SPAN + (2 * PHI_SPAN * k) / N);
  for (let k = 1; k <= N; k++) {
    const phi = (phis[k - 1] + phis[k]) / 2;
    const A = ((90 + (1 - GRAVITY_MIX) * (phi - 90)) * Math.PI) / 180;
    cdf.push(cdf[k - 1] + Math.max(0.12, Math.abs(Math.sin(A))));
  }
  return { phis, cdf: cdf.map((v) => v / cdf[N]) };
})();
/** u in [0, 1] -> the slot's phi at that quantile of the density. */
const slotPhi = (u: number) => {
  const { phis, cdf } = SLOT_TABLE;
  const q = Math.max(0, Math.min(1, u));
  let lo = 0;
  let hi = cdf.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] < q) lo = mid;
    else hi = mid;
  }
  const t = (q - cdf[lo]) / Math.max(1e-9, cdf[hi] - cdf[lo]);
  return phis[lo] + (phis[hi] - phis[lo]) * t;
};

export const buildKeys = (count: number): KeySpec[] => {
  // the layer counts are the director's 30 / 28 / 22; a different keyCount
  // scales them
  const total = LAYERS.reduce((t, L) => t + L.n, 0);
  const per = LAYERS.map((L) => Math.round((L.n * count) / total));
  per[per.length - 1] += count - per.reduce((t, m) => t + m, 0);
  const keys: KeySpec[] = [];
  let i = 0;
  per.forEach((m, l) => {
    const phis = Array.from(
      { length: m },
      (_, j) =>
        90 +
        (slotPhi((j + 0.5 + LAYERS[l].offset - 0.25) / m) - 90) *
          LAYERS[l].span,
    );
    const front = l === LAYERS.length - 1;
    const bunchIdx = front
      ? phis
          .map((p, j) => ({ p, j }))
          .sort((a, b) => Math.abs(a.p - 90) - Math.abs(b.p - 90))
          .slice(0, 5)
          .map((o) => o.j)
          .sort((a, b) => phis[a] - phis[b])
      : [];
    phis.forEach((phi, j) => {
      const b = bunchIdx.indexOf(j);
      keys.push({
        i,
        layer: l,
        phi: phi + (hash(i, 3) - 0.5) * 2,
        // the bunch hangs together in his hand, 12 deg apart; every other key
        // leaves from just inside the bunch, on its own side
        phi0: b >= 0 ? 90 + (b - 2) * 12 : 90 + Math.sign(phi - 90) * 12,
        // front keys alternate long / short by 36 px so neighbouring bits sit
        // at different heights instead of fusing side by side
        len:
          LAYERS[l].len +
          (front ? (j % 2 === 0 ? 18 : -18) : 0) +
          (hash(i, 5) - 0.5) * 12,
        jit: (hash(i, 17) - 0.5) * 6,
        bow: Math.floor(hash(i, 7) * 3),
        bit: Math.floor(hash(i, 11) * 3),
        // bits fan outward: away from the bunch's centre line
        side: phi < 90 ? -1 : 1,
        bunch: b >= 0,
      });
      i++;
    });
  });
  return keys;
};
const KEYS = buildKeys(defaultProps.keyCount);

// THE FAN: every new key slides along the hoop from behind the bunch to its
// slot on ONE shared eased progress, so the far keys lead and the fan opens as
// one sweep each way. While it slides each key hangs on its own small damped
// pendulum driven by its bow's acceleration along the hoop, so it trails as it
// is carried and swings down into its hanging angle as it settles.
// Each key's own slide: the farthest keys leave the bunch first (f60) and
// travel longest; the nearest leave last and travel least, so at any moment
// only a few keys are in transit, they never cross a key already in its slot,
// and every key is home by ~f76. The stream of departures IS the one wave.
const FAN_LEAD = 7; // frames between the first and the last departure
const slideOf = (key: KeySpec, fan: number, fanEnd: number) => {
  const reach = Math.min(1, Math.abs(key.phi - key.phi0) / PHI_SPAN);
  const start = fan + FAN_LEAD * (1 - reach);
  const dur = 6 + (fanEnd - 2 - fan - 6) * reach; // far keys: fan -> fanEnd - 2
  return { start, dur };
};
// Pushed out of the bunch at speed, then a long ease into the slot: a key never
// loiters at the bunch's edge, so the departures never pile into a slab.
const SLIDE_EASE = Easing.bezier(0.2, 0.55, 0.3, 1);
const keyPhiAt = (key: KeySpec, f: number, fan: number, fanEnd: number) => {
  const { start, dur } = slideOf(key, fan, fanEnd);
  return (
    key.phi0 +
    (key.phi - key.phi0) *
      SLIDE_EASE(Math.max(0, Math.min(1, (f - start) / dur)))
  );
};
const keyOutAt = (key: KeySpec, f: number, fan: number, fanEnd: number) =>
  key.bunch || f >= slideOf(key, fan, fanEnd).start;

const KEY_W0 = (2 * Math.PI) / 11; // a key's own period, 11 f
const KEY_ZETA = 0.42;
const KEY_L = 110; // a key's centre of mass below its bow

const simulateKeySwing = (
  key: KeySpec,
  fan: number,
  fanEnd: number,
  upto: number,
) => {
  const out: number[] = new Array(upto + 1).fill(0);
  if (key.phi === key.phi0) return out;
  const bowAt = (t: number) => {
    const p = (keyPhiAt(key, t, fan, fanEnd) * Math.PI) / 180;
    return { x: HOOP_R * Math.cos(p), y: HOOP_R * Math.sin(p) };
  };
  let d = 0; // offset from the hanging angle, rad
  let w = 0;
  const h = 1 / SUB;
  for (let f = 1; f <= upto; f++) {
    if (f > fan - 1) {
      for (let s = 0; s < SUB; s++) {
        const t = f - 1 + s * h;
        const e = 0.25;
        const p0 = bowAt(t - e);
        const p1 = bowAt(t);
        const p2 = bowAt(t + e);
        const ax = (p2.x - 2 * p1.x + p0.x) / (e * e);
        const ay = (p2.y - 2 * p1.y + p0.y) / (e * e);
        const th =
          (hangAngle(keyPhiAt(key, t, fan, fanEnd)) * Math.PI) / 180 + d;
        const dd =
          (ax * Math.sin(th) - ay * Math.cos(th)) / KEY_L -
          KEY_W0 * KEY_W0 * d -
          2 * KEY_ZETA * KEY_W0 * w;
        w += dd * h;
        d += w * h;
      }
    }
    out[f] = (d * 180) / Math.PI;
  }
  return out;
};
const KEY_SWING = new Map(
  KEYS.map((k) => [
    k.i,
    simulateKeySwing(
      k,
      defaultProps.beats.fan,
      defaultProps.beats.fanEnd,
      DURATION,
    ),
  ]),
);

// Notch patterns: the two notches' positions along the bit, as fractions.
const NOTCHES = [
  [0.22, 0.6],
  [0.3, 0.68],
  [0.18, 0.5],
];

// One skeleton key, in its own frame: bow centre at the origin, pointing along
// +x, the bit off the `side` of the shank at the tip.
const KeyShape: React.FC<{
  fill: string;
  len: number;
  bow: number;
  bit: number;
  side: 1 | -1;
}> = ({ fill, len, bow, bit, side }) => {
  const x1 = len; // the tip
  const x0 = len - BIT_L;
  const [n1, n2] = NOTCHES[bit];
  // the bit as one outline with two notches cut into its far edge
  const pts: [number, number][] = [
    [x0, 0],
    [x0, BIT_D],
    [x0 + n1 * BIT_L, BIT_D],
    [x0 + n1 * BIT_L, BIT_D - NOTCH_D],
    [x0 + n1 * BIT_L + NOTCH_W, BIT_D - NOTCH_D],
    [x0 + n1 * BIT_L + NOTCH_W, BIT_D],
    [x0 + n2 * BIT_L, BIT_D],
    [x0 + n2 * BIT_L, BIT_D - NOTCH_D],
    [x0 + n2 * BIT_L + NOTCH_W, BIT_D - NOTCH_D],
    [x0 + n2 * BIT_L + NOTCH_W, BIT_D],
    [x1, BIT_D],
    [x1, 0],
  ];
  const d =
    "M" +
    pts.map(([x, y]) => `${x.toFixed(2)} ${(side * y).toFixed(2)}`).join(" L") +
    " Z";
  return (
    <>
      {bow === 1 ? (
        // trefoil: three bold loops round the bow's centre
        [180, 60, -60].map((a) => (
          <circle
            key={a}
            cx={14 * Math.cos((a * Math.PI) / 180) - 3}
            cy={14 * Math.sin((a * Math.PI) / 180)}
            r={12}
            fill="none"
            stroke={fill}
            strokeWidth={10}
          />
        ))
      ) : bow === 2 ? (
        <ellipse
          cx={-2}
          cy={0}
          rx={BOW_R + 3}
          ry={BOW_R - 3}
          fill="none"
          stroke={fill}
          strokeWidth={BOW_BAND - 1}
        />
      ) : (
        <circle
          cx={0}
          cy={0}
          r={BOW_R}
          fill="none"
          stroke={fill}
          strokeWidth={BOW_BAND}
        />
      )}
      {/* the collar ring and a second, thinner bead */}
      <rect x={BOW_OUT - 3} y={-17} width={12} height={34} fill={fill} />
      <rect x={BOW_OUT + 15} y={-13} width={7} height={26} fill={fill} />
      {/* shank */}
      <rect
        x={BOW_OUT - 4}
        y={-SHANK / 2}
        width={len - BOW_OUT + 4}
        height={SHANK}
        fill={fill}
      />
      {/* bit */}
      <path d={d} fill={fill} />
    </>
  );
};

// ---------------------------------------------------------------------------
// THE ECHO on the hoop: the cut's one chain moment. Three copies of the hoop,
// orange / purple / blue, 2 f apart, rising 36 / 24 / 12 world px over
// CHAIN_TRAVEL frames on EASE_LAND, each CLIPPED TO OUTSIDE the white hoop's
// outer edge, so only a crown of 12 px arcs shows above the top arc. Painted
// behind the keys and the hoop. Nothing fades.
// ---------------------------------------------------------------------------
const HoopEcho: React.FC<{
  frame: number;
  start: number;
  c: { x: number; y: number };
}> = ({ frame, start, c }) => {
  const id = "ekt-outside-hoop";
  const r = HOOP_OUT;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path
            clipRule="evenodd"
            d={`M${c.x - 4000} ${c.y - 4000} h8000 v8000 h-8000 Z M${c.x - r} ${c.y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {[ORANGE, PURPLE, BLUE].map((col, i) => {
          const f0 = start + i * CHAIN_STAGGER;
          if (frame < f0) return null;
          const t = interpolate(frame, [f0, f0 + CHAIN_TRAVEL], [0, 1], {
            easing: EASE_LAND,
            ...clamp,
          });
          const lift = t * CROWN_STEP * (3 - i);
          return (
            <circle
              key={col}
              cx={c.x}
              cy={c.y - lift}
              r={HOOP_R}
              fill="none"
              stroke={col}
              strokeWidth={HOOP_W}
            />
          );
        })}
      </g>
    </g>
  );
};

const EightyKeysTall: React.FC<Props> = ({ beats }) => {
  const frame = useCurrentFrame();

  // -- the camera ------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;

  // -- the hoop: pivot on its arc, dipping under the load, swinging ---------
  const p = pivotAt(frame, beats.toss, beats.land);
  const pivot = { x: p.x, y: p.y + dipAt(frame, beats.fan, beats.fanEnd) };
  const alpha =
    PEND[Math.min(frame, PEND.length - 1)] + swayAt(frame, beats.sway);
  const ar = (alpha * Math.PI) / 180;
  const c = {
    x: pivot.x - HOOP_R * Math.sin(ar),
    y: pivot.y + HOOP_R * Math.cos(ar),
  };

  // -- the opening rise: the caretaker and his hoop, as one group ------------
  const rise = textRise(frame, beats.rise, k);

  const keyTransform = (key: KeySpec) => {
    const phi = keyPhiAt(key, frame, beats.fan, beats.fanEnd) + alpha;
    const th =
      hangAngle(keyPhiAt(key, frame, beats.fan, beats.fanEnd)) +
      key.jit +
      alpha +
      (KEY_SWING.get(key.i)?.[frame] ?? 0);
    const r = (phi * Math.PI) / 180;
    // the bow's centre sits RADIALLY outside the hoop line, so the hoop runs
    // along the top of the loop; the key hangs from there
    const bx = c.x + (HOOP_R + BOW_HANG) * Math.cos(r);
    const by = c.y + (HOOP_R + BOW_HANG) * Math.sin(r);
    return `translate(${bx.toFixed(3)} ${by.toFixed(3)}) rotate(${th.toFixed(3)})`;
  };
  const visible = (key: KeySpec) =>
    keyOutAt(key, frame, beats.fan, beats.fanEnd);

  // One union per layer: the layer's hard shadows, then its whites, all
  // clipped to OUTSIDE the hoop's inner edge, so the hoop's interior is only
  // ever paper (a bow's band would otherwise peek 2.5 px past it).
  const inner = HOOP_R - HOOP_W / 2;
  const outsideHoop = (
    <clipPath id="ekt-keys-outside">
      <path
        clipRule="evenodd"
        d={`M${c.x - 4000} ${c.y - 4000} h8000 v8000 h-8000 Z M${c.x - inner} ${c.y} a${inner} ${inner} 0 1 0 ${2 * inner} 0 a${inner} ${inner} 0 1 0 ${-2 * inner} 0 Z`}
      />
    </clipPath>
  );
  const layer = (which: number, opacity: number) => (
    <Inked
      key={which}
      opacity={opacity}
      render={(fill) => (
        <g>
          {KEYS.map((key) =>
            key.layer === which && visible(key) ? (
              <g key={key.i} transform={keyTransform(key)}>
                <KeyShape
                  fill={fill}
                  len={key.len}
                  bow={key.bow}
                  bit={key.bit}
                  side={key.side}
                />
              </g>
            ) : null,
          )}
        </g>
      )}
    />
  );

  const hoop = (
    <Inked
      render={(fill) => (
        <circle
          cx={c.x}
          cy={c.y}
          r={HOOP_R}
          fill="none"
          stroke={fill}
          strokeWidth={HOOP_W}
        />
      )}
    />
  );

  return (
    <AbsoluteFill>
      <PaperGroundTall
        frame={frame}
        cx={cx}
        cy={cy}
        cxRest={CAM.CX[0]}
        cyRest={CAM.CY[0]}
        k={k}
      />
      <WorldTall cx={cx} cy={cy} k={k}>
        {rise.opacity > 0 ? (
          <g
            opacity={rise.opacity < 1 ? rise.opacity : undefined}
            transform={`translate(0 ${rise.dy.toFixed(3)})`}
          >
            {/* THE CARETAKER — he never moves; the camera leaves him */}
            <Person
              x={PERSON_BOX.x}
              y={PERSON_BOX.y}
              size={PERSON_S}
              idPrefix="ekt"
            />
          </g>
        ) : null}

        {rise.opacity > 0 ? (
          <g
            opacity={rise.opacity < 1 ? rise.opacity : undefined}
            transform={
              frame < beats.toss
                ? `translate(0 ${rise.dy.toFixed(3)})`
                : undefined
            }
          >
            {/* THE KEYS: back (0.3) and mid (0.55) behind the crown, so no
                pale bow ever sits over a colour; then THE CROWN, outside the
                hoop's edge; then the front keys (1.0) over its tapering ends */}
            <defs>{outsideHoop}</defs>
            <g clipPath="url(#ekt-keys-outside)">
              {LAYERS.map((L, l) =>
                l < LAYERS.length - 1 ? layer(l, L.opacity) : null,
              )}
            </g>
            <HoopEcho frame={frame} start={beats.echo} c={c} />
            <g clipPath="url(#ekt-keys-outside)">
              {layer(LAYERS.length - 1, LAYERS[LAYERS.length - 1].opacity)}
            </g>
            {/* THE HOOP over every bow: it threads them */}
            {hoop}
          </g>
        ) : null}
      </WorldTall>
    </AbsoluteFill>
  );
};

export default EightyKeysTall;

// exported for the probe
export const GEOM = {
  RC,
  HOOP_R,
  C_OPEN,
  C_ARRIVE,
  X_OPEN,
  PIVOT_START,
  PIVOT_END,
  PERSON_BOX,
  PERSON_S,
  PERSON_RIGHT,
  BUNCH_BOTTOM,
  CROWN_TOP,
};
export const pendAt = (f: number) => PEND[Math.min(f, PEND.length - 1)];
export const swayFor = swayAt;
export const pivotFor = pivotAt;
