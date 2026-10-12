import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLUE,
  CHAIN,
  CHAIN_STAGGER,
  CaptionStripDebug,
  EASE_LAND,
  FPS as SET_FPS,
  Figure,
  INK,
  ORANGE,
  PAPER_BASE,
  SHADOW,
  SHADOW_OFF,
  TallPaper,
  WorldTall,
  clamp,
  figureGeom,
  runCamera2,
  sway,
  worldTransformTall,
} from "./deathCountShared";

// ---------------------------------------------------------------------------
// "SOLVE MY LONELINESS" — cut 4 of the CM_EARLY_JS trailer (Core Memory,
// Andrew Kiguel). 1080 x 1920, 24000/1001 fps, 109 frames, opaque, the core
// memory graphic standard (deathCountShared / cerroShared).
//
// CHECK LINE: "Lonely people write to him asking for a companion to be made for
// them: the request itself is a drawing of someone to stand beside them."
//
// THE PICTURE: one BLUE bust (a lonely person) and the message it sends. A
// white message bubble grows out of it, tail first. What is written in the
// bubble is not text, it is a DESIGN: a second bust drafted in dashed
// construction line with a height and a width dimension line. The drawing
// then becomes real: it fills ORANGE from the bottom up (orange = the made
// companion), slides out of the bubble and comes to stand beside the blue
// person while the bubble folds back into its tail. A link is drawn between
// the two, they close up shoulder to shoulder, and the chain echo rises once
// from behind the pair as a crown. Blue stays blue: a request, not a result.
// No text on screen.
//
// THE WORDS (local frame):
//   I'm ~0 · so 2 · lonely 6-15 · Can 17 · you 19 · please 23 · design 27-35 ·
//   and 36 · sell 41 · something 45 · to 51 · me 58 · that 60 · will 64 ·
//   solve 68-80 · (pause) · my 87 · loneliness 94-101 · like 101 · END 109
//
// THE MOTION (one move; the words are its inflections):
//   f0        the blue bust is there, lower left, alone; the bubble is already
//             half its size above its head and growing (tail whole)
//   f0-14     the bubble reaches full size, empty             — "so lonely"
//   f17-37    the dashed bust is drafted: shoulders f17-29, head f27-37, the
//             line running without a stop                     — "can you please
//   f31-38    height dimension f31-36, width dimension f33-38      design"
//   f43-47.5  the two dimension lines are drawn back in
//   f41-48    the drawing fills ORANGE, a hard wipe from the base up; the
//             dashes are replaced as the front passes           — "and sell"
//   f45-59    the orange bust slides out of the bubble, right then down
//             (coming down from drawing size, 1.18, to life size), and lands
//             beside the blue one                         — "something to me"
//   f47-60    the bubble, empty, folds back into its tail (its line thinning
//             into the tip) and is gone
//   f59-72    the link, in the gap at shoulder height: a dot grows on the blue
//             shoulder, a heavy bar is drawn across, a dot closes it on the
//             orange shoulder; f60-77 the two close up            — "that will"
//   f66-88    THE CROWN, once: orange / purple / blue copies of the pair's
//             silhouette rise straight up from behind it into three 14 px
//             bands over the heads and shoulders (starts f66 / 68 / 70, 18
//             frames each on EASE_LAND)                           — "solve"
//   f84-108   hold: the pair sways together, the link flexes with the sway,
//             the camera creeps in                        — "my loneliness"
//
// THE CAMERA — four coarse linear keys read through runCamera2 (keys are read
// LAG = 4.2 frames early and pre-rolled so it is already moving on f0). ONE
// gentle drift: it holds bubble (above the caption strip) and blue bust (head
// below the strip) together from f0, barely moving, then from f40 travels
// down at ~14 screen px per frame while the orange bust does the travelling,
// comes to rest on the pair at the true middle (~f84) and creeps in.
// v2 (director's notes): heavier line (10.5), everything larger (bust 38 % of
// the width at the open, bubble ~85 %, final pair ~78 %), two dimension lines,
// the calm camera above, a clean 14 px crown, the link in the gap.
// ---------------------------------------------------------------------------

export const FPS = SET_FPS;
export const DURATION = 109;

export const schema = z.object({
  debugCaptions: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ debugCaptions: false });

