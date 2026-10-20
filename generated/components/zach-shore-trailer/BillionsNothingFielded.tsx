// ---------------------------------------------------------------------------
// BillionsNothingFielded (zach-shore-trailer, cut 20). Core memory podcast style (styles/core-memory.md).
// Opaque 2048x1080, 23.976 fps, 95 frames.
// The graphic standard: flat white glyphs on their hard black shadow on squared paper. Core Memory edits carry
// burned-in captions: no label for what the speaker says. This cut has no text, no numbers and no chain echo.
//
// CHECK LINE: "a tower of money went in, and the flight line where the hypersonic aircraft should be is still empty."
//
// THE LINE: "(We've spent huge) amounts of money, tens of billions of dollars, and really haven't fielded anything
// yet." The slot opens mid-sentence on "amounts"; "We've spent huge" is heard over the speaker just before.
// WORD -> FRAME: amounts 6 · of 14 · money 18 · tens 23 · of 26 · billions 28 · of 32 · dollars 36 · and 46 ·
// really 58 · haven't 65 · fielded 73 · anything 80 · yet 84 · speech ends ~92 · cut at f95.
// DURATION: the slot 20.395375 -> 24.357667 s = 3.962 s x 23.976 = 95 frames (f0..f94), sequence f489 -> f584.
//
// THE MOTION: one continuous lateral move. Banded cash bricks drop in from above the frame edge onto a solid block
// three bricks wide that stands on one ground rule; it opens tight on the stack's top (k 2.45) with bricks already
// falling, the drop rate rises through "money ... tens of billions of dollars" and the stack climbs into a tower
// while the camera rises with its top. On "and really haven't fielded" the camera pulls back and pans right along
// the ground rule, carrying the tower to the left third and bringing in the flight line: three parking spots
// (a black tick pair on the rule), each holding a HOLLOW outline of the clip's jet (zachShared's JET_SIDE_D,
// drawn here at a heavier 15 px outline), the aircraft that is not there. Resolved by f73 ("fielded"). Bricks keep landing every ~6 f through the
// pan and to the last frame while the spots stay empty, under a slow creep.
// CHAIN = the uncrewed fast jet's speed (zachShared legend). Not used here: nothing moves fast in this cut.
//
// CAUSE -> EFFECT: each brick's low corner touches the brick (or ground) below on its landing frame `land`; the
// settle (its tilt easing flat, pivoting on that corner) starts on the same frame and runs 6 frames. Nothing else
// reacts. Landing frames: LANDS. Each brick starts above the highest the frame's top edge reaches during its fall,
// so it enters fast from the edge and never hangs there under the pull-back.
//
// WORLD = the resolved frame's screen at k 1 (world px, +y down). Ground rule top y 580 (screen y 584 at rest).
// Tower: 3 bricks of 96 x 34, centre x 290 (x 146-434); 5 rows at f0, 13 at f73, 14 (top y ~104, 476 px) at f94.
// Spots centred x 815 / 1290 / 1765 (x ~585-2000, the right ~70 %), jets 455 long (scale 455/120), intake resting on
// the rule, no gear (zachShared's side view has none), outline 15 world px (HOLLOW_W, this cut only); ticks
// 8 x 18 at +-170 under each, down to y 598.
// THE CAMERA keys two screen anchors and the zoom, then runs the house damped tracker (runCamera2) + sway:
//   k: 2.45 -> 2.4 through the climb (the camera rises with the top), then log-eased 2.4 -> 1.0 over the pan
//   f38-67, creep 1.0 -> 1.012 to f95.
//   tower screen x: 1360 until f38 (the first jet's tail stays past the right edge while k > ~2.35), eased to 290 by
//   f67 — a ~1070 px lateral move.
//   tower-top screen y: 520 at f0 -> 330 at f38 -> its resting y at f67 (cy 536, ground on screen y 584).
//   damped: f0 k 2.45 · f23 2.43 · f36 2.41 · f43 the first jet's tail enters right · f50 2.03 (fastest pan
//   ~54 screen px/f, zoom ~4.2 %/f around f56-58) · f73 1.01, ground at y 588, resolved · f94 1.011.
//   The ground rule and the first jets cross the caption bands only while moving (f55-66).
// THE PAPER gets a compressed k (1 + (k - 1) x 0.58) so the k 2.45 open stays at the paper's 1.0x-of-source limit
// (bgScale 1.25).
//
// SOURCES: none (no figures on screen). The jet glyph is zachShared's (builder A).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Inked,
  INK,
  PaperGround,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  camEase,
  clamp,
  fontFamily,
  runCamera2,
  sway,
} from "../kits/core-memory/cerroShared";
import { JET_SIDE_D } from "./zachShared";

