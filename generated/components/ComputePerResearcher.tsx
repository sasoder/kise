import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "./outgrowShared";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  GEO,
  LightSweep,
  STROKE,
  StoutStage,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  type Silhouette,
} from "./stoutShared";
import { Label, PEG, PegSlot, PersonPeg, pegPath } from "./talentShared";

// ===========================================================================
// ComputePerResearcher — cut 4 of the Cheeky Pint S4E03 (Meta / MSL) clip "Talent density beat team
// size", in the stout system (stoutShared.tsx, palette B1) with the clip's vocabulary (talentShared.tsx).
// 1080x1920, 23.976 fps, opaque.
//
// CHECK LINE: Meta doesn't smear its compute thinly over lots of teams; it piles the same compute onto
// a few key researchers, so each one gets a huge amount.
//
// THE MOTION (one journey of ONE fixed amount of amber, its area conserved on every frame): the amber
// stands in a wide glass tank over the middle of a row of fifteen tiles; it runs out sideways along a
// shallow trough and the camera travels down the row with it, tile after tile under a thin layer; it
// draws back (the trough's arms retract behind it), three measuring glasses rise out of the slots of
// the three cream tiles, and the tank's lid presses the same amber up them into three towers far above
// the three amber people at their feet (the one LightSweep on the top-out); the spent tank sinks
// behind the row into the ground.
//
// DURATION: slot = round(10.844 s x 23.976) = 260 frames, + a 12-frame living tail = 272.
//
// FRAMES: 0-56 the full tank over the middle five tiles, a steady push · 55-60 the gates lift · 58-114 the
// spread (the camera travels right with the layer's leading edge to the row's end, 60-108) · 116-144 the
// draw-back, the trough's arms retracting behind it (the camera returns 114-154; the kraft tiles lose
// the light 121-152) · 152-190 the three glasses rise from their slots (the camera already holds their
// full height) · 158-168 the amber runs down them to the tiles and the lid comes down onto it ·
// 168-243 the lid presses the amber up the glasses (slow, then the main climb from ~200) · 243-255 the
// LightSweep · 244-258 the flat, empty tank sinks behind the row into the ground · tail: slow drift.
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 260;
export const DURATION = SLOT_FRAMES + 12;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world (WORLD px) ---------------------------------------------------------------------------
const FLOOR = GEO.FLOOR; // 1296
const N = 15;
const MID = 7; // tiles 6, 7, 8 are the cream three
const TILE = { w: 148, h: 64, pitch: 172 } as const;
const TILE_TOP = FLOOR - TILE.h;
const PEG_DX = -30; // every peg stands left of its tile's middle …
const COL_DX = 40; // … beside the socket for a glass
const COL = { w: 52, fill: 1026, glass: 1038, rung: 1026 / 5 } as const;
const tileX = (i: number) => (i - MID) * TILE.pitch;
const isKey = (i: number) => Math.abs(i - MID) <= 1;

// the plumbing: a shallow trough over all fifteen, a chunky tank standing in its middle
const YB = TILE_TOP - 96; // the trough's floor (24 px over the pegs' heads)
const ROW_END = MID * TILE.pitch + TILE.w / 2 + 4;
const TROUGH = { h: 84, x0: -ROW_END, x1: ROW_END } as const;
const XL = -280;
const XR = 280;
const TANK_W = XR - XL;
/** THE AMOUNT (world px²): the full tank = the layer over fifteen tiles = three towers. */
const COLS_W = 3 * COL.w;
const AMOUNT = COLS_W * COL.fill;
const TANK_FILL = AMOUNT / TANK_W; // 286
const TANK_TOP = YB - TANK_FILL - 24;
const WALL = YB - TANK_TOP;
const DROP = TILE_TOP - YB; // 96: from the tank's floor down to a tile's top
const D_START = 76; // the layer's thickness as it leaves the tank (it thins to AMOUNT / trough length)
const LT = 120; // the length of the layer's leading wedge
const ARM_LEAD = 40; // a retracting arm's end cap runs this far ahead of the amber