// -- the world, px ------------------------------------------------------------------
export const S = 360; // a bust's box (ink 0.76 S = 274 wide)
const INK_L = 0.12 * S;
const INK_R = 0.88 * S;
const INK_T = 0.1 * S;
const INK_B = 0.9 * S;
const FY = 1194; // both busts' box top at rest (ink 1230-1518)
const MID_X = 540;
const GAP_REST = 70; // between the two busts' ink at rest
const GAP_LAND = 110; // ... when the orange one lands
const CLOSE = (GAP_LAND - GAP_REST) / 2; // each closes up this far
const BLUE_X1 = MID_X - GAP_REST / 2 - INK_R; // 205.2
const ORANGE_X1 = MID_X + GAP_REST / 2 - INK_L; // 514.8
const BLUE_X0 = BLUE_X1 - CLOSE;
const ORANGE_LAND = ORANGE_X1 + CLOSE;

// the bubble at rest
const BUB = { x0: 230, x1: 850, y0: 539, y1: 1099 } as const;
const CORNER = 60;
const TIP = { x: BLUE_X0 + S / 2, y: FY + INK_T - 18 }; // just over the blue head
const TAIL_H = BUB.y1 - TIP.y; // negative: the body is above the tip
const TAIL_C = 52; // the tail's base centre, right of the tip, at rest
const TAIL_B = 40; // half the tail's base

// the drawing, inside the bubble: the bust at DRAFT_K of life size
const W = 10.5; // the line weight of everything drawn in line
const DRAFT_K = 1.18;
const SD = S * DRAFT_K;
const DRAFT = { x: 302, y: 582 };
const DIM_V = { x: DRAFT.x + 0.88 * SD + 54, y0: DRAFT.y + 0.1 * SD, y1: DRAFT.y + 0.9 * SD };
const DIM_H = { y: DRAFT.y + 0.9 * SD + 50, x0: DRAFT.x + 0.12 * SD, x1: DRAFT.x + 0.88 * SD };
const TICK = 20; // half a dimension line's end tick

// dashes, in "periods" (pathLength units): ~42 world px each, 26 on / 16 off
const DASH_ON = 0.62;
const N_SHOULDERS = 20;
const N_HEAD = 11;

// -- timing ------------------------------------------------------------------------
export const T = {
  grow: 14,
  shoulders: [17, 29],
  head: [27, 37],
  dimV: [31, 36],
  dimH: [33, 38],
  dimVOut: [43, 46.5],
  dimHOut: [44, 47.5],
  fill: [41, 48],
  slide: [45, 59],
  fold: [47, 60],
  dotA: [59, 63],
  link: [61, 69],
  dotB: [68, 72],
  close: [60, 77],
  crown: 66,
} as const;
const IN_OUT = Easing.inOut(Easing.cubic);
const SLIDE = Easing.bezier(0.45, 0, 0.2, 1);
const lin = (f: number, r: readonly [number, number] | readonly number[], easing?: (t: number) => number) =>
  interpolate(f, [r[0], r[1]], [0, 1], { easing, ...clamp });

/** the bubble's size: half on f0 and growing, whole at f14, folded f47-60 */
export const bubbleS = (f: number) => {
  const grow = 0.5 + 0.5 * lin(f, [0, T.grow], Easing.out(Easing.cubic));
  return grow * (1 - lin(f, T.fold, IN_OUT));
};

/** The bubble about its tail tip: the tail is whole by s = 1/3 and the body
 *  scales about the tip above it, positions only (strokes keep their weight). */
const mapper = (s: number) => {
  const tk = Math.min(1, s * 3);
  const yB = TIP.y + TAIL_H * tk;
  return {
    tk,
    yB,
    x: (x: number) => TIP.x + (x - TIP.x) * s,
    y: (y: number) => yB + (y - BUB.y1) * s,
  };
};

