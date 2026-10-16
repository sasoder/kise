import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_LABEL,
  GEO,
  LightSweep,
  METRIC,
  StoutStage,
  TRACK,
  amberBandFor,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  type Silhouette,
} from "../kits/cheeky-pint/stoutShared";
import { Label, MetaMark, PEG, PegShadows, PegSlot, PersonPeg, SEAT, TeamTile, teamTileLayout } from "../kits/cheeky-pint/talentShared";

// ===========================================================================
// RecruitingFilter — cut 2 of the Cheeky Pint S4E03 (Meta) clip "Talent density beat team size", in the
// stout system (stoutShared.tsx) with the clip's vocabulary (talentShared.tsx). 1080x1920, 23.976, opaque.
//
// CHECK LINE: "MSL's small team was sieved out of two big pools, Meta's own people and people outside
// Meta, and only a handful got through from each."
//
// THE MOTION: the camera opens close on the empty eight-slot MSL tile between two thick cream walls,
// each with ONE gate a peg wide, and pulls back to the big kraft crowd beyond each (Meta's board above,
// everyone else below). A heavy cream bar crosses the upper crowd and presses it down into its slots, out
// of the light; only four stay standing and turn amber, lift and squeeze through the gate one at a time
// into the tile's top row. The same happens below, four file UP into the bottom row, and the tile ends
// as one tight amber pack (the one LightSweep on the last landing) with both pressed crowds at the edges.
//
// DURATION: slot = round(12.513 x 23.976) = 300 frames, + 12-frame living tail = 312.
// ===========================================================================