// --- the clock --------------------------------------------------------------------------------------
const T = {
  gateUp: [55, 60],
  spread: [58, 114],
  back: [116, 144],
  gateDown: [144, 149],
  dim: [121, 152],
  glass: [152, 190],
  drop: [158, 168],
  creep: [168, 206],
  climb: [198, 243],
  sweep: [243, 255],
  sink: [244, 258],
} as const;
const span = (t: number, [a, b]: readonly [number, number]) => (t - a) / (b - a);
/** Rest to rest with a long soft landing. */
const restToRest = (v: number, p = 3) => {
  const u = clamp01(v);
  return 1 - Math.pow(1 - u, p) * (1 + p * u);
};

// --- the liquid -------------------------------------------------------------------------------------
/** The layer's thickness (0..1 of d) at a distance w behind its leading edge. */
const prof = (w: number) => {
  const v = clamp01(w / LT);
  return 1 - (1 - v) * (1 - v);
};
/** ∫ prof from 0 to w. */
const profInt = (w: number) => {
  if (w <= 0) return 0;
  if (w >= LT) return w - LT / 3;
  const v = w / LT;
  return LT * (v - (1 - Math.pow(1 - v, 3)) / 3);
};
type Liquid = {
  /** the layer's thickness */
  d: number;
  /** the level in the tank above the trough's floor */
  ht: number;
  /** each side's virtual leading edge (distance from the tank wall) and how far the amber reaches */
  DR: number;
  ER: number;
  DL: number;
  EL: number;
  /** each trough arm's length (it retracts behind the amber on the way back) */
  armR: number;
  armL: number;
  /** the tank's lid (world y) and how far the spent tank has sunk */
  lid: number;
  sink: number;
  /** the three glasses: how much of each has risen, the amber's lower end and its top (world y) */
  glass: number;
  colLow: number | null;
  colTop: number;
};
const liquidAt = (t: number): Liquid => {
  const p = t < T.back[0] ? smoothstep(span(t, T.spread)) : 1 - smoothstep(span(t, T.back));
  const lenR = TROUGH.x1 - XR;
  const lenL = XL - TROUGH.x0;
  const DR = p * (lenR + LT);
  const DL = p * (lenL + LT);
  const ER = Math.min(DR, lenR);
  const EL = Math.min(DL, lenL);
  const eff = profInt(DR) - profInt(DR - ER) + profInt(DL) - profInt(DL - EL);
  const d = Math.min(lerp(D_START, AMOUNT / (TROUGH.x1 - TROUGH.x0), smoothstep(p)), AMOUNT / (TANK_W + eff));
  let ht = (AMOUNT - d * eff) / TANK_W;
  const lead = ARM_LEAD * (1 - smoothstep(span(t, T.gateDown)));
  const armR = t < T.back[0] ? lenR : Math.min(lenR, DR + lead);
  const armL = t < T.back[0] ? lenL : Math.min(lenL, DL + lead);
  // the three glasses
  const glass = COL.glass * restToRest(span(t, T.glass), 3);
  let colLow: number | null = null;
  let colTop = YB - ht;
  let lid = TANK_TOP;
  if (t >= T.drop[0]) {
    colLow = lerp(YB, TILE_TOP, smoothstep(span(t, T.drop)));
    if (t < T.creep[0]) {
      ht = (AMOUNT - COLS_W * (colLow - YB)) / TANK_W;
      colTop = YB - ht;
      lid = lerp(TANK_TOP, YB - ht, smoothstep(span(t, T.drop)));
    } else {
      const c0 = DROP + (AMOUNT - COLS_W * DROP) / TANK_W;
      const e = 0.16 * smoothstep(span(t, T.creep)) + 0.84 * restToRest(span(t, T.climb), 3);
      const c = lerp(c0, COL.fill, e);
      ht = Math.max(0, (AMOUNT - COLS_W * c) / (TANK_W - COLS_W));
      colTop = TILE_TOP - c;
      lid = YB - ht;
    }
  }
  const sink = (FLOOR - YB + 6) * smoothstep(span(t, T.sink));
  return { d, ht, DR, ER, DL, EL, armR, armL, lid: lid + sink, sink, glass, colLow, colTop };
};