const bubblePath = (s: number) => {
  const m = mapper(s);
  const xL = m.x(BUB.x0);
  const xR = m.x(BUB.x1);
  const yT = m.y(BUB.y0);
  const yB = m.yB;
  const c = TIP.x + TAIL_C * s;
  const hb = TAIL_B * m.tk;
  const r = Math.max(0, Math.min(CORNER, (xR - xL) / 2, (yB - yT) / 2));
  const rBL = Math.max(0, Math.min(r, c - hb - xL - 1));
  const n = (v: number) => v.toFixed(2);
  const arc = (rad: number, x: number, y: number) => `A${n(rad)} ${n(rad)} 0 0 0 ${n(x)} ${n(y)}`;
  return [
    `M${n(c + hb)} ${n(yB)}`,
    `L${n(xR - r)} ${n(yB)}`,
    arc(r, xR, yB - r),
    `L${n(xR)} ${n(yT + r)}`,
    arc(r, xR - r, yT),
    `L${n(xL + r)} ${n(yT)}`,
    arc(r, xL, yT + r),
    `L${n(xL)} ${n(yB - rBL)}`,
    arc(rBL, xL + rBL, yB),
    `L${n(c - hb)} ${n(yB)}`,
    `L${n(TIP.x)} ${n(TIP.y)}`,
    "Z",
  ].join(" ");
};

/** a white line on its hard black copy */
const Line: React.FC<{
  d: string;
  cap?: "butt" | "round";
  dash?: string;
  pathLength?: number;
  weight?: number;
  off?: number;
}> = ({ d, cap = "butt", dash, pathLength, weight = W, off = SHADOW_OFF }) => {
  const common = {
    d,
    fill: "none",
    strokeWidth: weight,
    strokeLinejoin: "round" as const,
    strokeLinecap: cap,
    strokeDasharray: dash,
    pathLength,
  };
  return (
    <g>
      <path {...common} stroke={SHADOW} transform={`translate(${off} ${off})`} />
      <path {...common} stroke={INK} />
    </g>
  );
};

/** `p` periods of a dashed line drawn so far, of `total` */
const dashArray = (p: number, total: number) => {
  if (p >= total) return `${DASH_ON} ${1 - DASH_ON}`;
  const full = Math.floor(p);
  const rem = Math.min(DASH_ON, p - full);
  const parts: string[] = [];
  for (let i = 0; i < full; i++) parts.push(`${DASH_ON} ${1 - DASH_ON}`);
  parts.push(`${rem.toFixed(3)} ${total * 2}`);
  return parts.join(" ");
};

/** a dimension line from a to b (drawn `p` of the way), with its end ticks */
const dimPath = (a: [number, number], b: [number, number], p: number, tick: number) => {
  const ex = a[0] + (b[0] - a[0]) * p;
  const ey = a[1] + (b[1] - a[1]) * p;
  const vertical = a[0] === b[0];
  const t = (x: number, y: number) =>
    vertical ? `M${x - tick} ${y} L${x + tick} ${y}` : `M${x} ${y - tick} L${x} ${y + tick}`;
  return `${t(a[0], a[1])} M${a[0]} ${a[1]} L${ex} ${ey}${p >= 1 ? ` ${t(b[0], b[1])}` : ""}`;
};

// -- where the two busts are ----------------------------------------------------------
const GEOM = figureGeom(S);
export const bustsAt = (f: number) => {
  const close = CLOSE * lin(f, T.close, IN_OUT);
  const t = lin(f, T.slide, SLIDE);
  const tx = 1 - (1 - t) * (1 - t); // sideways first, then down: clear of the blue head
  return {
    t,
    /** the orange bust's scale: drawing size in the bubble, life size beside the blue one */
    sc: DRAFT_K + (1 - DRAFT_K) * t,
    blue: { x: BLUE_X0 + close, y: FY },
    orange: { x: DRAFT.x + (ORANGE_LAND - DRAFT.x) * tx - close, y: DRAFT.y + (FY - DRAFT.y) * t },
  };
};
/** the pair's sway, degrees, about the middle of its base line */
const swayDeg = (f: number) => 1.6 * Math.sin((f + 6) / 11);
const PIVOT = { x: MID_X, y: FY + INK_B };
const CROWN_BAND = 14; // world px per colour
const CROWN_TRAVEL = 18; // f66-84 / 68-86 / 70-88

