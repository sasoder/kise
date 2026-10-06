import { camFromTrack, clamp01, cumLen, easeOutCubic, evenEase, glideTargetAt, hash01, lerp, pointAtLen, runFollower, smoothstep } from "./chinatalkShared";
import type { Cam, Glide, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// tiedToTheDataTallGeom — the world, the clocks and the camera of the 9:16
// payoff cut (TiedToTheDataTall). Pure functions of the master clock S (local
// frames), audited by out/bharat-maven/Dt/audit.ts. World px = screen px - 70 in y
// at the WIDE framing (look (540, 765), k 1: the composition sits 70 px lower). Three stations stacked on one
// vertical axis: the use case (top), the data in its ENOUGH box (middle), the
// model (bottom). Clocks and state logic are carried over from the approved
// 16:9 cut (TiedToTheDataGeom.ts); geometry and camera are re-authored.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 144;
export const AXIS_X = 540;

// --- TOP: the use case (B's OPERATIONS frame) --------------------------------------
export const OPS_SEED = 4242;
export const OPS_TX = 0.76;
export const OPS_TY = 0.29;
export const FRAME_X = AXIS_X;
export const FRAME_Y = 400;
export const FRAME_W = 620;
export const FRAME_H = FRAME_W * 0.75;
export const SEAL_SIDE = FRAME_W * 0.105;
export const SEAL: Pt = { x: FRAME_X + (OPS_TX - 0.5) * FRAME_W, y: FRAME_Y + (OPS_TY - 0.5) * FRAME_H };
export const USE_LABEL: Pt = { x: FRAME_X, y: FRAME_Y - FRAME_H / 2 - 52 };
export const USE_WORD_S = 28;
/** the frame's outline: fraction written at S (the last edge is still wet on frame 0) */
export const frameDraw = (S: number) => 0.78 + 0.22 * easeOutCubic((S + 2) / 15);
export const frameWet = (S: number) => 1 - smoothstep((S - 9) / 12);

// --- MIDDLE: the data, in the ENOUGH box ---------------------------------------------
export const BOX_W = 620;
export const BOX_H = 250;
export const BOX_Y = 880;
export const BOX_X0 = AXIS_X - BOX_W / 2;
export const BOX_X1 = AXIS_X + BOX_W / 2;
export const BOX_Y0 = BOX_Y - BOX_H / 2;
export const BOX_Y1 = BOX_Y + BOX_H / 2;
const BOX_R = 16;
export const TILE = 104;
export const TILE_H = TILE * 0.75;
export const COLS = 5;
export const ROWS = 2;
const PITCH_X = 118;
const PITCH_Y = 96;
/** the order the slots fill: the bottom row, then the top row, each from the outside in, so a tile on its way never
 *  crosses a filled slot; the LAST one is the top-middle slot, right under the tie's foot */
const FILL_COLS = [0, 4, 1, 3, 2];
export const SLOTS: Pt[] = [];
for (const r of [1, 0]) {
  for (const c of FILL_COLS) SLOTS.push({ x: AXIS_X + (c - 2) * PITCH_X, y: BOX_Y + (r - 0.5) * PITCH_Y });
}
export const N_TILES = SLOTS.length;

/** The box outline as a closed polyline that starts at the TOP-MIDDLE (where
 *  the tie lands) and runs clockwise. */
const boxOutline = (): Pt[] => {
  const pts: Pt[] = [{ x: AXIS_X, y: BOX_Y0 }];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push({ x: cx + BOX_R * Math.cos(a), y: cy + BOX_R * Math.sin(a) });
    }
  };
  corner(BOX_X1 - BOX_R, BOX_Y0 + BOX_R, -Math.PI / 2);
  corner(BOX_X1 - BOX_R, BOX_Y1 - BOX_R, 0);
  corner(BOX_X0 + BOX_R, BOX_Y1 - BOX_R, Math.PI / 2);
  corner(BOX_X0 + BOX_R, BOX_Y0 + BOX_R, Math.PI);
  pts.push({ x: AXIS_X, y: BOX_Y0 });
  return pts;
};
export const BOX_PTS = boxOutline();
export const BOX_CUM = cumLen(BOX_PTS);
export const BOX_PERIM = BOX_CUM[BOX_CUM.length - 1];
/** arc length (clockwise from the top-middle) of the point the last tile lands under: the tie's foot */
export const BOX_LAST_S = 0;