export const FPS = 24000 / 1001;
export const DURATION = 95;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const W = 2048;
const H = 1080;

// -- the world ---------------------------------------------------------------------
const GROUND_Y = 580; // top of the ground rule
const COLS = 3; // the tower is three bricks wide, one solid block
const TOWER_X = 290; // centre of the block
const BW = 96; // brick width
const BH = 34; // brick height
const SPOT_X = [815, 1290, 1765];
const JET_SCALE = 455 / 120; // 455 world px long (JET_LEN 120)
// THIS CUT'S HOLLOW WEIGHT: the payoff jets read as hairlines on a phone at the house STROKE (6), so here the
// hollow outline is drawn locally from zachShared's JET_SIDE_D at 15 world px (2.5x), on a matching shadow stroke
// at +SHADOW_OFF/+SHADOW_OFF. zachShared's Jet itself is unchanged.
const HOLLOW_W = 15;
// side view: the intake bottom is +12 at scale 1; the hollow outline's outer edge sits on the rule
const JET_Y = GROUND_Y - 12 * JET_SCALE - HOLLOW_W / 2;
const HollowJet: React.FC<{ x: number }> = ({ x }) => {
  const outline = (fill: string, d: number) => (
    <path
      d={JET_SIDE_D}
      transform={`translate(${x + d} ${JET_Y + d}) scale(${JET_SCALE})`}
      fill="none"
      stroke={fill}
      strokeWidth={HOLLOW_W / JET_SCALE}
      strokeLinejoin="round"
    />
  );
  return (
    <g>
      {outline(SHADOW, SHADOW_OFF)}
      {outline(INK, 0)}
    </g>
  );
};
const SPOT_TICK_DX = 170; // the tick pair, either side of the spot's centre
const SPOT_TICK_W = 8;
const SPOT_TICK_H = 18; // down to y 598, clear of the band at 607

// -- the money ---------------------------------------------------------------------
// The stack at f0 (rows already standing), then every brick that lands, in order. Bricks fill a row left to
// right. Rate: every ~4 f on "amounts of money", every ~1.5 f through "tens of billions of dollars", then a slower
// steady ~6 f through the pan and the settled frame to the last frame ("money keeps going in").
const INITIAL_BRICKS = 15; // 5 rows
const LANDS = [
  2, 6, 10, 14, 17, // amounts of money
  19, 20, 22, 23, 25, 26, 28, 29, 31, 32, 34, 36, // tens of billions of dollars
  41, 47, 53, 59, 65, 71, // and really haven't fielded (through the pan)
  77, 83, 89, 94, // anything yet (living frame)
  100, // in the air at the cut
];

type Brick = { i: number; col: number; row: number; x: number; yTop: number; land: number; tilt: number };
const BRICKS: Brick[] = [];
const totalBricks = INITIAL_BRICKS + LANDS.length;
for (let i = 0; i < totalBricks; i++) {
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  const land = i < INITIAL_BRICKS ? -100 : LANDS[i - INITIAL_BRICKS];
  // a small tilt while it falls, never under 1.2 deg either way
  const r = random(`brick-tilt-${i}`) * 2 - 1;
  const tilt = (Math.sign(r) || 1) * (1.2 + Math.abs(r) * 1.4);
  BRICKS.push({ i, col, row, x: TOWER_X - (COLS / 2) * BW + col * BW, yTop: GROUND_Y - (row + 1) * BH, land, tilt });
}
/** rows standing at frame f (part rows count in part), for the camera's planned top */
const rowsAt = (f: number) => BRICKS.filter((b) => b.land <= f).length / COLS;

