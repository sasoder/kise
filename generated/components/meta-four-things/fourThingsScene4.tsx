import React, { useId } from "react";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  GEO,
  Label,
  LightSweep,
  METRIC,
  SPACE,
  STROKE,
  TYPE,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  type Silhouette,
} from "../kits/cheeky-pint/stoutShared";
import { SEQ, bayX, type SceneCam, type ScenePool, type SceneProps } from "./fourThingsShared";

// ===========================================================================
// fourThingsScene4 — scene 4 of the META4 set (out/meta4/BRIEF.md): "you cleared your calendar and
// just only did this for two months".
// Check line: the viewer can say "Mark emptied two months of the normal CEO calendar (business
// reviews, board, customers) and put one thing in it."
//
// ONE motion. Two month sheets (cream cards: a header strip with two binder holes, a 7 x 5 grid of
// day wells) stand side by side, crowded with cream meeting tiles of three lengths. A wave of
// tiles lifts off, left to right, and streams down to a kraft row of three short kraft trays under the sheets, each tile
// dimming by tone to board and turning flat as it goes, where they pile up by length (three ragged piles of equal height). Behind the wave ONE amber block floods the two months edge to edge (out of a slot on the
// first month's left edge, across the gap: one block, `MSL`). The camera then eases back so the
// tray shares the frame with the amber months, and each stack squares up as its label comes.
//
// Amber = Mark's move = the one thing in the calendar. Everything else cream / kraft.
// World px relative to the bay centre (x) and absolute in y; the settled camera is k 1.
// ===========================================================================

const N = 4;
const BX = bayX(N);
const LEN = SEQ[4].len;

// --- timing (local frames; clip 4 starts at 49.34 s, 23.976 fps) -----------------------------------
const T = {
  SLOT: [48, 56] as [number, number], // the slot on the first month's left edge opens
  WAVE: [34, 58] as [number, number], // tile departures sweep left to right ("you cleared your calendar" 38-56)
  FLOOD: [57, 90] as [number, number], // the amber front crosses both months ("just only did this for two months")
  MSL: 86, // the label on the amber
  SWEEP: [92, 106] as [number, number], // the clip's one light sweep, across the filled block
  CAM: [96, 226] as [number, number], // the camera eases back to share the frame with the tray
  SQUARE: { 3: 124, 2: 172, 1: 220 } as Record<number, number>, // a stack squares up (14 f) ...
  LABEL: { 3: 140, 2: 188, 1: 236 } as Record<number, number>, // ... and its label comes: 55.3 / 57.3 / 59.3 s
  ENTER: 12,
};

// --- geometry (world px) ------------------------------------------------------------------------------
const COLS = 7;
const ROWS = 5;
const CW = 64; // a day
const RH = 88;
const INSET = 9; // sheet edge to the grid
const HEAD = 64; // the header strip
const SHEET_W = COLS * CW + 2 * INSET; // 466
const SHEET_H = HEAD + ROWS * RH + INSET; // 513
const GAP = 24; // between the two months
const SHEET_TOP = 540;
const GRID_TOP = SHEET_TOP + HEAD; // 604
const GRID_BOT = GRID_TOP + ROWS * RH; // 1044
const GRID_CY = (GRID_TOP + GRID_BOT) / 2; // 824
const sheetLeft = (m: number) => BX + (m === 0 ? -(GAP / 2 + SHEET_W) : GAP / 2);
const gridLeft = (m: number) => sheetLeft(m) + INSET;
const WELL = 3; // a well's inset in its day
const TILE_H = 32; // a meeting tile on the sheet
const LANE_Y = [13, 50]; // two lanes per day (from the day's top)
const AMBER_X0 = gridLeft(0);
const AMBER_X1 = gridLeft(1) + COLS * CW;

// three short trays (never one long line: it would read as a chart axis), a pile of tiles on each
const TRAY = { top: 1471, h: 20, pad: 26 };
const PILE = { h: 240, gap: 3.6, max: 17 }; // every pile the same height (they are piles, not data)
const STACK_X: Record<number, number> = { 3: BX - 300, 2: BX + 20, 1: BX + 320 };
const STACK_LABEL: Record<number, string[]> = { 3: ["business", "review"], 2: ["board"], 1: ["customers"] };
const LABEL_PX = 40; // phone width: the three names must read at 270 px
const LABEL_LEAD = 46;