// --- the camera -------------------------------------------------------------------------------------
const K = { open: 1.2, pushed: 1.3, travel: 1.3, end: 1.22 } as const;
const END_Y = 717; // the towers, their people and the label, centred
const FEET_Y = 1076; // where the pegs' feet stand on screen until the towers: just above the caption strip
const TRAVEL_X = 920;
const camAt = (f: number): Cam => {
  const g = (a: number, b: number) => smoothstep((f - a) / (b - a));
  const push = 1 - Math.pow(1 - clamp01(f / 56), 1.6); // moving on frame 0, at rest as the gates lift
  const k = Math.exp(
    Math.log(K.open) +
      Math.log(K.pushed / K.open) * push +
      Math.log(K.travel / K.pushed) * g(54, 74) +
      Math.log(K.end / K.travel) * g(142, 178) +
      Math.log(1.24 / K.end) * g(236, 320),
  );
  const x = TRAVEL_X * g(60, 108) - TRAVEL_X * g(114, 154);
  const y = lerp(TILE_TOP - (FEET_Y - 960) / k, END_Y, g(142, 178));
  return { x, y, k };
};
const REST = camAt(0);

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `cr${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ===========================================================================
// THE PLUMBING: the trough's two arms, the tank, the amber in them
// ===========================================================================
const Plumbing: React.FC<{ t: number; k: number; L: Liquid; band: [number, number] }> = ({ t, k, L, band }) => {
  const uid = uidOf(useId());
  const r = GEO.RADIUS;
  const hair = STROKE.HAIRLINE / k;
  const h2 = hair / 2;
  const gate = smoothstep(span(t, T.gateUp)) * (1 - smoothstep(span(t, T.gateDown)));
  const troughTop = YB - TROUGH.h;
  // the layer each side of the tank: its surface from the wall out to its leading edge
  const side = (dir: 1 | -1, D: number, E: number) => {
    if (E <= 0.2) return null;
    const wall = dir === 1 ? XR : XL;
    const pts: [number, number][] = [];
    const n = Math.max(2, Math.ceil(E / 10));
    for (let i = 0; i <= n; i++) {
      const s = (E * i) / n;
      pts.push([wall + dir * s, YB - L.d * prof(D - s)]);
    }
    const surface = pts.map(([px, py], i) => `${i ? "L" : "M"}${f2(px)} ${f2(py)}`).join("");
    return { surface, body: `${surface}L${f2(wall + dir * E)} ${f2(YB)}L${f2(wall)} ${f2(YB)}Z` };
  };
  const right = side(1, L.DR, L.ER);
  const left = side(-1, L.DL, L.EL);
  const tankD = L.ht > 0.3 ? rectPath(XL, YB - L.ht, TANK_W, L.ht, 0) : null;
  const tankSurface = tankD ? `M${f2(XL)} ${f2(YB - L.ht)}H${f2(XR)}` : null;
  const bodies = [tankD, right?.body, left?.body].filter((d): d is string => !!d);
  const surfaces = [tankSurface, right?.surface, left?.surface].filter((d): d is string => !!d);
  // the tank: a lid and two walls (one rigid box once the gates are shut), standing on its floor plate
  const floorY = YB + L.sink;
  const lidY = L.lid;
  const pressed = t >= T.drop[0];
  const wallEnd = pressed ? lidY + WALL : lerp(YB, troughTop, gate);
  const tankGlass = floorY - lidY > 0.5 ? rectPath(XL, lidY, TANK_W, floorY - lidY, r, true, false) : null;
  const arm = (dir: 1 | -1, len: number) => {
    if (len <= 0.5) return null;
    const a = dir === 1 ? XR : XL;
    const b = a + dir * len;
    const sw = dir === 1 ? 1 : 0;
    return {
      body: rectPath(Math.min(a, b), troughTop, len, TROUGH.h, 0),
      line:
        `M${f2(a)} ${f2(troughTop + h2)}H${f2(b - dir * r)}A${r} ${r} 0 0 ${sw} ${f2(b - dir * h2)} ${f2(troughTop + r)}V${f2(YB - r)}` +
        `A${r} ${r} 0 0 ${sw} ${f2(b - dir * r)} ${f2(YB - h2)}H${f2(a)}`,
    };
  };
  const arms = [arm(1, L.armR), arm(-1, L.armL)].filter((a): a is { body: string; line: string } => !!a);
  const sil: Silhouette = [...(tankGlass ? [{ d: tankGlass, a: 0.3 }] : []), ...arms.map((a) => ({ d: a.body, a: 0.3 })), ...bodies.map((d) => ({ d }))];
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <clipPath id={`${uid}c`}>
          {bodies.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
        {/* the spent tank sinks into the ground behind the row: nothing of it shows below the floor line */}
        <clipPath id={`${uid}g`}>
          <rect x={TROUGH.x0 - 400} y={TANK_TOP - 400} width={TROUGH.x1 - TROUGH.x0 + 800} height={FLOOR - TANK_TOP + 400} />
        </clipPath>
      </defs>
      {wallEnd > FLOOR - 1 ? (
        <rect x={f2(XL - EDGE.SLOT_LIP / k)} y={f2(FLOOR - EDGE.SLOT / k / 2)} width={f2(TANK_W + (2 * EDGE.SLOT_LIP) / k)} height={f2(EDGE.SLOT / k)} fill={COLOR.shadow} fillOpacity={0.9} />
      ) : null}
      <g clipPath={`url(#${uid}g)`}>
        <ElevationShadow silhouette={sil} elevation="lifted" />
        {/* glass bodies */}
        {tankGlass ? <path d={tankGlass} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} /> : null}
        {arms.map((a, i) => (
          <path key={i} d={a.body} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
        ))}
        {/* the amber: one glow pass */}
        {bodies.length ? (
          <>
            <g style={{ filter: bloomFilter(k) }}>
              {bodies.map((d, i) => (
                <path key={i} d={d} fill={`url(#${uid}a)`} />
              ))}
            </g>
            <g clipPath={`url(#${uid}c)`} fill="none" strokeLinejoin="round">
              {surfaces.map((d, i) => (
                <path key={i} d={d} stroke={COLOR.amberHot} strokeOpacity={0.2} strokeWidth={f2((2 * EDGE.HOT_FALL) / k)} />
              ))}
              {surfaces.map((d, i) => (
                <path key={`h${i}`} d={d} stroke={COLOR.amberHot} strokeWidth={f2((2 * EDGE.HOT) / k)} />
              ))}
            </g>
          </>
        ) : null}
        {/* hairlines: the arms, the tank's floor plate, its lid and walls, the two gates */}
        <g fill="none" stroke={COLOR.glass} strokeWidth={f2(hair)}>
          {arms.map((a, i) => (
            <path key={i} d={a.line} strokeOpacity={ALPHA.glassLo} />
          ))}
          <path d={`M${f2(XL)} ${f2(Math.max(floorY, lidY) - h2)}H${f2(XR)}`} strokeOpacity={ALPHA.glassLo} />
          <path
            d={`M${f2(XL + h2)} ${f2(pressed ? wallEnd : troughTop)}V${f2(lidY + r)}A${r} ${r} 0 0 1 ${f2(XL + r)} ${f2(lidY + h2)}H${f2(XR - r)}A${r} ${r} 0 0 1 ${f2(XR - h2)} ${f2(lidY + r)}V${f2(pressed ? wallEnd : troughTop)}`}
            strokeOpacity={ALPHA.glassHi}
          />
          {!pressed && gate < 0.995 ? (
            <path d={`M${f2(XL + h2)} ${f2(troughTop)}V${f2(wallEnd)}M${f2(XR - h2)} ${f2(troughTop)}V${f2(wallEnd)}`} strokeOpacity={ALPHA.glassHi} />
          ) : null}
        </g>
      </g>
    </g>
  );
};