// -- the camera ----------------------------------------------------------------------
const K_OPEN = 2.45;
const K_PAN = 2.4; // at the pan's start: the first jet's tail is still past the right edge
const K_REST = 1.0;
const X_OPEN = 1360; // tower screen x through the climb
const M_PAN = 38; // the pan right starts
const M_END = 67; // keys land (the damped camera lands ~f73)
const TOP_AT_PAN = 330; // tower-top screen y when the pan starts
const GROUND_SCREEN = 584; // the ground rule's screen y in the resolved frame
const kTarget = (f: number) => {
  if (f <= M_PAN) return K_OPEN + (K_PAN - K_OPEN) * (f / M_PAN);
  if (f <= M_END) {
    const g = camEase((f - M_PAN) / (M_END - M_PAN), 1);
    return Math.exp(Math.log(K_PAN) + (Math.log(K_REST) - Math.log(K_PAN)) * g);
  }
  return K_REST + 0.012 * camEase((f - M_END) / (DURATION - M_END), 1);
};
const towerScreenX = (f: number) => X_OPEN + (TOWER_X - X_OPEN) * camEase((f - M_PAN) / (M_END - M_PAN), 1);
// planned (smooth) top of the stack: piecewise linear through the schedule's row counts
const TOP_KEYS_F = [0, 17, 38, M_END, 95];
const TOP_KEYS_Y = TOP_KEYS_F.map((f) => GROUND_Y - Math.floor(rowsAt(f)) * BH);
const plannedTop = (f: number) => interpolate(f, TOP_KEYS_F, TOP_KEYS_Y, clamp);
const topScreenY = (f: number) => {
  if (f <= M_PAN) return interpolate(f, [0, M_PAN], [520, TOP_AT_PAN], { easing: Easing.inOut(Easing.sin), ...clamp });
  return TOP_AT_PAN + (plannedTop(M_END) + GROUND_SCREEN - GROUND_Y - TOP_AT_PAN) * camEase((f - M_PAN) / (M_END - M_PAN), 1);
};
const CAM_F: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const k = kTarget(f);
  const fy = Math.min(f, M_END);
  CAM_F.push(f);
  CAM_K.push(k);
  CAM_CX.push(TOWER_X - (towerScreenX(f) - W / 2) / k);
  // after M_END the framing is locked on cy = 536 (ground on screen y 584 at k 1)
  CAM_CY.push(f <= M_END ? plannedTop(fy) - (topScreenY(fy) - H / 2) / k : CAM_CY[M_END]);
}
/** the damped camera at every frame, once */
const CAMERA = Array.from({ length: DURATION + 1 }, (_, f) => runCamera2(f, CAM_F, CAM_CY, CAM_CX, CAM_K));

const camAt = (f: number) => CAMERA[Math.max(0, Math.min(DURATION, Math.floor(f)))];
/** world y of the frame's top edge at frame f */
const frameTopY = (f: number) => {
  const c = camAt(f);
  return c.cy - (H / 2 + 6) / c.k;
};

// -- a brick's fall ------------------------------------------------------------------
const FALL = 11; // frames from just above the frame edge to contact
const HIGHEST_TOP = BRICKS.map((b) => {
  let top = Infinity;
  for (let f = Math.max(0, b.land - FALL); f <= Math.min(DURATION, Math.max(0, b.land)); f++) {
    top = Math.min(top, frameTopY(f));
  }
  return top;
});
const SETTLE = 6; // frames for the tilt to ease flat
const fallPos = (u: number) => 0.5 * u + 0.5 * u * u; // already falling at the edge, accelerating
const brickState = (b: Brick, frame: number) => {
  if (frame >= b.land + SETTLE) return { dy: 0, tilt: 0 };
  const spawn = b.land - FALL;
  if (frame < spawn) return null;
  if (frame >= b.land) {
    const t = Easing.out(Easing.cubic)((frame - b.land) / SETTLE);
    return { dy: 0, tilt: b.tilt * (1 - t) };
  }
  // start above the HIGHEST the frame's top edge reaches between spawn and contact (plus the tilt's lift), so the
  // brick is never seen until it is falling fast: it enters from the edge, it never hangs at the edge
  const startTop = HIGHEST_TOP[b.i] - BH - 2 * SHADOW_OFF - 8;
  const D = Math.max(80, b.yTop - startTop);
  const u = (frame - spawn) / FALL;
  return { dy: -D * (1 - fallPos(u)), tilt: b.tilt };
};

