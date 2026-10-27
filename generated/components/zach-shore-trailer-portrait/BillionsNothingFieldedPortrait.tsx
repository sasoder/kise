// ---------------------------------------------------------------------------
// BillionsNothingFieldedPortrait. Core Memory, 1080x1920, 24000/1001 fps, 95 frames.
// CHECK: A tower of money went in, but every aircraft parking bay is still empty.
// LINE: "(We've spent huge) amounts of money, tens of billions of dollars, and
// really haven't fielded anything yet." No labels, numbers, or chain echo.
// WORD -> FRAME, retained from the accepted wide composition:
// amounts 6, of 14, money 18, tens 23, of 26, billions 28, of 32, dollars 36,
// and 46, really 58, haven't 65, fielded 73, anything 80, yet 84; cut at95.
// DURATION: final native slot 19.5612083333..23.5235 =95 frames at24000/1001.
// MOTION: Identical cash landing schedule and empty-fielding payoff to the wide.
// The portrait picture is recomposed: a taller, narrower cash tower at left and
// three full-size empty bays arranged vertically at right, rather than a row
// compressed to fit the phone. The camera opens on falling cash, eases back as
// the stack grows, then reveals the vertically arranged flight line overf38..67.
// The damped move settles by"fielded"f73; cash keeps landing throughf94.
// CAUSE: each brick's low corner contacts the preceding row atits LAND frame,
// then its tilt settles over6frames. Existing schedule is preserved verbatim.
// CAPTIONS: money and all bays remain above screeny1080 throughout; no important
// detail enters either1080..1250 or1360..1460. The ground anchor is1018.
// SOURCES: no empirical figure is depicted. Money quantity is illustrative.
// Aircraft is the accepted shared JET_SIDE_D from zach-shore-trailer/zachShared.
// White ink +hard black shadow, squared portrait paper from the canonical kit.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  INK, SHADOW, SHADOW_OFF, STROKE, TallPaper, camEase, fontFamily,
  runCamera2, sway,
} from "../kits/core-memory/deathCountShared";
import { Inked } from "../kits/core-memory/cerroShared";
import { JET_SIDE_D } from "../zach-shore-trailer/zachShared";

export const FPS = 24000 / 1001;
export const DURATION = 95;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const W = 1080;
const H = 1920;
const GROUND_Y = 1000;
const GROUND_SCREEN = 1018;
const COLS = 3;
const TOWER_X = 180;
const BW = 78;
const BH = 42;
const BAY_X = 780;
const BAY_Y = [500, 740, 1000];
const JET_SCALE = 470 / 120;
const HOLLOW_W = 14;
const TICK_DX = 180;
const TICK_W = 8;
const TICK_H = 18;

const HollowJet: React.FC<{ ground: number }> = ({ ground }) => {
  const y = ground - 12 * JET_SCALE - HOLLOW_W / 2;
  const outline = (fill: string, d: number) => (
    <path
      d={JET_SIDE_D}
      transform={`translate(${BAY_X + d} ${y + d}) scale(${JET_SCALE})`}
      fill="none" stroke={fill} strokeWidth={HOLLOW_W / JET_SCALE}
      strokeLinejoin="round"
    />
  );
  return <g>{outline(SHADOW, SHADOW_OFF)}{outline(INK, 0)}</g>;
};

const INITIAL_BRICKS = 15;
const LANDS = [
  2, 6, 10, 14, 17,
  19, 20, 22, 23, 25, 26, 28, 29, 31, 32, 34, 36,
  41, 47, 53, 59, 65, 71,
  77, 83, 89, 94, 100,
];
type Brick = { i: number; col: number; row: number; x: number; yTop: number; land: number; tilt: number };
const BRICKS: Brick[] = Array.from({ length: INITIAL_BRICKS + LANDS.length }, (_, i) => {
  const row = Math.floor(i / COLS);
  const col = i % COLS;
  const r = random(`brick-tilt-${i}`) * 2 - 1;
  return {
    i, row, col,
    x: TOWER_X - (COLS / 2) * BW + col * BW,
    yTop: GROUND_Y - (row + 1) * BH,
    land: i < INITIAL_BRICKS ? -100 : LANDS[i - INITIAL_BRICKS],
    tilt: (Math.sign(r) || 1) * (1.2 + Math.abs(r) * 1.4),
  };
});

const REVEAL_START = 38;
const REVEAL_END = 67;
const K_OPEN = 1.85;
const K_REVEAL = 1.4;
const X_OPEN = 600;
const kTarget = (f: number) => {
  if (f <= REVEAL_START) return K_OPEN + (K_REVEAL - K_OPEN) * f / REVEAL_START;
  if (f <= REVEAL_END) {
    const p = camEase((f - REVEAL_START) / (REVEAL_END - REVEAL_START), 1);
    return Math.exp(Math.log(K_REVEAL) * (1 - p));
  }
  return 1 + 0.012 * camEase((f - REVEAL_END) / (DURATION - REVEAL_END), 1);
};
const towerScreenX = (f: number) => X_OPEN + (TOWER_X - X_OPEN) *
  camEase((f - REVEAL_START) / (REVEAL_END - REVEAL_START), 1);
const CAM_F = Array.from({ length: DURATION + 1 }, (_, f) => f);
const CAM_K = CAM_F.map(kTarget);
const CAM_CX = CAM_F.map((f) => TOWER_X - (towerScreenX(f) - W / 2) / CAM_K[f]);
// Pin the base above the caption area; the growing tower rises from that base.
// Both axes and zoom share the same damped tracker, rather than following bricks.
const CAM_CY = CAM_F.map((f) => GROUND_Y - (GROUND_SCREEN - H / 2) / CAM_K[f]);
const CAMERA = CAM_F.map((f) => runCamera2(f, CAM_F, CAM_CY, CAM_CX, CAM_K));
const frameTopY = (f: number) => {
  const c = CAMERA[Math.max(0, Math.min(DURATION, Math.floor(f)))];
  return c.cy - (H / 2 + 6) / c.k;
};