// ===========================================================================
// A TILE: the card, its person, its socket — and, for the three, the glass and the amber in it
// ===========================================================================
const RowTile: React.FC<{ i: number; t: number; k: number; L: Liquid; band: [number, number] }> = ({ i, t, k, L, band }) => {
  const uid = uidOf(useId());
  const r = GEO.RADIUS;
  const key = isKey(i);
  const x = tileX(i);
  const x0 = x - TILE.w / 2;
  const px = x + PEG_DX;
  const cx = x + COL_DX;
  const dim = key ? 0 : smoothstep(span(t, T.dim));
  const tileD = rectPath(x0, TILE_TOP, TILE.w, TILE.h, r);
  const top = key ? COLOR.cream : mixHex(COLOR.board, COLOR.ground, 0.25 * dim);
  const foot = key ? COLOR.creamFoot : mixHex(COLOR.boardFoot, COLOR.ground, 0.25 * dim);
  const g = key ? L.glass : 0;
  const gx = cx - COL.w / 2;
  const gy = TILE_TOP - g;
  const amber = key && L.colLow !== null && L.colLow - L.colTop > 0.3 ? { y: L.colTop, h: L.colLow - L.colTop } : null;
  const full = !!amber && L.colTop <= TILE_TOP - COL.fill + 0.5;
  const sil: Silhouette = [{ d: tileD }, { d: pegPath(px, TILE_TOP, PEG.S) }];
  if (g > 0.3) sil.push({ d: rectPath(gx, gy, COL.w, g, r, true, false), a: 0.3 });
  if (amber) sil.push({ d: rectPath(gx, amber.y, COL.w, amber.h, 0) });
  const hair = STROKE.HAIRLINE / k;
  const fall = EDGE.HOT_FALL / k;
  // the graduations: etched on the glass, they rise with it
  const marks: { y: number; on: boolean }[] = [];
  if (g > 0.3) {
    for (let m = 1; m <= 4; m++) {
      const up = m * COL.rung - (COL.glass - g);
      if (up <= 2 / k) continue;
      const y = TILE_TOP - up;
      const inCol = !!amber && y > amber.y + (EDGE.HOT + 2) / k && y < amber.y + amber.h;
      const inTank = y < YB && y > YB - L.ht + (EDGE.HOT + 2) / k;
      marks.push({ y, on: inCol || inTank });
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(TILE_TOP)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={foot} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={sil} elevation="rest" contact={{ x, y: FLOOR, w: TILE.w * 0.86 }} />
      {/* the glass body, the amber in it, the graduations */}
      {g > 0.3 ? <path d={rectPath(gx, gy, COL.w, g, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} /> : null}
      {amber ? (
        <>
          <g style={{ filter: bloomFilter(k) }}>
            <path d={rectPath(gx, amber.y, COL.w, amber.h, r, full, false)} fill={`url(#${uid}a)`} />
          </g>
          <path d={rectPath(gx, amber.y, COL.w, Math.min(fall, amber.h), r, full, false)} fill={`url(#${uid}hf)`} />
          <path d={`M${f2(gx + (full ? r : 0))} ${f2(amber.y + EDGE.HOT / k / 2)}H${f2(gx + COL.w - (full ? r : 0))}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
        </>
      ) : null}
      {marks.map((m, j) => (
        <line
          key={j}
          x1={f2(gx)}
          x2={f2(gx + COL.w)}
          y1={f2(m.y)}
          y2={f2(m.y)}
          stroke={m.on ? COLOR.rung : COLOR.glass}
          strokeOpacity={m.on ? 1 : ALPHA.glassLo}
          strokeWidth={f2(hair)}
        />
      ))}
      {/* the card and its lit edge */}
      <path d={tileD} fill={`url(#${uid}c)`} />
      <path
        d={`M${f2(x0 + r)} ${f2(TILE_TOP + EDGE.CREAM / k / 2)}H${f2(x0 + TILE.w - r)}`}
        stroke={COLOR.edge}
        strokeOpacity={key ? ALPHA.edge : lerp(ALPHA.edgeBoard, ALPHA.edgeBoard * 0.5, dim)}
        strokeWidth={f2(EDGE.CREAM / k)}
      />
      {/* the person, standing in the card's slot */}
      <PersonPeg x={px} y={TILE_TOP} k={k} tone={key ? "amber" : "kraft"} shade={0.36 * dim} shadow={false} slot="cream" amberBand={band} />
      {/* the socket; once a glass stands in it: the stout joint (foot occlusion + slot line) */}
      {g > 0.3 ? (
        <rect x={f2(gx)} y={f2(TILE_TOP - Math.min(g, EDGE.FOOT_AO / k))} width={COL.w} height={f2(Math.min(g, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
      ) : null}
      <PegSlot x={cx} y={TILE_TOP} size={COL.w / (1 - 16 / 429)} k={k} on="cream" open={g <= 0.3} />
      {/* the glass hairline: sides and top, open at the joint */}
      {g > 0.3 ? (
        <path
          d={
            g > 2 * r
              ? `M${f2(gx + hair / 2)} ${f2(TILE_TOP)}V${f2(gy + r)}A${r} ${r} 0 0 1 ${f2(gx + r)} ${f2(gy + hair / 2)}H${f2(gx + COL.w - r)}A${r} ${r} 0 0 1 ${f2(gx + COL.w - hair / 2)} ${f2(gy + r)}V${f2(TILE_TOP)}`
              : `M${f2(gx + hair / 2)} ${f2(TILE_TOP)}V${f2(gy + hair / 2)}H${f2(gx + COL.w - hair / 2)}V${f2(TILE_TOP)}`
          }
          fill="none"
          stroke={COLOR.glass}
          strokeOpacity={ALPHA.glassHi}
          strokeWidth={f2(hair)}
        />
      ) : null}
    </g>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const LABEL_PX = 60; // the one label, twice the house LABEL: it has to read at 270 px wide
const ComputePerResearcher: React.FC<Props> = () => {
  const t = useCurrentFrame();
  const uid = uidOf(useId());
  const cam = camAt(t);
  const k = cam.k;
  const band = amberBandFor(cam);
  const L = liquidAt(t);
  const lag = camAt(Math.max(0, t - 6));
  const sweep = span(t, T.sweep);
  const sx0 = tileX(MID - 1) + COL_DX - COL.w / 2;
  const sx1 = tileX(MID + 1) + COL_DX + COL.w / 2;
  const order = Array.from({ length: N }, (_, i) => i);
  // the label rides on whatever holds the amber: the tank's lid, then the tops of the three glasses
  const labelY = Math.min(TANK_TOP, TILE_TOP - L.glass) - 24 / k;
  const labelX = COL_DX * smoothstep(span(t, T.glass));
  return (
    <AbsoluteFill>
      <StoutStage S={t} cam={cam} rest={REST} pool={{ x: lag.x, y: lag.y - 20 }}>
        <Plumbing t={t} k={k} L={L} band={band} />
        {order.map((i) => (
          <RowTile key={i} i={i} t={t} k={k} L={L} band={band} />
        ))}
        <Label x={labelX} y={labelY} k={k} text="Compute" px={LABEL_PX} tone="cream" />
        {sweep > 0 && sweep < 1 ? (
          <g>
            <defs>
              <clipPath id={`${uid}s`}>
                {[MID - 1, MID, MID + 1].map((i) => (
                  <path key={i} d={rectPath(tileX(i) + COL_DX - COL.w / 2, L.colTop, COL.w, TILE_TOP - L.colTop, GEO.RADIUS, true, false)} />
                ))}
              </clipPath>
            </defs>
            <g clipPath={`url(#${uid}s)`}>
              <LightSweep x={sx0} y={L.colTop} w={sx1 - sx0} h={TILE_TOP - L.colTop} k={k} t={sweep} on="amber" r={0} />
            </g>
          </g>
        ) : null}
      </StoutStage>
    </AbsoluteFill>
  );
};

export default ComputePerResearcher;