export const FPS = 24000 / 1001;
export const DURATION = 312;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `rf${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const sm5 = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// --- THE WORLD (world px; the tile's centre is the origin of y, x is centred on 540) ----------------
const CX = 540;
const P = PEG.S; // every peg: 72
const TILE = teamTileLayout({ x: CX, y: 0, cols: 4, rows: 2, peg: P }); // 344 x 200
// the filters: ONE thick wall across the frame (a top surface and a front face), ONE gate a peg wide
const WALL = { h: 84, face: 20, gate: P + 6, x0: -600, x1: 1680 } as const;
const WALL_U = -300; // top surface -300 .. -216, face to -196
const WALL_L = 216; // top surface 216 .. 300, face to 320
// the sieve of each pool: ONE heavy cream bar that comes in off the frame's left edge, crosses the whole
// crowd pressing it down, and leaves off the right edge (it never parks)
const SIEVE_W = 48;
type SieveSpec = { y0: number; y1: number; f0: number; v: number };
const SIEVE_U: SieveSpec = { y0: -1138, y1: -470, f0: 40, v: 13.2 };
const SIEVE_L: SieveSpec = { y0: 470, y1: 1102, f0: 186, v: 1200 / 38 };
/** The bar's leading (right) edge, world x. */
const sieveLead = (s: SieveSpec, f: number) => -60 + s.v * Math.max(0, f - s.f0);
/** 0..1 as the bar passes over a peg at x: 0 on the frame its edge reaches the peg, 1 once it has left it. */
const pressOf = (s: SieveSpec, f: number, x: number) => clamp01((sieveLead(s, f) - (x - P / 2)) / (P + SIEVE_W));
// the identity tile of each pool, on its apron beside the file's lane (never under the sieve)
const TAG = { x0: 262, w: 228, h: 102 } as const;
const MARK_Y = -362 - TAG.h; // -464 .. -362, on Meta's board
const OUT_Y = 362; // 362 .. 464, on the open ground
// the upper pool: Meta's board, a dense orderly grid (9 x 7 = 63)
const BOARD = { x0: 96, x1: 984, y0: -1152, y1: -352 } as const;
type Home = { x: number; y: number; row: number };
const UPPER: Home[] = [];
for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) UPPER.push({ x: 172 + 92 * c, y: -476 - 96 * r, row: r });
// the lower pool: everyone else, on the open ground, a looser staggered field (8/7/8/7/8/7/8 = 53)
const LOWER: Home[] = [];
for (let r = 0; r < 7; r++) {
  const n = r % 2 === 0 ? 8 : 7;
  for (let c = 0; c < n; c++) LOWER.push({ x: (r % 2 === 0 ? 176 : 228) + 104 * c, y: 548 + 90 * r, row: r });
}
const homeAt = (pool: Home[], x: number, row: number) => {
  const h = pool.find((q) => q.x === x && q.row === row);
  if (!h) throw new Error(`RecruitingFilter: no peg at x ${x}, row ${row}`);
  return h;
};

// --- the picked: a path from home through the gate into a slot, at one even pace -------------------
type Pt = { x: number; y: number };
const V = 18; // world px per frame, every peg
const T_ACC = 6;
const T_DEC = 8;
const CORNER = 28;
/** A polyline with rounded corners, sampled; returns the point at arc length s and the total length. */
const buildPath = (pts: Pt[]) => {
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const v = pts[i];
    const b = pts[i + 1];
    const la = Math.hypot(v.x - a.x, v.y - a.y);
    const lb = Math.hypot(b.x - v.x, b.y - v.y);
    const r = Math.min(CORNER, la / 2, lb / 2);
    const p0 = { x: v.x - ((v.x - a.x) / la) * r, y: v.y - ((v.y - a.y) / la) * r };
    const p1 = { x: v.x + ((b.x - v.x) / lb) * r, y: v.y + ((b.y - v.y) / lb) * r };
    for (let j = 0; j <= 10; j++) {
      const t = j / 10;
      out.push({
        x: (1 - t) * (1 - t) * p0.x + 2 * t * (1 - t) * v.x + t * t * p1.x,
        y: (1 - t) * (1 - t) * p0.y + 2 * t * (1 - t) * v.y + t * t * p1.y,
      });
    }
  }
  out.push(pts[pts.length - 1]);
  const cum = [0];
  for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y));
  const total = cum[cum.length - 1];
  const at = (s: number): Pt => {
    const d = Math.max(0, Math.min(total, s));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const seg = cum[i] - cum[i - 1] || 1;
    const t = (d - cum[i - 1]) / seg;
    return { x: lerp(out[i - 1].x, out[i].x, t), y: lerp(out[i - 1].y, out[i].y, t) };
  };
  return { at, total };
};
/** Distance travelled tau frames after departure: eased off the mark, an even pace, a soft arrival. */
const travelled = (tau: number, total: number) => {
  const T = total / V + (T_ACC + T_DEC) / 2;
  if (tau <= 0) return 0;
  if (tau >= T) return total;
  if (tau < T_ACC) return (V * tau * tau) / (2 * T_ACC);
  if (tau > T - T_DEC) {
    const u = T - tau;
    return total - (V * u * u) / (2 * T_DEC);
  }
  return V * (tau - T_ACC / 2);
};
type Pick = {
  home: Home;
  slot: number;
  amber: number; // the frame it has turned amber
  depart: number;
  arrive: number; // the path's end
  land: number; // seated: handed to the tile
  path: ReturnType<typeof buildPath>;
};
const SEAT_F = 5;
/** `lane` = the file's lane into the gate: its top (where a peg from deep in the pool joins it, clear of the
 *  identity tile), the funnel just before the wall, and the exit just past it. */
const makePicks = (homes: Home[], slots: number[], sieve: SieveSpec, lane: { join: Pt; funnel: Pt; exit: Pt }, gate0: number, gap: number): Pick[] =>
  homes.map((home, i) => {
    const s = TILE.slots[slots[i]];
    const deep = Math.abs(home.y) > Math.abs(lane.join.y);
    const lead = [{ x: home.x, y: home.y }, ...(deep ? [lane.join] : []), lane.funnel];
    const path = buildPath([...lead, lane.exit, { x: s.x, y: s.y }]);
    const toFunnel = buildPath(lead).total;
    const depart = gate0 + i * gap - (toFunnel / V + T_ACC / 2);
    const arrive = depart + path.total / V + (T_ACC + T_DEC) / 2;
    const amber = sieve.f0 + (home.x + P / 2 + SIEVE_W + 60) / sieve.v;
    return { home, slot: slots[i], amber, depart, arrive, land: Math.ceil(arrive + 3), path };
  });
// upper: into the tile's top row, the outer slots first
const PICK_U = makePicks(
  [homeAt(UPPER, 724, 0), homeAt(UPPER, 264, 2), homeAt(UPPER, 448, 4), homeAt(UPPER, 816, 1)],
  [0, 3, 1, 2],
  SIEVE_U,
  { join: { x: CX, y: -560 }, funnel: { x: CX, y: -335 }, exit: { x: CX, y: -130 } },
  142,
  8,
);
// lower: UP into the bottom row
const PICK_L = makePicks(
  [homeAt(LOWER, 592, 0), homeAt(LOWER, 644, 1), homeAt(LOWER, 384, 2), homeAt(LOWER, 696, 4)],
  [4, 7, 5, 6],
  SIEVE_L,
  { join: { x: CX, y: 640 }, funnel: { x: CX, y: 385 }, exit: { x: CX, y: 200 } },
  235,
  7,
);
const PICKS = [...PICK_U, ...PICK_L];
export const LAST_LAND = Math.max(...PICKS.map((p) => p.land));
const SWEEP_F = [LAST_LAND, LAST_LAND + 12] as const;
/** For the build's checks (scripts only). */
export const SCHEDULE = PICKS.map((p) => ({ slot: p.slot, amber: p.amber, depart: p.depart, arrive: p.arrive, land: p.land }));

// --- THE CAMERA: one journey, superposed eased glides (y in world px, k in log) ---------------------
const GLIDE_Y: [number, number, number][] = [
  [6, 58, -740], // up to Meta's board as the pull-back ends
  [104, 162, 640], // back down with the four, the gate near the middle
  [180, 222, 485], // on down past the tile to the crowd outside
  [246, 292, -385], // up with the last of them: the tile at the true middle
];
const K0 = 1.95;
const GLIDE_K: [number, number, number][] = [
  [-8, 44, Math.log(1.08 / K0)], // the pull back
  [48, 126, Math.log(1.15 / 1.08)],
  [126, 170, Math.log(1.4 / 1.15)],
  [180, 222, Math.log(1.18 / 1.4)],
  [246, 292, Math.log(1.82 / 1.18)],
  [284, 344, Math.log(1.03)], // the tail's drift
];
export const camAt = (f: number): Cam => {
  let y = 0;
  for (const [a, b, d] of GLIDE_Y) y += d * sm5((f - a) / (b - a));
  let lk = Math.log(K0);
  for (const [a, b, d] of GLIDE_K) lk += d * sm5((f - a) / (b - a));
  return { x: CX, y, k: Math.exp(lk) };
};

// --- local parts ----------------------------------------------------------------------------------
/** A filter: one thick cream wall across the frame (top surface + front face) with its one gate. Two
 *  halves, ONE object, one shadow. */
const FilterWall: React.FC<{ y0: number; k: number }> = ({ y0, k }) => {
  const uid = uidOf(useId());
  const g0 = CX - WALL.gate / 2;
  const g1 = CX + WALL.gate / 2;
  const H = WALL.h + WALL.face;
  const halves = [
    { x: WALL.x0, w: g0 - WALL.x0 },
    { x: g1, w: WALL.x1 - g1 },
  ];
  const sil: Silhouette = halves.map((h) => ({ d: rectPath(h.x, y0, h.w, H, GEO.RADIUS) }));
  const e = EDGE.CREAM / k;
  const faceTop = mixHex(COLOR.creamFoot, COLOR.board, 0.45);
  const faceFoot = mixHex(COLOR.creamFoot, COLOR.board, 0.7);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y0 + WALL.h)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}f`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0 + WALL.h)} x2="0" y2={f2(y0 + H)}>
          <stop offset="0" stopColor={faceTop} />
          <stop offset="1" stopColor={faceFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={sil} elevation="float" />
      {halves.map((h, i) => (
        <g key={i}>
          <path d={rectPath(h.x, y0, h.w, H, GEO.RADIUS)} fill={`url(#${uid}f)`} />
          <path d={rectPath(h.x, y0, h.w, WALL.h, GEO.RADIUS, true, false)} fill={`url(#${uid}c)`} />
        </g>
      ))}
      <path d={`M${f2(WALL.x0)} ${f2(y0 + e / 2)}H${f2(g0 - GEO.RADIUS)}M${f2(g1 + GEO.RADIUS)} ${f2(y0 + e / 2)}H${f2(WALL.x1)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(e)} />
    </g>
  );
};
/** The sieve: one heavy cream bar standing across the whole crowd, floating over it. */
const Sieve: React.FC<{ s: SieveSpec; f: number; k: number }> = ({ s, f, k }) => {
  const uid = uidOf(useId());
  const lead = sieveLead(s, f);
  const d = rectPath(lead - SIEVE_W, s.y0, SIEVE_W, s.y1 - s.y0, GEO.RADIUS);
  const e = EDGE.CREAM / k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(s.y0)} x2="0" y2={f2(s.y1)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={[{ d }]} elevation="float" />
      <path d={d} fill={`url(#${uid}c)`} />
      <path d={`M${f2(lead - SIEVE_W + GEO.RADIUS)} ${f2(s.y0 + e / 2)}H${f2(lead - GEO.RADIUS)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(e)} />
    </g>
  );
};
const BOARD_MIX = 0.7; // Meta's board: kraft board in shadow (a tone), so the kraft pegs stand off it
/** Meta's board. */
const PoolBoard: React.FC<{ k: number }> = ({ k }) => {
  const uid = uidOf(useId());
  const d = rectPath(BOARD.x0, BOARD.y0, BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0, GEO.RADIUS);
  const e = EDGE.CREAM / k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={BOARD.y0} x2="0" y2={BOARD.y1}>
          <stop offset="0" stopColor={mixHex(COLOR.board, COLOR.ground, BOARD_MIX)} />
          <stop offset="1" stopColor={mixHex(COLOR.boardFoot, COLOR.ground, BOARD_MIX)} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={[{ d }]} elevation="rest" />
      <path d={d} fill={`url(#${uid}b)`} />
      <path d={`M${f2(BOARD.x0 + GEO.RADIUS)} ${f2(BOARD.y0 + e / 2)}H${f2(BOARD.x1 - GEO.RADIUS)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edgeBoard} strokeWidth={f2(e)} />
    </g>
  );
};
/** The outside pool's identity tile: the Meta mark's cream tile, carrying the words in ink. */
const OutsideTag: React.FC<{ k: number }> = ({ k }) => {
  const uid = uidOf(useId());
  const d = rectPath(TAG.x0, OUT_Y, TAG.w, TAG.h, GEO.RADIUS);
  const e = EDGE.CREAM / k;
  const fs = 42;
  const cap = fs * METRIC.cap;
  const gap = 14;
  const top = OUT_Y + (TAG.h - 2 * cap - gap) / 2;
  const cx = TAG.x0 + TAG.w / 2 + (TRACK.label * fs) / 2;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(OUT_Y)} x2="0" y2={f2(OUT_Y + TAG.h)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={[{ d }]} elevation="rest" contact={{ x: TAG.x0 + TAG.w / 2, y: OUT_Y + TAG.h, w: TAG.w * 0.86 }} />
      <path d={d} fill={`url(#${uid}c)`} />
      <path d={`M${f2(TAG.x0 + GEO.RADIUS)} ${f2(OUT_Y + e / 2)}H${f2(TAG.x0 + TAG.w - GEO.RADIUS)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(e)} />
      {["OUTSIDE", "META"].map((t, i) => (
        <text
          key={t}
          x={f2(cx)}
          y={f2(top + cap + i * (cap + gap))}
          fontFamily={FONT_LABEL}
          fontWeight={500}
          fontSize={fs}
          letterSpacing={`${TRACK.label}em`}
          textAnchor="middle"
          fill={COLOR.inkDark}
          style={{ fontFeatureSettings: '"case" 1' }}
        >
          {t}
        </text>
      ))}
    </g>
  );
};
const SHADE = 0.6;
const SINK = 0.55;
/** A pool: everyone who is not picked, one shadow layer. The sieve presses each one down into its slot,
 *  out of the light, from the frame its edge reaches them. */
const Crowd: React.FC<{ pool: Home[]; skip: Set<Home>; sieve: SieveSpec; f: number; k: number }> = ({ pool, skip, sieve, f, k }) => {
  const list = pool
    .filter((h) => !skip.has(h))
    .map((h) => {
      const u = pressOf(sieve, f, h.x);
      return { ...h, e: 1 - (1 - u) * (1 - u) };
    })
    .sort((a, b) => a.y - b.y);
  return (
    <g>
      <PegShadows pegs={list.map((p) => ({ x: p.x, y: p.y, size: P, sink: SINK * p.e }))} />
      {list.map((p) => (
        <PersonPeg key={`${p.x},${p.y}`} x={p.x} y={p.y} size={P} k={k} shadow={false} slot="ground" sink={SINK * p.e} shade={SHADE * p.e} />
      ))}
    </g>
  );
};

const LABEL_PX = 60; // the MSL label (SCREEN px): twice the LABEL token, by the director's note
const RecruitingFilter: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);
  const skipU = new Set(PICK_U.map((p) => p.home));
  const skipL = new Set(PICK_L.map((p) => p.home));
  const seated = TILE.slots.map((_, i) => {
    const p = PICKS.find((q) => q.slot === i);
    return p && f >= p.land ? ("amber" as const) : null;
  });
  // a picked peg: at home (turning amber), lifting, in flight, seating
  const pickEl = (p: Pick, phase: "home" | "fly") => {
    const liftStart = p.depart - 8;
    const flying = f >= liftStart;
    if ((phase === "fly") !== flying || f >= p.land) return null;
    const blend = smoothstep(pressOf(p.home.y < 0 ? SIEVE_U : SIEVE_L, f, p.home.x));
    const pos = p.path.at(travelled(f - p.depart, p.path.total));
    const q = clamp01((f - (p.land - SEAT_F)) / SEAT_F);
    const lift = smoothstep((f - liftStart) / 8) * (1 - smoothstep(q));
    return (
      <PersonPeg
        key={p.slot}
        x={pos.x}
        y={pos.y}
        size={P}
        k={k}
        blend={blend}
        sink={SEAT * smoothstep(q)}
        elevation="rest"
        lift={lift}
        shadowStrength={1 - smoothstep(q)}
        slot={null}
        amberBand={band}
      />
    );
  };
  return (
    <AbsoluteFill>
      <StoutStage S={f} cam={cam} rest={camAt(0)} pool={{ x: CX, y: camAt(f - 6).y }}>
        {/* the pool inside Meta: the board, its mark, the crowd */}
        <PoolBoard k={k} />
        <Crowd pool={UPPER} skip={skipU} sieve={SIEVE_U} f={f} k={k} />
        {PICK_U.map((p) => (
          <PegSlot key={p.slot} x={p.home.x} y={p.home.y} size={P} k={k} on="ground" />
        ))}
        {PICK_U.map((p) => pickEl(p, "home"))}
        <MetaMark x={TAG.x0 + TAG.w / 2} y={MARK_Y + TAG.h / 2} w={TAG.w} h={TAG.h} k={k} />

        {/* the pool outside Meta: the open ground */}
        <OutsideTag k={k} />
        <Crowd pool={LOWER} skip={skipL} sieve={SIEVE_L} f={f} k={k} />
        {PICK_L.map((p) => (
          <PegSlot key={p.slot} x={p.home.x} y={p.home.y} size={P} k={k} on="ground" />
        ))}
        {PICK_L.map((p) => pickEl(p, "home"))}

        {/* the filters and the team */}
        <FilterWall y0={WALL_U} k={k} />
        <FilterWall y0={WALL_L} k={k} />
        <Label x={TILE.x0 - 20 / k} y={TILE.y0 + (LABEL_PX * METRIC.cap) / k} k={k} px={LABEL_PX} text="MSL" tone="cream" anchor="end" />
        <TeamTile x={CX} y={0} cols={4} rows={2} peg={P} k={k} seated={seated} amberBand={band} />
        <LightSweep x={TILE.x0} y={TILE.y0} w={TILE.w} h={TILE.h} k={k} t={(f - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0])} on="cream" />

        {/* the sieve edges, over the crowds */}
        <Sieve s={SIEVE_U} f={f} k={k} />
        <Sieve s={SIEVE_L} f={f} k={k} />

        {/* the picked, in flight */}
        {PICKS.map((p) => pickEl(p, "fly"))}
      </StoutStage>
    </AbsoluteFill>
  );
};

export default RecruitingFilter;