// --- the camera: close on the two months, then back so the tray shares the frame -----------------------
const CAM_OPEN: SceneCam = { dx: 0, dy: GRID_CY - 960, k: 1.06 }; // the grid's centre at the middle of the frame
const CAM_END: SceneCam = { dx: 0, dy: -30, k: 1 }; // the amber's foot at screen y 1074: clear of the caption strip
const smoother = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const sceneCam4 = (t: number): SceneCam => {
  const e = smoother((t - T.CAM[0]) / (T.CAM[1] - T.CAM[0]));
  return { dx: 0, dy: lerp(CAM_OPEN.dy, CAM_END.dy, e), k: Math.exp(lerp(Math.log(CAM_OPEN.k), 0, e)) };
};
/** The light stays on the months (the amber block is the brightest thing in frame). */
export const scenePool4 = (): ScenePool => ({ dx: 0, dy: GRID_CY - 960 });

// --- the meeting tiles ------------------------------------------------------------------------------------
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// a lane of seven days: [first day, days] per tile
const LANES: [number, number][][] = [
  [[0, 3], [3, 1], [5, 2]],
  [[0, 2], [2, 3], [6, 1]],
  [[1, 1], [2, 2], [4, 3]],
  [[0, 1], [2, 3], [5, 2]],
  [[0, 2], [3, 1], [4, 3]],
  [[1, 3], [4, 2], [6, 1]],
  [[0, 3], [4, 2]],
  [[0, 1], [1, 2], [4, 3]],
  [[2, 2], [4, 1], [5, 2]],
  [[0, 2], [2, 1], [3, 3], [6, 1]],
];
type Tile = {
  id: number;
  len: number; // days: 3 = business review, 2 = board, 1 = customers
  x: number; // on the sheet: left, top, width
  y: number;
  w: number;
  t0: number; // departs
  dur: number;
  idx: number; // its place in its stack (0 = the bottom)
  scatter: number; // where it lands, off the pile's axis (eased in a little when the pile is named)
  rot: number; // how it lies on the pile (degrees)
  pitch: number; // its pile's slab pitch (the piles are equal in height)
};
const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  let id = 0;
  for (let m = 0; m < 2; m++) {
    for (let r = 0; r < ROWS; r++) {
      for (let l = 0; l < 2; l++) {
        const lane = LANES[Math.floor(hash01(m * 31 + r * 7 + l * 3 + 5) * LANES.length) % LANES.length];
        for (const [c0, len] of lane) {
          const x = gridLeft(m) + c0 * CW + 2 * WELL;
          const w = len * CW - 4 * WELL;
          const u = (x + w / 2 - AMBER_X0) / (AMBER_X1 - AMBER_X0);
          out.push({
            id,
            len,
            x,
            y: GRID_TOP + r * RH + LANE_Y[l],
            w,
            t0: T.WAVE[0] + (T.WAVE[1] - T.WAVE[0]) * u + 6 * hash01(id * 3 + 1),
            dur: 38 + 9 * hash01(id * 5 + 2),
            idx: 0,
            scatter: (hash01(id * 7 + 3) * 2 - 1) * 11,
            rot: (hash01(id * 11 + 4) * 2 - 1) * 2.4,
            pitch: 0,
          });
          id++;
        }
      }
    }
  }
  // even the piles out (at most PILE.max of a kind), then a pile fills in the order its tiles land
  const kept: Tile[] = [];
  for (const len of [1, 2, 3]) {
    const mine = out
      .filter((q) => q.len === len)
      .sort((a, b) => hash01(a.id * 13 + 6) - hash01(b.id * 13 + 6))
      .slice(0, PILE.max)
      .sort((a, b) => a.t0 + a.dur - (b.t0 + b.dur));
    mine.forEach((q, i) => {
      q.idx = i;
      q.pitch = PILE.h / mine.length;
    });
    kept.push(...mine);
  }
  return kept;
})();
const ORDER = [...TILES].sort((a, b) => a.idx - b.idx || a.id - b.id); // lower slabs first