// -- glyphs --------------------------------------------------------------------------
const BAND_W = 13;
const BrickFace: React.FC<{ x: number; y: number; fill: string; face: boolean }> = ({ x, y, fill, face }) => (
  <g>
    <rect x={x} y={y} width={BW} height={BH} rx={3} fill={fill} />
    {face ? (
      <>
        {/* the paper band across the stack: black print on white, no shadow */}
        <rect x={x + BW / 2 - BAND_W / 2} y={y} width={BAND_W} height={BH} fill={SHADOW} />
        <text
          x={x + BW * 0.77}
          y={y + BH / 2 + 7.7}
          textAnchor="middle"
          fill={SHADOW}
          style={{ fontFamily, fontWeight: 900, fontSize: 22 }}
        >
          $
        </text>
      </>
    ) : null}
  </g>
);

const BrickGlyph: React.FC<{ b: Brick; dy: number; tilt: number }> = ({ b, dy, tilt }) => {
  // pivot on the low corner: +tilt (clockwise) lowers the right side
  const px = tilt > 0 ? b.x + BW : b.x;
  const py = b.yTop + BH;
  const t = tilt === 0 ? `translate(0 ${dy})` : `translate(0 ${dy}) rotate(${tilt} ${px} ${py})`;
  return (
    <g transform={t}>
      <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
        <BrickFace x={b.x} y={b.yTop} fill={SHADOW} face={false} />
      </g>
      <BrickFace x={b.x} y={b.yTop} fill={INK} face />
    </g>
  );
};

const BillionsNothingFielded: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAMERA[frame];
  const s = sway(frame);
  const transform = `translate(${W / 2 - cx * k + s.dx}px, ${H / 2 - cy * k + s.dy}px) scale(${k})`;
  const kPaper = 1 + (k - 1) * 0.58;

  // landed bricks bottom-up (right before left in a row, so each brick's shadow falls on its neighbour and on the
  // row below); bricks in the air or settling on top of everything
  const landed: Brick[] = [];
  const moving: { b: Brick; dy: number; tilt: number }[] = [];
  for (const b of BRICKS) {
    const st = brickState(b, frame);
    if (!st) continue;
    if (st.dy === 0 && st.tilt === 0) landed.push(b);
    else moving.push({ b, ...st });
  }
  landed.sort((a, c) => a.row - c.row || c.col - a.col);

  return (
    <AbsoluteFill>
      <PaperGround frame={frame} cx={cx} cy={cy} cxRest={CAMERA[0].cx} cyRest={CAMERA[0].cy} k={kPaper} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform }}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* the ground rule, far past every frame */}
          <Inked render={(fill) => <rect x={-3000} y={GROUND_Y} width={8000} height={STROKE} fill={fill} />} />
          {/* the spots: a black tick pair painted across the rule under each one (print: no shadow) */}
          {SPOT_X.flatMap((x) =>
            [-SPOT_TICK_DX, SPOT_TICK_DX].map((d) => (
              <rect key={`${x}${d}`} x={x + d - SPOT_TICK_W / 2} y={GROUND_Y} width={SPOT_TICK_W} height={SPOT_TICK_H} fill={SHADOW} />
            )),
          )}
          {/* the flight line: three spots, three hollow jets that are not there */}
          {SPOT_X.map((x) => (
            <HollowJet key={x} x={x} />
          ))}
          {/* the money */}
          {landed.map((b) => (
            <BrickGlyph key={b.i} b={b} dy={0} tilt={0} />
          ))}
          {moving.map(({ b, dy, tilt }) => (
            <BrickGlyph key={b.i} b={b} dy={dy} tilt={tilt} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default BillionsNothingFielded;