// --- the tie line: straight down from the use case to the box --------------------------------
export const TIE_Y0 = FRAME_Y + FRAME_H / 2;
export const TIE_Y1 = BOX_Y0;
export const TIE_PTS: Pt[] = [
  { x: AXIS_X, y: TIE_Y0 },
  { x: AXIS_X, y: TIE_Y1 },
];
export const TIE_S0 = 27;
export const TIE_S1 = 44;
export const tieLen = (S: number) => (TIE_Y1 - TIE_Y0) * evenEase((S - TIE_S0) / (TIE_S1 - TIE_S0), 0.3);
export const tieBead = (S: number) => smoothstep((S - TIE_S0) / 3) * (1 - smoothstep((S - TIE_S1 + 1) / 6));
export const tieWet = (S: number) => smoothstep((S - TIE_S0) / 3) * (1 - smoothstep((S - TIE_S1) / 12));

// --- the box's clocks -----------------------------------------------------------------------
/** the dashed outline opens from the tie's foot round both sides */
export const BOX_DRAW_S0 = 38;
export const boxDraw = (S: number) => smoothstep((S - BOX_DRAW_S0) / 16);
/** when each tile lands in its slot (individual spacing) */
export const ARRIVE = [56.5, 59, 60.75, 63.5, 66.25, 69, 71.75, 74.5, 77.25, 80];
export const TRAVEL_F = 14;
export const FIRST_TRAVEL_F = 12.5;
/** the last slot is filled: the dashed outline turns solid, running round from that corner */
export const REACH_S = ARRIVE[N_TILES - 1];
export const boxSolid = (S: number) => smoothstep((S - (REACH_S - 1)) / 12);
export const ENOUGH_LABEL: Pt = { x: BOX_X1 - 14, y: BOX_Y0 - 38 };
export const ENOUGH_WORD_S = 76;
export const DATA_LABEL: Pt = { x: BOX_X0 + 14, y: BOX_Y0 - 38 };
export const DATA_WORD_S = 50;

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const m = 1 - t;
  return {
    x: m * m * m * p0.x + 3 * m * m * t * p1.x + 3 * m * t * t * p2.x + t * t * t * p3.x,
    y: m * m * m * p0.y + 3 * m * m * t * p1.y + 3 * m * t * t * p2.y + t * t * t * p3.y,
  };
};

export type TileState = { x: number; y: number; reveal: number; stamp: number; scale: number; diffuse: number };
const TRAVEL_P0: Pt = { x: AXIS_X, y: TIE_Y0 + 24 };
/** a frame is this small while it rides the tie, and grows into its slot */
const RIDE_SCALE = 0.44;
/** Data tile i at S (null before it exists): a small frame rides the tie down
 *  from the use case (the first one starts at the tie's foot, the moment the
 *  line lands), fans out inside the box, grows into its slot and is stamped
 *  there with the use case's seal. */
export const tileAt = (i: number, S: number): TileState | null => {
  const a = ARRIVE[i];
  const slot = SLOTS[i];
  const dur = i === 0 ? FIRST_TRAVEL_F : TRAVEL_F;
  const u = (S - (a - dur)) / dur;
  if (u <= 0) return null;
  const e = evenEase(u, 0.22);
  const p0 = i === 0 ? { x: AXIS_X, y: TIE_Y1 - 16 } : TRAVEL_P0;
  const p = bez(p0, { x: AXIS_X, y: TIE_Y1 + 26 }, { x: lerp(AXIS_X, slot.x, 0.8), y: slot.y - 40 }, slot, e);
  return {
    x: p.x,
    y: p.y,
    reveal: clamp01((u + 0.05) / 0.22),
    stamp: clamp01((S - (a - 1)) / 7),
    scale: lerp(RIDE_SCALE, 1, smoothstep((e - (i === 0 ? 0.1 : 0.4)) / (i === 0 ? 0.9 : 0.6))),
    diffuse: 0,
  };
};