/** A rect turned `deg` about its centre, as a path (a pile's slabs in the union silhouette). */
const turnedRect = (cx: number, cy: number, w: number, h: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const sn = Math.sin(a);
  const pt = (u: number, v: number) => `${(cx + u * c - v * sn).toFixed(2)} ${(cy + u * sn + v * c).toFixed(2)}`;
  return `M${pt(-w / 2, -h / 2)}L${pt(w / 2, -h / 2)}L${pt(w / 2, h / 2)}L${pt(-w / 2, h / 2)}Z`;
};
const trayRect = (len: number) => {
  const w = len * CW - 4 * WELL + 2 * TRAY.pad;
  return { x: STACK_X[len] - w / 2, w };
};

/** A tile at scene time t: its rect, tone, lift, and whether it has left / landed. */
const tileAt = (q: Tile, t: number) => {
  const p = clamp01((t - q.t0) / q.dur);
  const sq = 1 - 0.38 * smoothstep((t - T.SQUARE[q.len]) / 14); // squares up a little; stays a pile
  const slabH = q.pitch - PILE.gap;
  const x1 = STACK_X[q.len] + q.scatter * sq; // centre
  const y1 = TRAY.top - q.idx * q.pitch - slabH / 2; // centre
  const x0 = q.x + q.w / 2;
  const y0 = q.y + TILE_H / 2;
  const cx = lerp(x0, x1, smoothstep(p / 0.72));
  const cy = lerp(y0, y1, p * p * (2 - p)); // leaves from rest, lands on its pile still moving (no hover over the stack)
  const h = lerp(TILE_H, slabH, smoothstep((p - 0.18) / 0.55));
  const rot = q.rot * sq * smoothstep((p - 0.3) / 0.6);
  const f = p * q.dur;
  const lift = Math.min(smoothstep(f / 5), 1 - smoothstep((f - (q.dur - 7)) / 7));
  return { x: cx - q.w / 2, y: cy - h / 2, cx, cy, rot, w: q.w, h, dim: smoothstep((f - 3) / 14), lift, left: p > 0, landed: p >= 1 };
};