// -- the camera ---------------------------------------------------------------------
// f, k, cx, cy — what the damped camera should do, linear between keys.
const KEYS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 1.56, 524, 1040], // blue bust lower left, the bubble half grown over it
  [14, 1.5, 536, 1012], // the whole bubble above the strip
  [38, 1.45, 540, 1023],
  [82, 1.37, 540, 1460], // down with the orange bust; the pair's link at screen y ~980
  [108, 1.405, 540, 1460], // creep
];
const PRE = 30;
const LAG = 4.2;
const desired = (f: number) => {
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = Math.min(1, (f - a[0]) / (b[0] - a[0])); // runs on backwards before f0
  return { k: a[1] + (b[1] - a[1]) * u, cx: a[2] + (b[2] - a[2]) * u, cy: a[3] + (b[3] - a[3]) * u };
};
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
for (let g = 0; g <= DURATION + PRE; g++) {
  const key = desired(g - PRE + LAG);
  CAM_F.push(g);
  CAM_K.push(key.k);
  CAM_CX.push(key.cx);
  CAM_CY.push(key.cy);
}
/** the damped camera at a local frame (no sway) */
export const cameraAt = (frame: number) => runCamera2(frame + PRE, CAM_F, CAM_CY, CAM_CX, CAM_K);
const CX_REST = 540;
const CY_REST = 1230; // the middle of the camera's travel

/** where things are on screen, for the report and the reviews */
export const layoutAt = (frame: number) => {
  const cam = cameraAt(frame);
  const t = worldTransformTall(cam.cx, cam.cy, cam.k);
  const sx = (x: number) => t.tx + x * cam.k;
  const sy = (y: number) => t.ty + y * cam.k;
  const b = bustsAt(frame);
  const s = bubbleS(frame);
  const m = mapper(s);
  const bust = (p: { x: number; y: number }, sc = 1) => ({
    x0: sx(p.x + INK_L * sc),
    x1: sx(p.x + INK_R * sc),
    headTop: sy(p.y + INK_T * sc),
    headBottom: sy(p.y + 0.44 * S * sc),
    base: sy(p.y + INK_B * sc),
  });
  return {
    cam,
    s,
    blue: bust(b.blue),
    orange: bust(b.orange, b.sc),
    bubble: { x0: sx(m.x(BUB.x0)), x1: sx(m.x(BUB.x1)), y0: sy(m.y(BUB.y0)), y1: sy(m.yB) },
  };
};