const FALL = 11;
const SETTLE = 6;
const HIGHEST_TOP = BRICKS.map((b) => {
  let top = Infinity;
  for (let f = Math.max(0, b.land - FALL); f <= Math.min(DURATION, Math.max(0, b.land)); f++) {
    top = Math.min(top, frameTopY(f));
  }
  return top;
});
const brickState = (b: Brick, frame: number) => {
  if (frame >= b.land + SETTLE) return { dy: 0, tilt: 0 };
  const spawn = b.land - FALL;
  if (frame < spawn) return null;
  if (frame >= b.land) {
    const t = Easing.out(Easing.cubic)((frame - b.land) / SETTLE);
    return { dy: 0, tilt: b.tilt * (1 - t) };
  }
  const startTop = HIGHEST_TOP[b.i] - BH - 2 * SHADOW_OFF - 8;
  const d = Math.max(80, b.yTop - startTop);
  const u = (frame - spawn) / FALL;
  return { dy: -d * (1 - (0.5 * u + 0.5 * u * u)), tilt: b.tilt };
};

const BAND_W = 11;
const BrickFace: React.FC<{ x: number; y: number; fill: string; face: boolean }> = ({ x, y, fill, face }) => (
  <g>
    <rect x={x} y={y} width={BW} height={BH} rx={3} fill={fill} />
    {face ? <>
      <rect x={x + BW / 2 - BAND_W / 2} y={y} width={BAND_W} height={BH} fill={SHADOW} />
      <text x={x + BW * 0.78} y={y + BH / 2 + 8} textAnchor="middle" fill={SHADOW}
        style={{ fontFamily, fontWeight: 900, fontSize: 23 }}>$</text>
    </> : null}
  </g>
);
const BrickGlyph: React.FC<{ b: Brick; dy: number; tilt: number }> = ({ b, dy, tilt }) => {
  const px = tilt > 0 ? b.x + BW : b.x;
  const py = b.yTop + BH;
  const transform = tilt === 0 ? `translate(0 ${dy})` : `translate(0 ${dy}) rotate(${tilt} ${px} ${py})`;
  return <g transform={transform}>
    <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
      <BrickFace x={b.x} y={b.yTop} fill={SHADOW} face={false} />
    </g>
    <BrickFace x={b.x} y={b.yTop} fill={INK} face />
  </g>;
};

/** Every-frame analytic envelope, exported for director review without rendering. */
export const portraitGeometry = CAMERA.slice(0, DURATION).map((c, frame) => {
  const s = sway(frame);
  const screenY = (y: number) => H / 2 + (y - c.cy) * c.k + s.dy;
  const screenX = (x: number) => W / 2 + (x - c.cx) * c.k + s.dx;
  return {
    frame, k: c.k,
    // Lowest real detail is the last bay's black tick; shadow margin is conservative.
    detailBottom: screenY(GROUND_Y + TICK_H + SHADOW_OFF),
    ghostLeft: screenX(BAY_X - 61 * JET_SCALE - HOLLOW_W / 2),
    ghostRight: screenX(BAY_X + 60 * JET_SCALE + HOLLOW_W / 2 + SHADOW_OFF),
    towerCenterX: screenX(TOWER_X),
  };
});
if (portraitGeometry.some((g) => g.detailBottom >= 1080)) {
  throw new Error("Billions portrait important detail entered caption bands");
}

const BillionsNothingFieldedPortrait: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAMERA[frame];
  const s = sway(frame);
  const transform = `translate(${W / 2 - cx * k + s.dx}px, ${H / 2 - cy * k + s.dy}px) scale(${k})`;
  const landed: Brick[] = [];
  const moving: { b: Brick; dy: number; tilt: number }[] = [];
  for (const b of BRICKS) {
    const state = brickState(b, frame);
    if (!state) continue;
    if (state.dy === 0 && state.tilt === 0) landed.push(b);
    else moving.push({ b, ...state });
  }
  landed.sort((a, b) => a.row - b.row || b.col - a.col);
  const rest = CAMERA[47];
  return <AbsoluteFill>
    <TallPaper frame={frame} cx={cx} cy={cy} cxRest={rest.cx} cyRest={rest.cy} k={k} />
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform }}>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Inked render={(fill) => <rect x={-1000} y={GROUND_Y} width={4000} height={STROKE} fill={fill} />} />
        {BAY_Y.map((ground) => <g key={ground}>
          {ground !== GROUND_Y ? <Inked render={(fill) =>
            <rect x={520} y={ground} width={520} height={STROKE} fill={fill} />
          } /> : null}
          {[-TICK_DX, TICK_DX].map((d) =>
            <rect key={d} x={BAY_X + d - TICK_W / 2} y={ground} width={TICK_W} height={TICK_H} fill={SHADOW} />
          )}
          <HollowJet ground={ground} />
        </g>)}
        {landed.map((b) => <BrickGlyph key={b.i} b={b} dy={0} tilt={0} />)}
        {moving.map(({ b, dy, tilt }) => <BrickGlyph key={b.i} b={b} dy={dy} tilt={tilt} />)}
      </svg>
    </div>
  </AbsoluteFill>;
};

export default BillionsNothingFieldedPortrait;