// ===========================================================================
// THE SCENE
// ===========================================================================
export const Scene4: React.FC<SceneProps> = ({ t: tIn, cam, k }) => {
  const uid = `ft4${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const t = Math.min(tIn, LEN + 40); // settled long before; the clamp only bounds the maths
  const r = GEO.RADIUS;
  const band = amberBandFor(cam);
  const hair = STROKE.HAIRLINE / k;

  // --- the amber flood ---------------------------------------------------------------------------------
  const fAt = (f: number) => smoothstep((f - T.FLOOD[0]) / (T.FLOOD[1] - T.FLOOD[0]));
  const fp = fAt(t);
  const front = lerp(AMBER_X0, AMBER_X1, fp);
  const moving = clamp01((fAt(t + 0.5) - fAt(t - 0.5)) / 0.012);
  const amberW = front - AMBER_X0;
  const slot = smoothstep((t - T.SLOT[0]) / (T.SLOT[1] - T.SLOT[0]));
  const gridH = GRID_BOT - GRID_TOP;

  // --- sheets -------------------------------------------------------------------------------------------
  const wellTone = mixHex(COLOR.creamFoot, COLOR.board, 0.5);
  const sheets = [0, 1].map((m) => {
    const x = sheetLeft(m);
    let wells = "";
    for (let rr = 0; rr < ROWS; rr++) {
      for (let c = 0; c < COLS; c++) {
        wells += rectPath(gridLeft(m) + c * CW + WELL, GRID_TOP + rr * RH + WELL, CW - 2 * WELL, RH - 2 * WELL, r - 1);
      }
    }
    const holes = [0.26, 0.74].map((u) => ({ x: x + SHEET_W * u - 8, y: SHEET_TOP + 14, w: 16, h: 30 }));
    return { m, x, wells, holes };
  });
  const sheetSil: Silhouette = sheets.map((s) => ({ d: rectPath(s.x, SHEET_TOP, SHEET_W, SHEET_H, r) }));
  if (amberW > 1) sheetSil.push({ d: rectPath(AMBER_X0, GRID_TOP, amberW, gridH, r) });

  // --- tiles --------------------------------------------------------------------------------------------
  const states = ORDER.map((q) => ({ q, s: tileAt(q, t) }));
  const trays = [3, 2, 1].map((len) => ({ len, ...trayRect(len) }));
  const traySil: Silhouette = trays.map((q) => ({ d: rectPath(q.x, TRAY.top, q.w, TRAY.h, r) }));
  states.forEach(({ s }) => {
    if (s.landed) traySil.push({ d: turnedRect(s.cx, s.cy, s.w, s.h, s.rot) });
  });

  // rungs: the day grid, seen through the amber
  let rungs = "";
  for (let m = 0; m < 2; m++) {
    const gl = gridLeft(m);
    for (let c = m === 0 ? 1 : 0; c <= (m === 0 ? COLS : COLS - 1); c++) rungs += `M${gl + c * CW} ${GRID_TOP}V${GRID_BOT}`;
    for (let rr = 1; rr < ROWS; rr++) rungs += `M${gl} ${GRID_TOP + rr * RH}H${gl + COLS * CW}`;
  }

  const labelY = TRAY.top + TRAY.h + (SPACE.CLEAR + LABEL_PX * METRIC.cap) / k;
  const edgeW = EDGE.CREAM / k;

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={SHEET_TOP} x2="0" y2={SHEET_TOP + SHEET_H}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={TRAY.top} x2="0" y2={TRAY.top + TRAY.h}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}lead`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.9" />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}wo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0" />
        </linearGradient>
        {/* the binder holes, knocked out of the sheets to the ground */}
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={BX - 520} y={SHEET_TOP - 4} width={1040} height={SHEET_H + 8}>
          <rect x={BX - 520} y={SHEET_TOP - 4} width={1040} height={SHEET_H + 8} fill="#fff" />
          {sheets.flatMap((s) => s.holes.map((h, i) => <rect key={`${s.m}-${i}`} x={h.x} y={h.y} width={h.w} height={h.h} rx={h.w / 2} fill="#000" />))}
        </mask>
        <clipPath id={`${uid}f`}>
          <rect x={AMBER_X0} y={GRID_TOP} width={Math.max(0, amberW)} height={gridH} />
        </clipPath>
      </defs>

      {/* the trays: three short kraft ledges under the months, there from the start; one shadow with what lies on them */}
      <ElevationShadow silhouette={traySil} elevation="rest" />
      {trays.map((q) => (
        <g key={q.len}>
          <path d={rectPath(q.x, TRAY.top, q.w, TRAY.h, r)} fill={`url(#${uid}b)`} />
          <path d={`M${q.x + r} ${TRAY.top + edgeW / 2}H${q.x + q.w - r}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edgeBoard} strokeWidth={edgeW} />
        </g>
      ))}

      {/* the two months (+ the amber on them): one object, one shadow */}
      <ElevationShadow silhouette={sheetSil} elevation="rest" />
      <g mask={`url(#${uid}k)`}>
        {sheets.map((s) => (
          <path key={s.m} d={rectPath(s.x, SHEET_TOP, SHEET_W, SHEET_H, r)} fill={`url(#${uid}c)`} />
        ))}
      </g>
      {sheets.map((s) => (
        <g key={s.m}>
          <path d={`M${s.x + r} ${SHEET_TOP + edgeW / 2}H${s.x + SHEET_W - r}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={edgeW} />
          {/* the day wells: slots in the card, a short occlusion under each one's top edge */}
          <path d={s.wells} fill={wellTone} />
          {Array.from({ length: ROWS }, (_, rr) => (
            <rect key={rr} x={gridLeft(s.m) + WELL} y={GRID_TOP + rr * RH + WELL} width={COLS * CW - 2 * WELL} height={6} fill={`url(#${uid}wo)`} />
          ))}
          {Array.from({ length: COLS - 1 }, (_, c) => (
            <rect key={c} x={gridLeft(s.m) + (c + 1) * CW - WELL} y={GRID_TOP} width={2 * WELL} height={gridH} fill={`url(#${uid}c)`} />
          ))}
        </g>
      ))}

      {/* the slot the amber comes out of: the first month's left grid edge */}
      {slot > 0.001 && fp < 1 ? (
        <rect
          x={AMBER_X0 - EDGE.SLOT / k / 2}
          y={GRID_CY - (gridH / 2) * slot}
          width={EDGE.SLOT / k}
          height={gridH * slot}
          fill={COLOR.inkDark}
          fillOpacity={ALPHA.slot}
        />
      ) : null}

      {/* THE ONE THING: the amber block floods both months, edge to edge */}
      {amberW > 0.5 ? (
        <g>
          <g style={{ filter: bloomFilter(k) }}>
            <path d={rectPath(AMBER_X0, GRID_TOP, amberW, gridH, r)} fill={`url(#${uid}a)`} />
          </g>
          <g clipPath={`url(#${uid}f)`}>
            <path d={rungs} stroke={COLOR.rung} strokeWidth={hair} strokeOpacity={0.55} fill="none" />
            <rect x={AMBER_X0} y={GRID_TOP} width={amberW} height={EDGE.HOT_FALL / k} fill={`url(#${uid}hf)`} />
            <path d={`M${AMBER_X0 + r} ${GRID_TOP + EDGE.HOT / k / 2}H${front - r}`} stroke={COLOR.amberHot} strokeWidth={EDGE.HOT / k} />
            {moving > 0.01 ? (
              <g opacity={moving}>
                <rect x={front - 22 / k} y={GRID_TOP} width={22 / k} height={gridH} fill={`url(#${uid}lead)`} />
                <rect x={front - EDGE.HOT / k} y={GRID_TOP} width={EDGE.HOT / k} height={gridH} fill={COLOR.amberHot} />
              </g>
            ) : null}
          </g>
          <LightSweep x={AMBER_X0} y={GRID_TOP} w={AMBER_X1 - AMBER_X0} h={gridH} k={k} t={(t - T.SWEEP[0]) / (T.SWEEP[1] - T.SWEEP[0])} on="amber" />
        </g>
      ) : null}
      <Label x={BX} y={GRID_CY + (TYPE.SECONDARY * METRIC.cap) / 2 / k} k={k} text="MSL" px={TYPE.SECONDARY} tone="dark" enter={clamp01((t - T.MSL) / T.ENTER)} />

      {/* the meeting tiles: on the sheet, in the air (lifted one level, their own shadow), on a stack */}
      {states.map(({ q, s }) => {
        const flying = s.left && !s.landed;
        const rad = Math.min(r, s.h / 2 - 0.5);
        const d = rectPath(s.x, s.y, s.w, s.h, rad);
        return (
          <g key={q.id} transform={Math.abs(s.rot) > 0.01 ? `rotate(${s.rot.toFixed(3)} ${s.cx.toFixed(2)} ${s.cy.toFixed(2)})` : undefined}>
            {flying ? <ElevationShadow silhouette={[{ d }]} elevation="rest" lift={s.lift} /> : null}
            <path d={d} fill={mixHex(COLOR.cream, COLOR.board, s.dim)} />
            <path
              d={`M${s.x + rad} ${s.y + edgeW / 2}H${s.x + s.w - rad}`}
              stroke={COLOR.edge}
              strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, s.dim)}
              strokeWidth={edgeW}
            />
          </g>
        );
      })}

      {/* what a CEO's calendar normally holds: the three stacks, named as he names them */}
      {[3, 2, 1].flatMap((len) =>
        STACK_LABEL[len].map((line, i) => (
          <Label
            key={`${len}-${i}`}
            x={STACK_X[len]}
            y={labelY + (i * LABEL_LEAD) / k}
            k={k}
            text={line}
            px={LABEL_PX}
            tone="cream"
            enter={clamp01((t - T.LABEL[len] - i * 2) / T.ENTER)}
          />
        )),
      )}
    </g>
  );
};
