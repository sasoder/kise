// ---------------------------------------------------------------------------
// betLoop — the shared LOOP WORLD of nik-trend-friend (cuts E LotOfBets and F FeedbackComesLate).
// Cheeky Pint, the stout board, palette B1 (stoutShared default). Owner: builder E. Other cuts import it
// and never edit it; changes after BET_LOOP_READY.md are logged in the clip's notes/SHARED_CHANGES.md.
//
// THE WORLD (world px; the resolved whole-loop frame is LOOP_CAM = k 1 centred on (540, 960), so world px
// = screen px there). Seen from the front and a little above, like the talentShared board:
//   * the COMPANY TILE at the bottom centre: a wide cream card (TILE_BOX), its mark (the Revolut R, or a
//     generic bank-building glyph) in ink on the left half, the MANAGER as a flat outline person glyph (ManagerGlyph,
//     WORLD REV 3: the office mark's grammar and stroke) mirrored on the right half, and a SLOT in its top edge at x 540 out of which the STACK rises (the slot joint).
//   * the LOOP: one closed track, a tall stadium cut into the board as a shallow groove. It leaves the
//     tile's left edge, curves up the left leg, over the top semicircle, down the right leg and curves
//     back into the tile's right edge. Travel is clockwise on screen. Two lanes, abreast (LANE_OFF either
//     side of the centreline), so a dense stream (a pair every 3 f) never strobes: per-frame travel stays
//     ~1/3 of the same-lane spacing. A few quiet chevrons on the centreline give the direction.
//   * BETS are poker chips seen from above (cream card discs with eight notches in the rim and an inner
//     ring), riding the lanes at constant speed, lifted one elevation (they travel). They start hidden
//     under the tile, come out from behind its left edge, and go back under its right edge. A chip turns
//     cream -> amber over the right leg (AMBER_S: the result is in) before it comes home.
//   * the STACKS (REV 1): every chip that comes home pushes ITS LANE'S stack one chip up out of the slot
//     (eased over PUSH_F frames, derived from the arrivals: stackCount()). Two stacks side by side, each one
//     chip wide (60, the chips on the track), of amber poker chips seen edge-on: UNIT 26 per chip, a deep
//     seam between chips, three lighter rim inserts per chip offset chip to chip, a rounded top chip with
//     the hot edge, rising up the middle of the loop. The tile and both stacks are ONE object with ONE
//     union shadow (CompanyShadow).
//
// GEOMETRY (world px):  tile x 320..760, y 1500..1770 · lanes meet the tile at y 1584 ± 34 · legs x 220
//   / 860 · corners r 100 at (320, 1484) / (760, 1484) · top semicircle r 320 at (540, 550) (centreline
//   top y 230) · groove 144 wide (outer edges x 148..932, top 158) · chips r 30 · two stacks 60 wide at x
//   507 / 573 (slot 126 + lips), UNIT 26 per chip (41 per stack reach y 434) · R 150 tall centred (430,
//   1635) · peg 166 at (654, 1738).
//
// EXPORTS: geometry (TILE_BOX, LANE_Y, LEG_X, CORNER_R, TOP_C, TOP_R, LANE_OFF, CHIP_R, GROOVE_W, STACK_W (the slot),
//   UNIT, STACK_X, MARK_BOX, PEG_AT, LOOP_LEN, S_AT, AMBER_S, PUSH_F, LOOP_CAM), the sampler (trackAt,
//   lanePoint), the chip clock (chipAt, arrivalOf, contactOf, stackCount, pairStream), the camera helper
//   (camAnchored), the stacks (STACK_CHIP_W, STACK_GAP, STACK_XS, stackOfLane, stackTop, stackTopOf, slotWidth),
//   the drawn parts (LoopTrack, ChipShadows, ChipGlow, Chip, Chips, CompanyShadow, CompanyTile, ChipStack,
//   BetLoopWorld), and the probe still (BetLoopProbe: empty / busy / building).
// STATUS: FINAL (director, Nov 13, after REV 1) + WORLD REV 2 (cold review: ink-brown manager, bigger chevrons,
// the "office" mark) + WORLD REV 3 (the client's note: the manager becomes ManagerGlyph, a flat outline person in
// the office mark's grammar, so the two icons on the tile are one set). Only render bugs from here, logged in
// SHARED_CHANGES.md.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { random } from "remotion";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  ALPHA,
  COLOR,
  EDGE,
  ELEVATION,
  STROKE,
  StoutStage,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  type Elevation,
  type ShadowLayer,
} from "../kits/cheeky-pint/stoutShared";
import { PegShadows, PegSlot, SEAT, pegPath, sinkDepth } from "../kits/cheeky-pint/talentShared";
import { REVOLUT_R_BOX, REVOLUT_R_D } from "./revolutMark";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `bl${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ===========================================================================
// GEOMETRY (world px)
// ===========================================================================
export const TILE_BOX = { x: 320, y: 1500, w: 440, h: 270 } as const;
export const TILE_R = 6; // the company card's corner radius (a big card: a touch more than GEO.RADIUS)
/** Where the lanes' centreline meets the tile (both sides). */
export const LANE_Y = 1584;
export const LEG_X = { left: 220, right: 860 } as const;
/** The bottom corners: the corner arc meets the tile edge exactly (LEG_X.left + CORNER_R = TILE_BOX.x). */
export const CORNER_R = 100;
export const TOP_R = (LEG_X.right - LEG_X.left) / 2; // 320
export const TOP_C = { x: 540, y: 230 + TOP_R } as const; // the centreline's top at y 230
/** The two lanes sit this far either side of the centreline (+ = toward the inside of the loop). */
export const LANE_OFF = 34;
export const CHIP_R = 30;
/** The groove: both lanes + a margin. */
export const GROOVE_W = 2 * LANE_OFF + 2 * CHIP_R + 16; // 144
/** How far inside the tile's edge a chip starts / ends (fully hidden). */
export const HIDE = 60;
/** The stacks (REV 1): TWO stacks side by side, one per lane, each one chip wide (the chips on the track),
 *  centred on STACK_X with a STACK_GAP between them. STACK_W = both stacks = the slot's width (lips aside).
 *  UNIT = one chip's thickness edge-on. Lane +1 (inside) feeds stack 0 (left), lane -1 feeds stack 1 (right). */
export const STACK_X = 540;
export const STACK_CHIP_W = 2 * CHIP_R; // 60
export const STACK_GAP = 6;
export const STACK_XS: readonly [number, number] = [STACK_X - (STACK_CHIP_W + STACK_GAP) / 2, STACK_X + (STACK_CHIP_W + STACK_GAP) / 2]; // 507, 573
export const STACK_W = 2 * STACK_CHIP_W + STACK_GAP; // 126
export const UNIT = 26;
/** Which stack a lane feeds. */
export const stackOfLane = (lane: number) => (lane >= 0 ? 0 : 1);
/** The mark on the tile's left half: its box (world px). */
export const MARK_H = 150;
export const MARK_BOX = (() => {
  const sc = MARK_H / REVOLUT_R_BOX.h;
  const w = REVOLUT_R_BOX.w * sc;
  const cx = TILE_BOX.x + 110;
  const cy = TILE_BOX.y + TILE_BOX.h / 2;
  return { x: cx - w / 2, y: cy - MARK_H / 2, w, h: MARK_H, cx, cy, sc };
})();
/** The manager peg: feet on its slot line (world px), size. */
export const PEG_AT = { x: TILE_BOX.x + TILE_BOX.w - 106, y: TILE_BOX.y + TILE_BOX.h - 32, size: 166 } as const;
/** The resolved whole-loop camera (world px = screen px). */
export const LOOP_CAM: Cam = { x: 540, y: 960, k: 1 };

// ===========================================================================
// THE TRACK SAMPLER — the centreline as analytic segments, in travel order
// ===========================================================================
type Seg =
  | { kind: "line"; x0: number; y0: number; x1: number; y1: number; len: number }
  | { kind: "arc"; cx: number; cy: number; r: number; a0: number; a1: number; len: number };
const line = (x0: number, y0: number, x1: number, y1: number): Seg => ({ kind: "line", x0, y0, x1, y1, len: Math.hypot(x1 - x0, y1 - y0) });
const arc = (cx: number, cy: number, r: number, a0deg: number, a1deg: number): Seg => {
  const a0 = (a0deg * Math.PI) / 180;
  const a1 = (a1deg * Math.PI) / 180;
  return { kind: "arc", cx, cy, r, a0, a1, len: Math.abs(a1 - a0) * r };
};
const XL = LEG_X.left;
const XR = LEG_X.right;
const CL = { x: XL + CORNER_R, y: LANE_Y - CORNER_R }; // (320, 1484)
const CR = { x: XR - CORNER_R, y: LANE_Y - CORNER_R }; // (760, 1484)
const SEGS: Seg[] = [
  line(TILE_BOX.x + HIDE, LANE_Y, CL.x, LANE_Y), // out from under the tile (hidden start)
  arc(CL.x, CL.y, CORNER_R, 90, 180), // bottom-left corner, turning up
  line(XL, CL.y, XL, TOP_C.y), // the left leg, up
  arc(TOP_C.x, TOP_C.y, TOP_R, 180, 360), // over the top, left to right
  line(XR, TOP_C.y, XR, CR.y), // the right leg, down
  arc(CR.x, CR.y, CORNER_R, 0, 90), // bottom-right corner, turning in
  line(CR.x, LANE_Y, TILE_BOX.x + TILE_BOX.w - HIDE, LANE_Y), // back under the tile (hidden end)
];
const SEG_S0: number[] = (() => {
  const out: number[] = [];
  let s = 0;
  for (const g of SEGS) {
    out.push(s);
    s += g.len;
  }
  return out;
})();
/** The lap's length along the centreline (world px). */
export const LOOP_LEN = SEG_S0[SEGS.length - 1] + SEGS[SEGS.length - 1].len;
/** Arc-length marks along the lap. */
export const S_AT = {
  /** the left leg starts / ends */
  leftLeg0: SEG_S0[2],
  leftLeg1: SEG_S0[3],
  /** the top of the loop */
  top: SEG_S0[3] + SEGS[3].len / 2,
  rightLeg0: SEG_S0[4],
  rightLeg1: SEG_S0[5],
  /** the chip's leading edge first touches the tile's right edge (centre 1 r outside it; on the corner's last few px) */
  contact: SEG_S0[6] - (TILE_BOX.x + TILE_BOX.w + CHIP_R - CR.x),
  /** the chip is wholly under the tile: it is home (the stack's push starts) */
  home: SEG_S0[6] + (CR.x - (TILE_BOX.x + TILE_BOX.w - CHIP_R)),
  /** the chip's trailing edge clears the tile's left edge on the way out */
  out: SEG_S0[0] + (TILE_BOX.x + HIDE - (TILE_BOX.x - CHIP_R)),
} as const;
/** Where the chip turns cream -> amber (the result is in): over the right leg. */
export const AMBER_S: [number, number] = [S_AT.rightLeg0 + 120, S_AT.rightLeg1 - 160];

export type TrackPt = { x: number; y: number; tx: number; ty: number };
/** The centreline point and unit tangent at arc length s (clamped to the lap). */
export const trackAt = (sIn: number): TrackPt => {
  const s = Math.max(0, Math.min(LOOP_LEN, sIn));
  let i = SEGS.length - 1;
  while (i > 0 && SEG_S0[i] > s) i--;
  const g = SEGS[i];
  const u = g.len > 0 ? (s - SEG_S0[i]) / g.len : 0;
  if (g.kind === "line") {
    const tx = (g.x1 - g.x0) / g.len;
    const ty = (g.y1 - g.y0) / g.len;
    return { x: lerp(g.x0, g.x1, u), y: lerp(g.y0, g.y1, u), tx, ty };
  }
  const a = lerp(g.a0, g.a1, u);
  const dir = Math.sign(g.a1 - g.a0);
  return { x: g.cx + g.r * Math.cos(a), y: g.cy + g.r * Math.sin(a), tx: -Math.sin(a) * dir, ty: Math.cos(a) * dir };
};
/** A lane's point at arc length s: `off` along the inside normal (+ = toward the loop's inside). */
export const lanePoint = (s: number, off = 0) => {
  const p = trackAt(s);
  return { x: p.x - p.ty * off, y: p.y + p.tx * off, tx: p.tx, ty: p.ty };
};
/** The centreline as an SVG path (s0..s1), sampled every `step` px. */
export const trackPath = (s0 = 0, s1 = LOOP_LEN, step = 6) => {
  const n = Math.max(2, Math.ceil((s1 - s0) / step));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const p = trackAt(lerp(s0, s1, i / n));
    d += `${i ? "L" : "M"}${f3(p.x)} ${f3(p.y)}`;
  }
  return d;
};

/** A path parallel to the centreline, `off` along the inside normal (the groove's edges). */
export const laneTrackPath = (off: number, s0 = 0, s1 = LOOP_LEN, step = 5) => {
  const n = Math.max(2, Math.ceil((s1 - s0) / step));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const p = lanePoint(lerp(s0, s1, i / n), off);
    d += `${i ? "L" : "M"}${f3(p.x)} ${f3(p.y)}`;
  }
  return d;
};

// ===========================================================================
// THE CHIP CLOCK — every state derived from emission frames and the lap time
// ===========================================================================
/** Frames a push of the stack takes (one arrival -> one unit). */
export const PUSH_F = 4;
export type ChipState = { s: number; x: number; y: number; lane: number; amber: number; onTrack: boolean };
/** A chip emitted (at s 0, hidden under the tile) on frame `emit`, lapping in `lapF` frames, in lane `lane`
 *  (+1 inside, -1 outside, 0 centreline), at frame f. `amberS` = where it turns amber (arc lengths). */
export const chipAt = (f: number, emit: number, lapF: number, lane = 0, amberS: [number, number] = AMBER_S): ChipState => {
  const s = ((f - emit) * LOOP_LEN) / lapF;
  const p = lanePoint(s, lane * LANE_OFF);
  const amber = smoothstep((s - amberS[0]) / (amberS[1] - amberS[0]));
  return { s, x: p.x, y: p.y, lane, amber, onTrack: s >= 0 && s <= LOOP_LEN };
};
/** The frame a chip emitted on `emit` is home (wholly under the tile; its push starts). */
export const arrivalOf = (emit: number, lapF: number) => emit + (S_AT.home * lapF) / LOOP_LEN;
/** The frame its leading edge first touches the tile's right edge. */
export const contactOf = (emit: number, lapF: number) => emit + (S_AT.contact * lapF) / LOOP_LEN;
/** The stack's height in units at frame f: `base` + one eased unit per arrival (each arrival's `units`). */
export const stackCount = (f: number, arrivals: readonly number[], base = 0, units = 1, pushF = PUSH_F) =>
  base + arrivals.reduce((a, t) => a + units * smoothstep((f - t) / pushF), 0);
/** A dense stream of PAIRS (both lanes abreast): emission frames t0, t0 + every, ... (n pairs). */
export const pairStream = (t0: number, every: number, n: number) => Array.from({ length: n }, (_, i) => t0 + i * every);

// ===========================================================================
// THE CAMERA HELPER
// ===========================================================================
/** A camera at zoom k that puts world point (wx, wy) on screen point (sx, sy) (default: the tile's top
 *  centre). E pulls back from the tile with that point anchored near y 1470 -> 1500. */
export const camAnchored = (k: number, sy: number, sx = 540, wx: number = STACK_X, wy: number = TILE_BOX.y): Cam => ({
  x: wx - (sx - 540) / k,
  y: wy - (sy - 960) / k,
  k,
});

// ===========================================================================
// SHADOW LAYERS (the stout recipe at any scale)
// ===========================================================================
const NEXT: Record<Elevation, Elevation> = { rest: "lifted", lifted: "float", float: "float" };
const layersOf = (elevation: Elevation, lift: number): ShadowLayer[] => {
  const A = ELEVATION[elevation];
  const B = ELEVATION[NEXT[elevation]];
  const t = clamp01(lift);
  const mix = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({ dx: lerp(a.dx, b.dx, t), dy: lerp(a.dy, b.dy, t), blur: lerp(a.blur, b.blur, t), a: lerp(a.a, b.a, t) });
  return [mix(A.amb, B.amb), mix(A.key, B.key)];
};
/** The scale of the stout shadow recipe for the tile + stack (the recipe is for 96-px tiles). */
export const TILE_SHADOW_S = 1.6;
/** ... and for a chip in flight. */
export const CHIP_SHADOW_S = 0.7;

// ===========================================================================
// THE TRACK
// ===========================================================================
/** Chevron positions along the lap (arc length) on the centreline (WORLD REV 2): evenly spaced (~261 px) from
 *  the foot of the left leg, over the top (the middle one sits at the top, pointing right), to the foot of
 *  the right leg. Static, part of the track; chips pass over them. */
export const CHEVRON_N = 11;
export const CHEVRON_S: number[] = Array.from({ length: CHEVRON_N }, (_, i) => lerp(S_AT.leftLeg0, S_AT.rightLeg1, (i + 0.5) / CHEVRON_N));
/** A chevron's size (world px): half-width across the track, depth along it, stroke; its tone. */
export const CHEVRON = { half: 32, depth: 26, stroke: 13, opacity: 0.6 } as const;
/**
 * LoopTrack — the groove cut into the board (a deeper brown band, a faint lit lip on its lower edge),
 * and the chevrons. `tone` 0..1 dims the whole track toward the ground (F may quiet it).
 */
export const LoopTrack: React.FC<{ k: number; tone?: number; chevrons?: boolean }> = ({ k, tone = 1, chevrons = true }) => {
  const d = trackPath(0, LOOP_LEN, 5);
  const ch = CHEVRON.half;
  const cl = CHEVRON.depth;
  return (
    <g opacity={f3(tone)}>
      {/* the groove's body: a deeper brown over the board's own fibres */}
      <path d={d} fill="none" stroke={COLOR.shadow} strokeOpacity={0.26} strokeWidth={GROOVE_W} strokeLinecap="butt" strokeLinejoin="round" />
      {/* its two cut edges: a shadow hairline, and a faint lit lip just inside it */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={laneTrackPath(side * (GROOVE_W / 2 - 1 / k))} fill="none" stroke={COLOR.shadow} strokeOpacity={0.42} strokeWidth={f3(2 / k)} />
          <path d={laneTrackPath(side * (GROOVE_W / 2 - 3 / k))} fill="none" stroke={COLOR.board} strokeOpacity={0.12} strokeWidth={f3(STROKE.HAIRLINE / k)} />
        </g>
      ))}
      {chevrons
        ? CHEVRON_S.map((s, i) => {
            const p = trackAt(s);
            const nx = -p.ty;
            const ny = p.tx;
            const tip = { x: p.x + p.tx * cl * 0.5, y: p.y + p.ty * cl * 0.5 };
            const a = { x: p.x - p.tx * cl * 0.5 + nx * ch, y: p.y - p.ty * cl * 0.5 + ny * ch };
            const b = { x: p.x - p.tx * cl * 0.5 - nx * ch, y: p.y - p.ty * cl * 0.5 - ny * ch };
            return (
              <path
                key={i}
                d={`M${f3(a.x)} ${f3(a.y)}L${f3(tip.x)} ${f3(tip.y)}L${f3(b.x)} ${f3(b.y)}`}
                fill="none"
                stroke={COLOR.board}
                strokeOpacity={CHEVRON.opacity}
                strokeWidth={CHEVRON.stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })
        : null}
    </g>
  );
};

// ===========================================================================
// THE CHIPS
// ===========================================================================
export type ChipDraw = { x: number; y: number; amber: number; r?: number; dim?: number };
/** The amber body colour at world y (one band per frame, like PersonPeg's amberAt). */
const amberAt = (y: number, band: [number, number]) => mixHex(COLOR.amberTop, COLOR.amberFoot, (y - band[0]) / Math.max(1e-6, band[1] - band[0]));
/** One shadow layer for every chip in flight (lifted: they travel). Draw it BEFORE the chips. */
export const ChipShadows: React.FC<{ chips: ChipDraw[]; elevation?: Elevation; lift?: number; s?: number }> = ({ chips, elevation = "lifted", lift = 0, s = CHIP_SHADOW_S }) => {
  if (!chips.length) return null;
  const layers = layersOf(elevation, lift);
  const body = chips.map((c, i) => <circle key={i} cx={f3(c.x)} cy={f3(c.y)} r={f3(c.r ?? CHIP_R)} />);
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      {layers.map((l, i) => (
        <g key={i} opacity={f3(l.a)} transform={`translate(${fx(l.dx * s)} ${fx(l.dy * s)})`} style={{ filter: `blur(${f3(l.blur * s)}px)` }}>
          {body}
        </g>
      ))}
    </g>
  );
};
/** The fixed amber bloom under the chips that carry amber (its strength = the chip's amber). */
export const ChipGlow: React.FC<{ chips: ChipDraw[]; k: number }> = ({ chips, k }) => {
  const lit = chips.filter((c) => c.amber > 0.01);
  if (!lit.length) return null;
  return (
    <g style={{ filter: bloomFilter(k) }}>
      {lit.map((c, i) => (
        <circle key={i} cx={f3(c.x)} cy={f3(c.y)} r={f3((c.r ?? CHIP_R) - 0.5)} fill={COLOR.amberTop} fillOpacity={f3(c.amber)} />
      ))}
    </g>
  );
};
const NOTCHES = 8;
/**
 * Chip — one bet: a poker chip seen from above. A card disc (cream; amber when the result is in), eight
 * notches cut in its rim and a fine inner ring (so it reads as a chip, not a pebble), the lit edge on its
 * upper rim (cream edge / amber hot edge). No shadow (ChipShadows), no glow (ChipGlow). `dim` 0..1 turns a
 * cream chip toward board (context).
 */
export const Chip: React.FC<ChipDraw & { k: number; band: [number, number] }> = ({ x, y, amber, r = CHIP_R, dim = 0, k, band }) => {
  const b = clamp01(amber);
  const creamTop = mixHex(COLOR.cream, COLOR.board, dim);
  const creamFoot = mixHex(COLOR.creamFoot, COLOR.boardFoot, dim);
  const body = mixHex(mixHex(creamTop, creamFoot, 0.45), amberAt(y, band), b);
  const notch = mixHex(mixHex(COLOR.boardFoot, COLOR.inkDark, 0.22), COLOR.rung, b);
  const rim = mixHex(COLOR.edge, COLOR.amberHot, b);
  const e = lerp(EDGE.CREAM, EDGE.HOT, b) / k;
  const nw = 0.34 * r; // notch: tangential width
  const nh = 0.32 * r; // radial depth, from the rim in
  const notches = Array.from({ length: NOTCHES }, (_, i) => {
    const a = ((i + 0.5) / NOTCHES) * 2 * Math.PI;
    const c = Math.cos(a);
    const s = Math.sin(a);
    // a rect from the rim inward, centred on the radius at angle a
    const r0 = r - nh;
    const r1 = r + 0.5;
    const pts = [
      [r0, -nw / 2],
      [r1, -nw / 2],
      [r1, nw / 2],
      [r0, nw / 2],
    ].map(([u, v]) => `${f3(x + u * c - v * s)} ${f3(y + u * s + v * c)}`);
    return `M${pts.join("L")}Z`;
  }).join("");
  // the lit edge: the upper rim arc (200..340 deg), inside the disc
  const ra = r - e / 2;
  const a0 = (200 * Math.PI) / 180;
  const a1 = (340 * Math.PI) / 180;
  const edge = `M${f3(x + ra * Math.cos(a0))} ${f3(y + ra * Math.sin(a0))}A${f3(ra)} ${f3(ra)} 0 0 1 ${f3(x + ra * Math.cos(a1))} ${f3(y + ra * Math.sin(a1))}`;
  return (
    <g>
      <circle cx={f3(x)} cy={f3(y)} r={f3(r)} fill={body} />
      <path d={notches} fill={notch} />
      <circle cx={f3(x)} cy={f3(y)} r={f3(r * 0.56)} fill="none" stroke={notch} strokeOpacity={0.75} strokeWidth={f3(Math.max(1.6 / k, r * 0.05))} />
      <path d={edge} fill="none" stroke={rim} strokeOpacity={lerp(ALPHA.edge, 0.9, b)} strokeWidth={f3(e)} strokeLinecap="round" />
    </g>
  );
};
/** Every chip of a frame: their one shadow, the glow, then the bodies (in the order given). */
export const Chips: React.FC<{ chips: ChipDraw[]; k: number; band: [number, number] }> = ({ chips, k, band }) => (
  <g>
    <ChipShadows chips={chips} />
    <ChipGlow chips={chips} k={k} />
    {chips.map((c, i) => (
      <Chip key={i} {...c} k={k} band={band} />
    ))}
  </g>
);

// ===========================================================================
// THE COMPANY TILE + THE STACKS (one object, one shadow)
// ===========================================================================
/** The top (world y) of a stack holding `n` chips. */
export const stackTopOf = (n: number) => TILE_BOX.y - Math.max(0, n) * UNIT;
/** The stacks' top for `count` chips in all, split evenly over the two stacks (the old one-tower API). */
export const stackTop = (count: number) => stackTopOf(count / 2);
type Counts = readonly [number, number];
const countsOf = (count: number, counts?: Counts): Counts => counts ?? [count / 2, count / 2];
/** The union shadow of the tile and its two stacks. `count` = chips in all (split evenly), or `counts` =
 *  [left, right]. Draw it FIRST (before the chips: they ride over it and go under the tile). */
export const CompanyShadow: React.FC<{ count?: number; counts?: Counts; strength?: number }> = ({ count = 0, counts, strength = 1 }) => {
  const s = TILE_SHADOW_S;
  const layers = layersOf("rest", 0);
  const cs = countsOf(count, counts);
  const parts = [rectPath(TILE_BOX.x, TILE_BOX.y, TILE_BOX.w, TILE_BOX.h, TILE_R)];
  cs.forEach((n, j) => {
    if (n <= 0.01) return;
    const top = stackTopOf(n);
    parts.push(rectPath(STACK_XS[j] - STACK_CHIP_W / 2, top, STACK_CHIP_W, TILE_BOX.y - top + 4, 5, true, false));
  });
  const c = ELEVATION.rest.contact;
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      {c ? (
        <ellipse
          cx={f3(TILE_BOX.x + TILE_BOX.w / 2 + c.dx * s)}
          cy={f3(TILE_BOX.y + TILE_BOX.h)}
          rx={f3(TILE_BOX.w * 0.52)}
          ry={f3(3 * s)}
          opacity={f3(c.a * strength)}
          style={{ filter: `blur(${f3(c.blur * s)}px)` }}
        />
      ) : null}
      {layers.map((l, i) => (
        <g key={i} opacity={f3(l.a * strength)} transform={`translate(${fx(l.dx * s)} ${fx(l.dy * s)})`} style={{ filter: `blur(${f3(l.blur * s)}px)` }}>
          {parts.map((d, j) => (
            <path key={j} d={d} />
          ))}
        </g>
      ))}
    </g>
  );
};

/** A generic company (a bank building: pediment, four columns, a base) for F, at the R's ink weight. Lucide
 *  "landmark" grammar in a 24 box, the pediment filled. */
const BuildingMark: React.FC<{ cx: number; cy: number; h: number }> = ({ cx, cy, h }) => {
  const sc = h / 20; // the glyph's ink box is 20 units tall (y 2..22)
  const ox = cx - 12 * sc;
  const oy = cy - 12 * sc;
  const sw = 2.9; // ~ the R's stem weight (5.9 of its 31.7 height) in 24-box units at this size
  return (
    <g transform={`translate(${fx(ox)} ${fx(oy)}) scale(${fx(sc)})`} fill={COLOR.inkDark} stroke={COLOR.inkDark} strokeWidth={sw} strokeLinecap="square" strokeLinejoin="miter">
      <path d="M12 2.2 L21 8 H3 Z" strokeLinejoin="round" />
      <path d="M2.5 21.5 H21.5" fill="none" />
      <path d="M5.5 18 V11 M10 18 V11 M14 18 V11 M18.5 18 V11" fill="none" />
    </g>
  );
};

/** The slot in the tile's top edge (world px, at camera k): both stacks + a lip each side. */
export const slotWidth = (k: number) => STACK_W + (2 * EDGE.SLOT_LIP) / k;

/** A generic company for F (WORLD REV 2): a plain multi-storey office block (Lucide "building-2" grammar: a
 *  tall block with a grid of windows, a lower wing each side) at the R's ink weight. Reads as "a company". */
const OfficeMark: React.FC<{ cx: number; cy: number; h: number }> = ({ cx, cy, h }) => {
  const sc = h / 20; // ink box y 2..22
  const ox = cx - 12 * sc;
  const oy = cy - 12 * sc;
  const sw = 2.6;
  return (
    <g transform={`translate(${fx(ox)} ${fx(oy)}) scale(${fx(sc)})`} fill="none" stroke={COLOR.inkDark} strokeWidth={sw} strokeLinecap="butt" strokeLinejoin="round">
      <path d="M7 22 V4 a2 2 0 0 1 2 -2 h6 a2 2 0 0 1 2 2 V22 Z" />
      <path d="M7 12 H4.5 a1.5 1.5 0 0 0 -1.5 1.5 V22 H7" />
      <path d="M17 9 H19.5 a1.5 1.5 0 0 1 1.5 1.5 V22 H17" />
      <path d="M2 22 H22" />
      <g fill={COLOR.inkDark} stroke="none">
        {[5.6, 9.6, 13.6, 17.6].map((y) => (
          <React.Fragment key={y}>
            <rect x={9.7} y={y - 0.9} width={1.6} height={1.8} />
            <rect x={12.7} y={y - 0.9} width={1.6} height={1.8} />
          </React.Fragment>
        ))}
      </g>
    </g>
  );
};
export type CompanyMark = "revolut" | "building" | "office" | "none";

/** The manager's tone (WORLD REV 2): ink-brown card, the R stamp's ink family, so it separates from the cream
 *  tile as clearly as the R. `shade` 0..1 lifts it toward a warm mid-brown (a second, different person). */
const managerTone = (shade: number) => {
  const top = mixHex(mixHex(COLOR.inkDark, COLOR.boardFoot, 0.16), COLOR.boardFoot, 0.5 * clamp01(shade));
  const foot = mixHex(COLOR.inkDark, COLOR.boardFoot, 0.5 * clamp01(shade));
  return { top, foot, rim: mixHex(top, COLOR.board, 0.55) };
};
/**
 * ManagerPeg — the world's own person peg in ink-brown (talentShared's PersonPeg only does kraft / amber):
 * the same silhouette (pegPath), the same slot and sink behaviour (cut at its slot line, `sink` 1 = gone),
 * the same shadow (PegShadows) and slot (PegSlot on cream). A lit rim on its top edges (the body drawn again
 * one rim lower, inside the silhouette).
 */
export const ManagerPeg: React.FC<{ x: number; y: number; size: number; k: number; sink?: number; shade?: number; slot?: boolean }> = ({ x, y, size, k, sink = SEAT, shade = 0, slot = true }) => {
  const uid = uidOf(useId());
  const s = clamp01(sink);
  const feet = y + sinkDepth(s, size);
  const t = managerTone(shade);
  const e = Math.max(EDGE.CREAM / k, 1.6);
  const top = feet - size;
  if (s >= 0.995) return slot ? <PegSlot x={x} y={y} size={size} k={k} on="cream" /> : null;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(feet)}>
          <stop offset="0" stopColor={t.top} />
          <stop offset="1" stopColor={t.foot} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect x={f3(x - size)} y={f3(y - 2 * size)} width={f3(2 * size)} height={f3(2 * size)} />
        </clipPath>
        <clipPath id={`${uid}s`}>
          <path d={pegPath(x, feet, size)} />
        </clipPath>
      </defs>
      <PegShadows pegs={[{ x, y, size, sink: s }]} />
      <g clipPath={`url(#${uid}c)`}>
        <path d={pegPath(x, feet, size)} fill={t.rim} />
        <g clipPath={`url(#${uid}s)`}>
          <path d={pegPath(x, feet + e, size)} fill={`url(#${uid}b)`} />
        </g>
      </g>
      {slot ? <PegSlot x={x} y={y} size={size} k={k} on="cream" /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE MANAGER GLYPH (WORLD REV 3): the manager as a flat outline person glyph in the office mark's grammar
// (Lucide "user": a head circle over a rounded shoulder block), drawn in the SAME 24-unit box, at the SAME
// scale (MARK_H / 20 per unit) and the SAME stroke (2.6 units, butt caps, round joins, fill none, COLOR.inkDark)
// as OfficeMark, so the two icons on the tile are one set. No shading, no rim, no shadow. It stands on the
// mark's baseline, mirrored about the tile's centre (GLYPH_AT), in a slot line in the card at its feet: a
// `sink` lowers it straight down behind that line (clipped there: it goes into the card, never fades).
// `who` "first" = the manager; "second" = a visibly different person (a bob of hair framing a smaller face,
// narrower shoulders), the same grammar and weight.
// ---------------------------------------------------------------------------
/** Glyph units -> world px (the office mark's scale: its 20-unit ink box is MARK_H tall). */
export const GLYPH_SC = MARK_H / 20;
/** The office mark's stroke, in glyph units (OfficeMark sw). */
export const GLYPH_SW = 2.6;
/** The manager glyph: centre x (mirrors MARK_BOX.cx about the tile's centre), its feet = the slot line (the
 *  mark's baseline: the R's foot and the office mark's ground line), its 24-box scale. */
export const GLYPH_AT = {
  x: TILE_BOX.x + TILE_BOX.w - (MARK_BOX.cx - TILE_BOX.x),
  y: MARK_BOX.cy + 10 * GLYPH_SC,
  sc: GLYPH_SC,
} as const;
/** The glyph's foot in box units (the slot line) and its ink top (incl. half the stroke). */
const G_FOOT = 22;
const G_TOP = 1.2;
export type ManagerWho = "first" | "second";
/** The two people in 24-box units (foot at y 22, centre x 12). Strokes only, fill none. */
const PERSON: Record<ManagerWho, { head: { cx: number; cy: number; r: number }; d: string[]; slotHalf: number }> = {
  // Lucide "user", heavier: head r 4.4 at (12, 7); shoulders a rounded block x 4.3..19.7 from y 15.6 down into the slot
  first: {
    head: { cx: 12, cy: 6.9, r: 4.4 },
    d: ["M4.3 22 V20.1 a4.5 4.5 0 0 1 4.5 -4.5 h6.4 a4.5 4.5 0 0 1 4.5 4.5 V22"],
    slotHalf: 7.7,
  },
  // a different person: a smaller face inside a bob (a dome over the crown, straight sides falling to the jaw),
  // narrower, rounder shoulders
  second: {
    head: { cx: 12, cy: 8.5, r: 3.9 },
    d: ["M5.7 13.6 V8.5 a6.3 6.3 0 0 1 12.6 0 V13.6", "M5.9 22 V20.4 a3.8 3.8 0 0 1 3.8 -3.8 h4.6 a3.8 3.8 0 0 1 3.8 3.8 V22"],
    slotHalf: 7.7,
  },
};
/**
 * ManagerGlyph — the manager in the office mark's ink grammar. (x, y) = its feet on the slot line (GLYPH_AT);
 * `sink` SEAT..1 lowers it straight down behind the slot line (SEAT = standing, 1 = gone); `slot` draws the
 * slot line (the card's joint, as PegSlot on cream) over its feet. CompanyTile draws the slot only when a manager moves (sink > SEAT):
 * a manager who never moves (cut E) is a plain ink stamp like the R, no line under it.
 */
export const ManagerGlyph: React.FC<{ x?: number; y?: number; sc?: number; k: number; sink?: number; who?: ManagerWho; slot?: boolean; ground?: boolean }> = ({
  x = GLYPH_AT.x,
  y = GLYPH_AT.y,
  sc = GLYPH_AT.sc,
  k,
  sink = SEAT,
  who = "first",
  slot = true,
  ground = false,
}) => {
  const uid = uidOf(useId());
  const p = PERSON[who];
  const cut = ground ? y - (GLYPH_SW / 2) * sc : y; // the glyph goes behind the ground line's top edge
  const s = clamp01((clamp01(sink) - SEAT) / (1 - SEAT));
  const depth = s * (G_FOOT - G_TOP + 0.4) * sc;
  const ox = x - 12 * sc;
  const oy = y - G_FOOT * sc + depth;
  const slotW = 2 * PERSON.first.slotHalf * sc + GLYPH_SW * sc + (2 * EDGE.SLOT_LIP) / k;
  return (
    <g>
      {s < 0.999 ? (
        <>
          <defs>
            <clipPath id={`${uid}c`}>
              <rect x={f3(x - 20 * sc)} y={f3(cut - 40 * sc)} width={f3(40 * sc)} height={f3(40 * sc)} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}c)`}>
            <g transform={`translate(${fx(ox)} ${fx(oy)}) scale(${fx(sc)})`} fill="none" stroke={COLOR.inkDark} strokeWidth={GLYPH_SW} strokeLinecap="butt" strokeLinejoin="round">
              <circle cx={p.head.cx} cy={p.head.cy} r={p.head.r} />
              {p.d.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </g>
        </>
      ) : null}
      {slot && ground ? (
        <path d={`M${f3(x - (PERSON.first.slotHalf + GLYPH_SW / 2) * sc)} ${f3(y)}H${f3(x + (PERSON.first.slotHalf + GLYPH_SW / 2) * sc)}`} stroke={COLOR.inkDark} strokeWidth={f3(GLYPH_SW * sc)} strokeLinecap="butt" />
      ) : slot ? (
        <rect x={f3(x - slotW / 2)} y={f3(y - EDGE.SLOT / k / 2)} width={f3(slotW)} height={f3(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
      ) : null}
    </g>
  );
};

export type Manager = { sink?: number; shade?: number; who?: ManagerWho };
/**
 * CompanyTile — the company card (body only; its shadow is CompanyShadow): cream lit from above, its lit top
 * edge stopping at the stacks' slot (STACK_W 126 + lips, centred on x 540), the mark in ink on the left half
 * (`mark` "revolut" = the real R; or "building", the generic company of cut F), and the manager peg(s)
 * standing in the one peg slot on the right half (`managers`: each { sink 0..1, shade 0..1 }, drawn in
 * order, so F can sink one and raise another). `dim` 0..1 turns the card toward board. With `slot` and no
 * stack, the empty slot shows as a dark pocket across the top edge.
 */
export const CompanyTile: React.FC<{ k: number; mark?: CompanyMark; managers?: Manager[]; dim?: number; slot?: boolean; band: [number, number] }> = ({
  k,
  mark = "revolut",
  managers = [{ sink: SEAT }],
  dim = 0,
  slot = true,
  band,
}) => {
  const uid = uidOf(useId());
  const { x, y, w, h } = TILE_BOX;
  const loEdge = lerp(ALPHA.edge, ALPHA.edgeBoard, dim);
  const ey = y + EDGE.CREAM / k / 2;
  const slotW = slotWidth(k);
  const s0 = STACK_X - slotW / 2;
  const s1 = STACK_X + slotW / 2;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y)} x2="0" y2={f3(y + h)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dim)} />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, h, TILE_R)} fill={`url(#${uid}c)`} />
      <path
        d={slot ? `M${f3(x + TILE_R)} ${f3(ey)}H${f3(s0)}M${f3(s1)} ${f3(ey)}H${f3(x + w - TILE_R)}` : `M${f3(x + TILE_R)} ${f3(ey)}H${f3(x + w - TILE_R)}`}
        stroke={COLOR.edge}
        strokeOpacity={loEdge}
        strokeWidth={f3(EDGE.CREAM / k)}
      />
      {slot ? <rect x={f3(s0)} y={f3(y)} width={f3(slotW)} height={f3(Math.max(EDGE.SLOT / k, 5))} rx={f3(Math.min(2.5, 2 / k))} fill={COLOR.inkDark} fillOpacity={0.72} /> : null}
      {mark === "revolut" ? (
        <path d={REVOLUT_R_D} fillRule="evenodd" fill={COLOR.inkDark} transform={`translate(${fx(MARK_BOX.x)} ${fx(MARK_BOX.y)}) scale(${fx(MARK_BOX.sc)})`} />
      ) : mark === "building" ? (
        <BuildingMark cx={MARK_BOX.cx} cy={MARK_BOX.cy} h={MARK_H * 0.96} />
      ) : mark === "office" ? (
        <OfficeMark cx={MARK_BOX.cx} cy={MARK_BOX.cy} h={MARK_H} />
      ) : null}
      {managers.map((m, i) => (
        <ManagerGlyph key={i} k={k} sink={m.sink ?? SEAT} who={m.who ?? (m.shade ? "second" : "first")} slot={i === managers.length - 1 && managers.some((q) => (q.sink ?? SEAT) > SEAT)} />
      ))}
    </g>
  );
};

/** Rim inserts per chip (the lighter edge spots that face us) and their period across the chip. */
const INSERTS = 3;
/**
 * ChipStack — the chips that have come home: TWO stacks of poker chips seen edge-on, side by side, rising out
 * of the slot in the tile's top edge (body only; the shadow is CompanyShadow's). `counts` = [left, right]
 * chips (fractional while a chip is being pushed out), or `count` = chips in all, split evenly. Chip i of a
 * stack = its i-th oldest, counted from the top, so every chip keeps its rim inserts as it rises. Each chip:
 * a rounded card unit UNIT tall, a deep seam to the next, three lighter rim inserts (offset chip to chip,
 * narrowed toward the sides as on a cylinder), a soft side shading; the top chip carries the 2 px hot edge.
 * `amber` 0..1 (cream card .. amber, with the fixed bloom). Draw it AFTER CompanyTile.
 */
export const ChipStack: React.FC<{ count?: number; counts?: Counts; k: number; band: [number, number]; amber?: number; seed?: string }> = ({
  count = 0,
  counts,
  k,
  band,
  amber = 1,
  seed = "betstack",
}) => {
  const uid = uidOf(useId());
  const cs = countsOf(count, counts);
  if (cs[0] <= 0.001 && cs[1] <= 0.001) return null;
  const b = clamp01(amber);
  const base = TILE_BOX.y;
  const W = STACK_CHIP_W;
  const R = 5; // a chip's corner (its rounded rim, seen edge-on)
  const seamCol = mixHex(COLOR.boardFoot, COLOR.rung, b);
  const insertCol = mixHex(COLOR.cream, COLOR.amberHot, b);
  const fillTop = mixHex(COLOR.cream, COLOR.amberTop, b);
  const fillFoot = mixHex(COLOR.creamFoot, COLOR.amberFoot, b);
  const bodies: string[] = [];
  const seams: string[] = [];
  const inserts: string[] = [];
  const tops: { x0: number; top: number }[] = [];
  const per = W / INSERTS;
  const seamW = Math.max(2.4 / k, 2.2);
  cs.forEach((nIn, j) => {
    const n = Math.max(0, nIn);
    if (n <= 0.001) return;
    const x0 = STACK_XS[j] - W / 2;
    const top = stackTopOf(n);
    tops.push({ x0, top });
    for (let i = 0; i < Math.ceil(n); i++) {
      const yt = top + i * UNIT;
      if (yt >= base) break;
      bodies.push(rectPath(x0, yt, W, UNIT, R));
      if (i > 0) seams.push(`M${f3(x0 + 1)} ${f3(yt)}H${f3(x0 + W - 1)}`);
      // the inserts: three per chip, every other chip offset by half a period, plus a little jitter
      const ph = ((i % 2) * 0.5 + 0.16 * (random(`${seed}-${j}-${i}`) - 0.5) + 0.25) * per;
      const ih = UNIT * 0.46;
      const iy = yt + (UNIT - ih) / 2;
      for (let q = -1; q <= INSERTS; q++) {
        const cx = x0 + ph + q * per;
        const u = (cx - (x0 + W / 2)) / (W / 2);
        if (Math.abs(u) >= 0.92) continue;
        const iw = 8.5 * Math.sqrt(1 - u * u); // foreshortened toward the sides
        if (iw < 2) continue;
        inserts.push(`M${f3(cx - iw / 2)} ${f3(iy)}H${f3(cx + iw / 2)}V${f3(iy + ih)}H${f3(cx - iw / 2)}Z`);
      }
    }
  });
  const fall = EDGE.HOT_FALL / k;
  const ao = EDGE.FOOT_AO / k;
  const slotW = slotWidth(k);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
          <stop offset="0" stopColor={fillTop} />
          <stop offset="1" stopColor={fillFoot} />
        </linearGradient>
        {/* the cylinder: lit from the left, the far side a touch deeper */}
        {tops.map((t, j) => (
          <linearGradient key={j} id={`${uid}s${j}`} gradientUnits="userSpaceOnUse" x1={f3(t.x0)} y1="0" x2={f3(t.x0 + W)} y2="0">
            <stop offset="0" stopColor={COLOR.shadow} stopOpacity={0.12} />
            <stop offset="0.3" stopColor={COLOR.shadow} stopOpacity={0} />
            <stop offset="0.7" stopColor={COLOR.shadow} stopOpacity={0.06} />
            <stop offset="1" stopColor={COLOR.shadow} stopOpacity={0.26} />
          </linearGradient>
        ))}
        <linearGradient id={`${uid}o`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(base - ao)} x2="0" y2={f3(base)}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO * 1.6} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect x={f3(STACK_X - STACK_W)} y={f3(base - 4000)} width={f3(2 * STACK_W)} height={4000} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <g style={b > 0.01 ? { filter: bloomFilter(k) } : undefined}>
          <path d={bodies.join("")} fill={`url(#${uid}a)`} />
        </g>
        {tops.map((t, j) => (
          <path key={j} d={rectPath(t.x0, t.top, W, base - t.top, R, true, false)} fill={`url(#${uid}s${j})`} />
        ))}
        <path d={inserts.join("")} fill={insertCol} fillOpacity={0.68} />
        <path d={seams.join("")} stroke={seamCol} strokeWidth={f3(seamW)} fill="none" />
        {tops.map((t, j) => (
          <g key={j}>
            <defs>
              <linearGradient id={`${uid}h${j}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(t.top)} x2="0" y2={f3(t.top + fall)}>
                <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall * b} />
                <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={rectPath(t.x0, t.top, W, Math.min(fall, UNIT), R, true, false)} fill={`url(#${uid}h${j})`} />
            <path d={`M${f3(t.x0 + R)} ${f3(t.top + EDGE.HOT / k / 2)}H${f3(t.x0 + W - R)}`} stroke={mixHex(COLOR.edge, COLOR.amberHot, b)} strokeWidth={f3(EDGE.HOT / k)} />
            <rect x={f3(t.x0)} y={f3(base - ao)} width={f3(W)} height={f3(ao)} fill={`url(#${uid}o)`} />
          </g>
        ))}
      </g>
      <rect x={f3(STACK_X - slotW / 2)} y={f3(base - EDGE.SLOT / k / 2)} width={f3(slotW)} height={f3(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
    </g>
  );
};

// ===========================================================================
// THE WHOLE WORLD IN ONE CALL
// ===========================================================================
/**
 * BetLoopWorld — the loop in its draw order: the track, the tile+stacks shadow, the chips (shadow, glow,
 * bodies), the tile, the stacks. Pass the chips of the frame (world positions; chipAt() gives them) and the
 * stacks' `count` (chips in all, split evenly) or `counts` ([left, right]).
 */
export const BetLoopWorld: React.FC<{
  k: number;
  band: [number, number];
  chips: ChipDraw[];
  count?: number;
  counts?: Counts;
  mark?: CompanyMark;
  managers?: Manager[];
  stackAmber?: number;
  trackTone?: number;
}> = ({ k, band, chips, count = 0, counts, mark = "revolut", managers, stackAmber = 1, trackTone = 1 }) => (
  <g>
    <LoopTrack k={k} tone={trackTone} />
    <CompanyShadow count={count} counts={counts} />
    <Chips chips={chips} k={k} band={band} />
    <CompanyTile k={k} mark={mark} managers={managers} band={band} />
    <ChipStack count={count} counts={counts} k={k} band={band} amber={stackAmber} />
  </g>
);

// ===========================================================================
// THE PROBE STILL — "empty": the loop with no chips and no stack; "busy": E's stream at its last frame;
// "building": F's bank-building mark, one manager half sunk and a second (shaded) standing; "office": F's
// office-block mark (WORLD REV 2), one manager 40 % sunk
// ===========================================================================
export const PROBE_LAP = 31;
export const PROBE_EVERY = 3;
export const BetLoopProbe: React.FC<{ variant: "empty" | "busy" | "building" | "office" }> = ({ variant }) => {
  const cam = LOOP_CAM;
  const band = amberBandFor(cam);
  const f = 105;
  const emits = variant === "busy" ? pairStream(-47.7, PROBE_EVERY, 60) : [];
  const chips: ChipDraw[] = [];
  for (const t of emits) {
    for (const lane of [1, -1]) {
      const c = chipAt(f, t, PROBE_LAP, lane);
      if (c.onTrack) chips.push({ x: c.x, y: c.y, amber: c.amber });
    }
  }
  const count = variant === "busy" ? stackCount(f, emits.map((t) => arrivalOf(t, PROBE_LAP)), 0, 2) : 0;
  return (
    <StoutStage S={0} cam={cam} rest={cam} pool={{ x: 540, y: 1100 }} sway={false}>
      <BetLoopWorld
        k={cam.k}
        band={band}
        chips={chips}
        count={count}
        mark={variant === "building" ? "building" : variant === "office" ? "office" : "revolut"}
        managers={variant === "building" ? [{ sink: 0.55 }, { sink: SEAT, shade: 0.35 }] : variant === "office" ? [{ sink: 0.4 }] : undefined}
      />
    </StoutStage>
  );
};