const SolveMyLoneliness: React.FC<Props> = ({ debugCaptions }) => {
  const frame = useCurrentFrame();

  const cam = cameraAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;

  // -- the bubble and what is drafted in it ---------------------------------------------
  const s = bubbleS(frame);
  const m = mapper(s);
  const pShoulders = N_SHOULDERS * lin(frame, T.shoulders);
  const pHead = N_HEAD * lin(frame, T.head);
  // drawn, then drawn back in before the bubble folds (it folds empty)
  const pDimV = lin(frame, T.dimV, Easing.out(Easing.quad)) * (1 - lin(frame, T.dimVOut, IN_OUT));
  const pDimH = lin(frame, T.dimH, Easing.out(Easing.quad)) * (1 - lin(frame, T.dimHOut, IN_OUT));

  // -- the fill and the two busts --------------------------------------------------------
  const b = bustsAt(frame);
  const fill = lin(frame, T.fill, Easing.inOut(Easing.quad));
  // the wipe front, box-local y: from under the shadow's base to over the head
  const front = INK_B + SHADOW_OFF + 4 - fill * (INK_B - INK_T + SHADOW_OFF + 12);
  const deg = swayDeg(frame);
  const rot = (amount: number) => `rotate(${(deg * amount).toFixed(4)} ${PIVOT.x} ${PIVOT.y})`;

  // -- the link: in the gap, at shoulder height ---------------------------------------------
  const LINK_DY = 0.78 * S; // box-local y
  const reach = Math.sqrt(0.38 * 0.38 - 0.12 * 0.12) * S; // the shoulder's half width there
  const linkY = FY + LINK_DY;
  const ax = b.blue.x + S / 2 + reach;
  const bx = b.orange.x + S / 2 - reach;
  const dotA = lin(frame, T.dotA, Easing.out(Easing.cubic));
  const linkP = lin(frame, T.link, IN_OUT);
  const dotB = lin(frame, T.dotB, Easing.out(Easing.cubic));
  const DOT = 17;
  const LINK_W = 15;
  const flex = 14 * Math.sin((frame + 6) / 11 + 1.2); // it gives a little with the sway
  const ex = ax + (bx - ax) * linkP;

  // -- the crown ---------------------------------------------------------------------------
  const pairSilhouette = (fillColor: string) => (
    <>
      {[b.blue, b.orange].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <path d={GEOM.solidShoulders} fill={fillColor} />
          <path d={GEOM.solidHead} fill={fillColor} />
        </g>
      ))}
    </>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={CX_REST} cyRest={CY_REST} />
      <WorldTall cx={cx} cy={cy} k={k} id="sml-world">
        <defs>
          <clipPath id="sml-filled" clipPathUnits="userSpaceOnUse">
            <rect x={-40} y={front} width={S + 80} height={S + 80 - front} />
          </clipPath>
          <clipPath id="sml-drafted" clipPathUnits="userSpaceOnUse">
            <rect x={-40} y={-40} width={S + 80} height={front + 40} />
          </clipPath>
        </defs>

        {/* the message: the bubble, and the dimensions written in it */}
        {s > 0.03 ? (
          <g>
            <Line d={bubblePath(s)} weight={W * Math.min(1, s * 5)} off={SHADOW_OFF * Math.min(1, s * 5)} />
            {pDimV > 0 ? (
              <Line
                d={dimPath([m.x(DIM_V.x), m.y(DIM_V.y1)], [m.x(DIM_V.x), m.y(DIM_V.y0)], pDimV, TICK * s)}
              />
            ) : null}
            {pDimH > 0 ? (
              <Line
                d={dimPath([m.x(DIM_H.x0), m.y(DIM_H.y)], [m.x(DIM_H.x1), m.y(DIM_H.y)], pDimH, TICK * s)}
              />
            ) : null}
          </g>
        ) : null}

        {/* the crown: the pair's own silhouette, orange / purple / blue, rising
            from behind it */}
        <g transform={rot(1)}>
          {CHAIN.map((c, i) => {
            const start = T.crown + i * CHAIN_STAGGER;
            if (frame < start) return null;
            const n = 3 - i;
            const t = interpolate(frame, [start, start + CROWN_TRAVEL], [0, 1], { easing: EASE_LAND, ...clamp });
            return (
              <g key={c} transform={`translate(0 ${(-CROWN_BAND * n * t).toFixed(3)})`}>
                {pairSilhouette(c)}
              </g>
            );
          })}
        </g>

        {/* the lonely person */}
        <g transform={rot(1)}>
          <Figure x={b.blue.x} y={b.blue.y} size={S} mode="solid" ink={BLUE} />
        </g>

        {/* the drawing, then the companion */}
        <g transform={rot(b.t)}>
          <g transform={`translate(${b.orange.x} ${b.orange.y}) scale(${b.sc.toFixed(5)})`}>
            {fill < 1 && pShoulders > 0 ? (
              <g clipPath="url(#sml-drafted)">
                <Line
                  d={GEOM.solidShoulders}
                  pathLength={N_SHOULDERS}
                  dash={dashArray(pShoulders, N_SHOULDERS)}
                  weight={W / b.sc}
                  off={SHADOW_OFF / b.sc}
                />
                {pHead > 0 ? (
                  <Line
                    d={GEOM.solidHead}
                    pathLength={N_HEAD}
                    dash={dashArray(pHead, N_HEAD)}
                    weight={W / b.sc}
                    off={SHADOW_OFF / b.sc}
                  />
                ) : null}
              </g>
            ) : null}
            {fill > 0 ? (
              <g clipPath={fill < 1 ? "url(#sml-filled)" : undefined}>
                <Figure x={0} y={0} size={S} mode="solid" ink={ORANGE} />
              </g>
            ) : null}
          </g>
        </g>

        {/* the link */}
        {dotA > 0 ? (
          <g transform={rot(1)}>
            {linkP > 0 ? (
              <Line d={`M${ax} ${linkY} Q${(ax + ex) / 2} ${linkY + flex * linkP} ${ex} ${linkY}`} weight={LINK_W} />
            ) : null}
            {[
              { x: ax, r: DOT * dotA },
              { x: bx, r: DOT * dotB },
            ].map((d, i) =>
              d.r > 0 ? (
                <g key={i}>
                  <circle cx={d.x + SHADOW_OFF} cy={linkY + SHADOW_OFF} r={d.r} fill={SHADOW} />
                  <circle cx={d.x} cy={linkY} r={d.r} fill={INK} />
                </g>
              ) : null,
            )}
          </g>
        ) : null}
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default SolveMyLoneliness;