// --- BOTTOM: the model ----------------------------------------------------------------------
export const MODEL: Pt = { x: AXIS_X, y: 1185 };
export const MODEL_R = 100;
export const MODEL_LABEL: Pt = { x: MODEL.x - MODEL_R - 36, y: MODEL.y };
export const MODEL_WORD_S = 96;
/** the rings are written as the camera brings the model above the caption band */
export const modelAppear = (S: number) => clamp01((S - 62) / 14);
/** copies leave the box for the model (the box stays full): [slot index, leave S] */
export const FEEDS: [number, number][] = [
  [3, 80.5],
  [4, 82.5],
  [2, 84.5],
];
export const FLY_F = 14;
export const feedAt = (j: number, S: number): TileState | null => {
  const [slotI, s0] = FEEDS[j];
  const v = (S - s0) / FLY_F;
  if (v <= 0 || v >= 1) return null;
  const p0 = SLOTS[slotI];
  const h = hash01(j, 9);
  const p1 = { x: p0.x + 10 - 20 * h, y: p0.y + 90 };
  const p2 = { x: lerp(p0.x, MODEL.x, 0.7), y: MODEL.y - 110 - 20 * h };
  const b = bez(p0, p1, p2, MODEL, evenEase(v, 0.25));
  return { x: b.x, y: b.y, reveal: 1, stamp: 1, scale: 1 - 0.5 * smoothstep((v - 0.45) / 0.55), diffuse: clamp01((v - 0.7) / 0.3) * 0.9 };
};
export const feedArriveS = (j: number) => FEEDS[j][1] + FLY_F;
export const modelFill = (S: number) => {
  let f = 0;
  for (let j = 0; j < FEEDS.length; j++) f += smoothstep((S - (feedArriveS(j) - 3)) / 8);
  return f / FEEDS.length;
};
export const FULL_S = feedArriveS(FEEDS.length - 1) + 5;
/** the eye's dashed expected square turns solid as the wash fills */
export const eyeSolid = (S: number) => smoothstep((S - (FULL_S - 10)) / 10);

// --- the bracket's way back UP: round the outside of the box, never through the tiles ----------
export const BR_S0 = 94.5;
export const BR_S1 = 129;
export const BR_SIZE_IN = MODEL_R * 0.78;
export const BR_SIZE_OUT = 80;
export const BR_SIZE_END = 118;
export const BR_LOCK_SIDE = SEAL_SIDE * 1.72;
const BR_KNOTS: Pt[] = [MODEL, { x: 775, y: 1075 }, { x: 899, y: 945 }, { x: 902, y: 770 }, { x: 876, y: 640 }, { x: 800, y: 460 }, SEAL];
/** a Catmull-Rom spline through the knots, densely sampled (uniform speed by arc length) */
const spline = (k: Pt[]): Pt[] => {
  const out: Pt[] = [];
  const at = (i: number) => k[Math.max(0, Math.min(k.length - 1, i))];
  for (let i = 0; i < k.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let j = 0; j < 24; j++) {
      const t = j / 24;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(k[k.length - 1]);
  return out;
};
const BR_PTS = spline(BR_KNOTS);
const BR_CUM = cumLen(BR_PTS);
export const BR_LEN = BR_CUM[BR_CUM.length - 1];
export const bracketAt = (S: number) => {
  const u = clamp01((S - BR_S0) / (BR_S1 - BR_S0));
  const p = pointAtLen(BR_PTS, BR_CUM, BR_LEN * evenEase(u, 0.16));
  const size = lerp(lerp(BR_SIZE_IN, BR_SIZE_OUT, smoothstep(u / 0.3)), BR_SIZE_END, smoothstep((u - 0.72) / 0.28));
  return { ...p, size, u };
};
/** its own red square fades over the 6 f before the corners tighten */
export const eyeSquare = (S: number) => 1 - smoothstep((S - 118) / 6);
export const LOCK_S0 = 124;
export const lockU = (S: number) => clamp01((S - LOCK_S0) / 8);
/** the seal comes up from RED_DEEP to vermilion: one 12 f crossfade */
export const sealUp = (S: number) => smoothstep((S - 123) / 12);

// --- the hold's bead on the tie line -----------------------------------------------------------
export const PULSE_S0 = 126;
export const pulseAt = (S: number) => {
  const u = (S - PULSE_S0) / 26;
  if (u <= 0 || u >= 1) return null;
  return { s: (TIE_Y1 - TIE_Y0) * u, op: smoothstep(u / 0.15) * (1 - smoothstep((u - 0.85) / 0.15)) };
};

// --- the camera: down the column and back out ----------------------------------------------------
const CAM_START: Cam = { x: 530, y: 398, k: 1.36 };
const GLIDES: Glide[] = [
  // creep in on the use-case frame, toward the deep-red seal
  { f0: -16, f1: 38, dx: 26, dy: -14, k: 1.45 },
  // follow the bead down: the box and then the model enter
  { f0: 26, f1: 64, dx: -16, dy: 496, k: 1.19 },
  // settle on the box and the model while it fills
  { f0: 58, f1: 92, dy: 8, k: 1.16 },
  // pull back to the WIDE, travelling up with the bracket
  { f0: 89, f1: 130, dy: -123, k: 1.0 },
  // the held breath: a very slight drift in
  { f0: 124, f1: 160, k: 1.03 },
];
const F0 = -16;
const targetAt = (f: number) => glideTargetAt(CAM_START, GLIDES, f);
const RUN = runFollower(targetAt, F0, DURATION + 4);
export const camAt = camFromTrack(RUN.cams, F0);
export const REST_CAM = RUN.cams[DURATION - 1 - F0];
