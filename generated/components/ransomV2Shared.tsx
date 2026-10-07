// ---------------------------------------------------------------------------
// ransomV2Shared: the world of the Ransom Room, V2 (Dwarkesh Patel with Si
// Sheppard, "Why captured emperors cooperated": FillThatRoomV2 and the cut that
// follows it). THE ROOM IS THE FRAME: the back wall of the Cuarto del Rescate
// at Cajamarca is the page itself, fitted Inca ashlar in fine cream line on the
// umber ground, two trapezoidal niches in the upper wall, the wall darkening
// toward the top; a floor line at world y 1500. World-space: it moves with the
// camera. Atahualpa (stringsShared's Emperor, inca) stands on that floor, held
// from above by the captor's gauntlet and bar on three orange strings.
// ONE ACCENT: orange = the live hold (the strings). The gold is cream ink.
//
// EXPORTS
//   ROOM                         floor, line (the chalk line's y), lineX (his fingertips), ...
//   RansomPage cam               the umber page (stringsShared's)
//   RansomWall                   the ashlar wall (draw inside a WorldSvg)
//   ChalkLine l r                the line, drawn out from his hand both ways (0..1 each)
//   Bank rise shadeX             the bank of goldwork; rise(i) = piece i's arrival 0..1
//   BANK, BANK_ROWS              the composed pieces (row 0 = the front course, on the floor)
//   RansomHand at grip dip uid   the gauntlet with fingers that open, the bar that dips
//   POSE_REST, POSE_REACH        Atahualpa at rest / at full stretch, fingertips on the line
//   RansomScene, RansomTableau   a whole state as data, and its picture
//   RANSOM_MAIN, RANSOM_END      the main framing with the full bank / the end state
//   ransomEndScene(f)            the END state's living hold at frame f (strings swaying)
//   CAM_RANSOM_MAIN, CAM_RANSOM_END, PIZARRO (the label's world anchor)
//   GoldPiece, PIECES, KINDS     (ransomV2Gold) the twelve forms
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, INK, LAND, clamp01, hash, smoothstep, swayCam, type Cam, type P2 } from "./incaShared";
import { BAR_W, Emperor, HAND_S, Label, PuppetString, StringsPage, WorldSvg, emperorRig, glintAt, mix, type EmperorPose, type StringGeom } from "./stringsShared";
import { GoldPiece, PIECES, type Kind } from "./ransomV2Gold";

export { GoldPiece, KINDS, PIECES, palOf, type Kind } from "./ransomV2Gold";

const f1 = (n: number) => n.toFixed(1);
const P = (v: P2) => `${f1(v[0])},${f1(v[1])}`;

// ---------------------------------------------------------------------------
// ATAHUALPA'S TWO POSES, AND WHERE THE LINE IS
// ---------------------------------------------------------------------------
/** at rest: upright, the hands low at his sides */
export const POSE_REST: EmperorPose = { head: 0, nod: 0, slump: 0, lean: 0, wristL: [-72, -150], wristR: [72, -150], fistL: 0.75, fistR: 0.75, hang: 0, limp: 0.35 };
/** "this high": up on his toes, the whole body lengthened, the right arm (screen right) at full stretch, the hand open */
export const POSE_REACH: EmperorPose = { head: 8, nod: 0, slump: 0, lean: 2.5, wristL: [-82, -144], wristR: [88, -392], fistL: 0.75, fistR: 0, hang: 10, limp: 0 };
/** his fingertips (figure-local) in a pose: the right hand */
export const fingertip = (pose: EmperorPose): P2 => {
  const a = emperorRig(pose, "inca").armR;
  return [a.W[0] + a.dir[0] * 40, a.W[1] + a.dir[1] * 40];
};
const TIP = fingertip(POSE_REACH);
/** the room (world px). Atahualpa's feet in the main framing: (ROOM.standX, ROOM.floor). */
export const ROOM = {
  floor: 1500,
  standX: 437,
  /** the chalk line: his fingertips at full stretch */
  line: 1500 + TIP[1],
  lineX: 437 + TIP[0],
  /** the wall is drawn over x0..x1, from `top` down to the floor */
  x0: -160,
  x1: 1240,
  top: 180,
  /** the captor's grip (the middle of the fist) above him */
  hand: [437, 742] as P2,
};

// ---------------------------------------------------------------------------
// THE WALL: coursed, fitted ashlar. Every block is its own rounded outline a
// hair inside its cell, so each joint is a tight double line; the lower and
// right edges of every face carry short strokes (the pillowed face turning
// into its sunk joint; light from the upper left).
// ---------------------------------------------------------------------------
const roundPoly = (pts: P2[], r: number) => {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n];
    const b = pts[i];
    const c = pts[(i + 1) % n];
    const la = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const lc = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const p0: P2 = [b[0] + ((a[0] - b[0]) / la) * r, b[1] + ((a[1] - b[1]) / la) * r];
    const p1: P2 = [b[0] + ((c[0] - b[0]) / lc) * r, b[1] + ((c[1] - b[1]) / lc) * r];
    d += `${i ? "L" : "M"}${P(p0)}Q${P(b)} ${P(p1)}`;
  }
  return `${d}Z`;
};
const NICHES: { x: number; y0: number; y1: number; wb: number; wt: number }[] = [
  { x: 250, y0: 800, y1: 1030, wb: 122, wt: 94 },
  { x: 748, y0: 800, y1: 1030, wb: 122, wt: 94 },
];
const WALL = (() => {
  let blocks = "";
  let pillow = "";
  let pits = "";
  let y = ROOM.floor;
  let ci = 0;
  while (y > ROOM.top) {
    const h = 92 + 52 * hash(ci, 7);
    let x = ROOM.x0 - 130 * hash(ci, 8);
    let j = 0;
    while (x < ROOM.x1) {
      const w = 102 + 86 * hash(ci * 37 + j, 9);
      const id = ci * 53 + j * 7;
      const g = 2.1;
      const jt = (n: number) => (hash(id + n, 11) - 0.5) * 3.4;
      const a: P2 = [x + g + jt(0), y - h + g + jt(1)];
      const b: P2 = [x + w - g + jt(2), y - h + g + jt(3)];
      const c: P2 = [x + w - g + jt(4), y - g + jt(5)];
      const d: P2 = [x + g + jt(6), y - g + jt(7)];
      blocks += roundPoly([a, b, c, d], 7 + 4 * hash(id, 12));
      let q = 0;
      for (let px = x + 11; px < x + w - 9; px += 5.2, q++) {
        const len = 4 + 9 * hash(id + q, 13);
        pillow += `M${f1(px)},${f1(y - g - 2.6)}l0.8,-${f1(len)}`;
      }
      for (let py = y - h + 12; py < y - 9; py += 5.2, q++) {
        const len = 4 + 9 * hash(id + q, 14);
        pillow += `M${f1(x + w - g - 2.6)},${f1(py)}l-${f1(len)},0.8`;
      }
      for (let n = 0; n < 5; n++) {
        const px = x + 14 + (w - 28) * hash(id + n, 15);
        const py = y - h + 14 + (h - 28) * hash(id + n, 16);
        pits += `M${f1(px)},${f1(py)}l${f1(2 + 5 * hash(id + n, 17))},${f1(1.4 * (hash(id + n, 18) - 0.5))}`;
      }
      x += w;
      j++;
    }
    y -= h;
    ci++;
  }
  // the wall darkens toward the top: ruled strokes, closer and longer the higher they are
  let dark = "";
  const y1 = 1010;
  for (let row = 0, yy = ROOM.top; yy < y1; row++) {
    const t = (y1 - yy) / (y1 - ROOM.top);
    const gap = mix(26, 7.5, Math.pow(t, 0.8));
    for (let xx = ROOM.x0 + 40 * hash(row, 21), n = 0; xx < ROOM.x1; n++) {
      const len = mix(20, 90, t) * (0.55 + 0.9 * hash(row * 91 + n, 22));
      const skip = (1 - t) * 60 * hash(row * 91 + n, 23) + 9;
      dark += `M${f1(xx)},${f1(yy + 3 * (hash(row * 91 + n, 24) - 0.5))}l${f1(len)},${f1(-len * 0.16)}`;
      xx += len + skip;
    }
    yy += gap;
  }
  // the floor: a firm line, and the contact shade under the wall (short strokes thinning away from it)
  let floor = "";
  for (let r = 0; r < 7; r++) {
    const yy = ROOM.floor + 7 + r * 8.5;
    for (let xx = ROOM.x0 + 60 * hash(r, 31), n = 0; xx < ROOM.x1; n++) {
      const len = (70 - r * 7) * (0.4 + hash(r * 77 + n, 32));
      floor += `M${f1(xx)},${f1(yy)}l${f1(len)},${f1(1.5 * (hash(r * 77 + n, 33) - 0.5))}`;
      xx += len + 14 + r * r * 5 * (0.5 + hash(r * 77 + n, 34));
    }
  }
  // the floor's flagstones, receding toward us: joints fanning from a point behind the wall, courses widening
  let flags = "";
  const vp: P2 = [540, ROOM.floor - 520];
  const rows = [ROOM.floor, ROOM.floor + 74, ROOM.floor + 178, ROOM.floor + 330, ROOM.floor + 560, ROOM.floor + 900];
  const at = (x0: number, yy: number) => vp[0] + ((x0 - vp[0]) * (yy - vp[1])) / (ROOM.floor - vp[1]);
  rows.slice(1).forEach((yy) => {
    flags += `M${f1(at(ROOM.x0 - 600, yy))},${yy}L${f1(at(ROOM.x1 + 600, yy))},${yy}`;
  });
  for (let r = 0; r < rows.length - 1; r++)
    for (let x0 = ROOM.x0 - 600 + (r % 2) * 80; x0 < ROOM.x1 + 600; x0 += 160) flags += `M${f1(at(x0, rows[r] + (r ? 0 : 3)))},${rows[r] + (r ? 0 : 3)}L${f1(at(x0, rows[r + 1]))},${rows[r + 1]}`;
  return { blocks, pillow, pits, dark, floor, flags };
})();
const nicheD = (n: (typeof NICHES)[number], inset = 0) =>
  `M${f1(n.x - n.wb / 2 + inset)},${n.y1}L${f1(n.x - n.wt / 2 + inset)},${n.y0 + inset}L${f1(n.x + n.wt / 2 - inset)},${n.y0 + inset}L${f1(n.x + n.wb / 2 - inset)},${n.y1}Z`;
const NICHE_HATCH = (() => {
  let d = "";
  for (let o = -260; o < 260; o += 6.5) d += `M${f1(o - 70)},-130L${f1(o + 70)},130`;
  return d;
})();
const WallArt: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="rv2-up" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={DARK} stopOpacity={0.5} />
        <stop offset="1" stopColor={DARK} stopOpacity={0} />
      </linearGradient>
      {NICHES.map((n, i) => (
        <clipPath key={i} id={`rv2-niche${i}`}>
          <path d={nicheD(n)} />
        </clipPath>
      ))}
    </defs>
    <path d={WALL.pillow} fill="none" stroke={INK} strokeOpacity={0.15} strokeWidth={1.1} strokeLinecap="round" />
    <path d={WALL.pits} fill="none" stroke={INK} strokeOpacity={0.14} strokeWidth={1.2} strokeLinecap="round" />
    <path d={WALL.blocks} fill="none" stroke={INK} strokeOpacity={0.36} strokeWidth={1.7} strokeLinejoin="round" />
    {NICHES.map((n, i) => (
      <g key={i}>
        {/* the lintel: one long stone over the opening */}
        <path d={roundPoly([[n.x - n.wt / 2 - 38, n.y0 - 50], [n.x + n.wt / 2 + 36, n.y0 - 52], [n.x + n.wt / 2 + 37, n.y0 - 4], [n.x - n.wt / 2 - 37, n.y0 - 3]], 8)} fill={LAND} stroke={INK} strokeOpacity={0.4} strokeWidth={1.7} />
        <path d={nicheD(n)} fill="#1E1711" />
        <g clipPath={`url(#rv2-niche${i})`}>
          <path d={NICHE_HATCH} transform={`translate(${n.x} ${(n.y0 + n.y1) / 2})`} fill="none" stroke={DARK} strokeOpacity={0.75} strokeWidth={1.6} />
          {/* the reveal: the right jamb and the sill catch the light */}
          <path d={`M${f1(n.x + n.wb / 2)},${n.y1}L${f1(n.x + n.wt / 2)},${n.y0}L${f1(n.x + n.wt / 2 - 17)},${n.y0 + 15}L${f1(n.x + n.wb / 2 - 19)},${n.y1 - 13}Z`} fill="#51432F" />
          <path d={`M${f1(n.x - n.wb / 2)},${n.y1}L${f1(n.x + n.wb / 2)},${n.y1}L${f1(n.x + n.wb / 2 - 19)},${n.y1 - 13}L${f1(n.x - n.wb / 2 + 5)},${n.y1 - 13}Z`} fill="#45392A" />
          <path d={`M${f1(n.x + n.wt / 2 - 17)},${n.y0 + 15}L${f1(n.x + n.wb / 2 - 19)},${n.y1 - 13}L${f1(n.x - n.wb / 2 + 5)},${n.y1 - 13}`} fill="none" stroke={INK} strokeOpacity={0.3} strokeWidth={1.4} />
        </g>
        <path d={nicheD(n)} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={2.2} strokeLinejoin="round" />
      </g>
    ))}
    <path d={WALL.dark} fill="none" stroke={DARK} strokeOpacity={0.42} strokeWidth={1.7} strokeLinecap="round" />
    <rect x={ROOM.x0} y={ROOM.top - 400} width={ROOM.x1 - ROOM.x0} height={1010 - ROOM.top + 400} fill="url(#rv2-up)" />
    <path d={`M${ROOM.x0},${ROOM.floor + 1}L${ROOM.x1},${ROOM.floor + 1}`} stroke={DARK} strokeOpacity={0.7} strokeWidth={7} />
    <path d={`M${ROOM.x0},${ROOM.floor}L${ROOM.x1},${ROOM.floor}`} stroke={INK} strokeOpacity={0.5} strokeWidth={2.2} />
    <path d={WALL.flags} fill="none" stroke={INK} strokeOpacity={0.2} strokeWidth={1.7} strokeLinecap="round" />
    <path d={WALL.floor} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
  </g>
);
export const RansomWall = React.memo(WallArt);
export const RansomPage = StringsPage;

// ---------------------------------------------------------------------------
// THE CHALK LINE: level across the whole wall at ROOM.line, drawn out from his
// fingertips (ROOM.lineX) both ways; a little rough, as chalk on stone is
// ---------------------------------------------------------------------------
const LINE_SPAN: [number, number] = [ROOM.x0, ROOM.x1];
const lineY = (x: number) => ROOM.line + 1.5 * (hash(Math.round(x / 13), 41) - 0.5) + 1.2 * Math.sin(x / 61);
const linePts = (xa: number, xb: number, dy = 0): string => {
  const pts: string[] = [];
  const n = Math.max(2, Math.ceil(Math.abs(xb - xa) / 13));
  for (let i = 0; i <= n; i++) {
    const x = xa + ((xb - xa) * i) / n;
    pts.push(`${f1(x)},${f1(lineY(x) + dy)}`);
  }
  return `M${pts.join("L")}`;
};
export const ChalkLine: React.FC<{ l: number; r: number; x?: number }> = ({ l, r, x = ROOM.lineX }) => {
  if (l <= 0.001 && r <= 0.001) return null;
  const xa = x - (x - LINE_SPAN[0]) * clamp01(l);
  const xb = x + (LINE_SPAN[1] - x) * clamp01(r);
  const d = linePts(xa, xb);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.6} strokeWidth={8} />
      <path d={d} stroke={INK} strokeWidth={4.2} />
      <path d={linePts(xa, xb, 3)} stroke={INK} strokeOpacity={0.5} strokeWidth={1.3} strokeDasharray="9 7 3 11 16 6" />
      <path d={linePts(xa, xb, -2.8)} stroke={INK} strokeOpacity={0.4} strokeWidth={1.1} strokeDasharray="5 13 12 9 2 17" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BANK: four courses of goldwork seen front-on, composed like an engraved
// still life. Row 0 stands on the floor nearest us (ink 1.0); each row behind
// stands higher and is a step dimmer; the last row's tops lie just under the
// chalk line and never above it. Silver (paler, unhatched) on the two rows
// behind. Painter's order: the furthest row first.
// ---------------------------------------------------------------------------
export type BankPiece = { kind: Kind; row: number; x: number; y: number; s: number; rot: number; flip: boolean; silver: boolean; col: number };
type Def = [Kind, number, number?, number?, ("f" | "s" | "fs")?];
const ROWS: { base: number; tone: number; defs: Def[] }[] = [
  {
    base: ROOM.floor,
    tone: 1,
    defs: [
      ["plates", 172],
      ["kero", 264, 0.98, -2],
      ["bars", 352],
      ["bowl", 440],
      ["llama", 536, 1.02],
      ["spools", 634, 1.05],
      ["plates", 730, 1, 0, "f"],
      ["aryballos", 822, 0.9, 13],
      ["bars", 916, 1, 0, "f"],
    ],
  },
  {
    base: 1428,
    tone: 0.9,
    defs: [
      ["figurine", 150],
      ["aryballos", 218, 1, -7],
      ["faceJar", 308, 1.02],
      ["tumi", 392, 1, -5],
      ["kero", 470, 1.08, 2],
      ["maize", 556, 1.05, 6],
      ["faceJar", 640, 1, 0, "f"],
      ["llama", 738, 1.08, 0, "f"],
      ["kero", 834, 1.04, -3],
      ["figurine", 916, 1.02],
    ],
  },
  {
    base: 1346,
    tone: 0.78,
    defs: [
      ["kero", 176, 1.06, 2],
      ["llama", 264, 1.02],
      ["aryballos", 354, 1, 4, "s"],
      ["figurine", 437, 1.02],
      ["faceJar", 516, 1.02, 0, "f"],
      ["sunDisc", 664, 1.32, 3],
      ["aryballos", 796, 1, -5],
      ["tumi", 872, 1, 4, "s"],
      ["kero", 940, 1.04],
    ],
  },
  {
    base: 0, // the top row hangs from the line (see below)
    tone: 0.66,
    defs: [
      ["faceJar", 160, 1, 0, "s"],
      ["kero", 238, 1.06, -2],
      ["aryballos", 314, 0.98, 0, "s"],
      ["figurine", 390, 1],
      ["maize", 456, 1.04, 0, "s"],
      ["kero", 532, 1.08, 2, "s"],
      ["faceJar", 612, 1.02, 0, "f"],
      ["aryballos", 694, 0.98, -2],
      ["figurine", 770, 1.02, 0, "s"],
      ["kero", 846, 1.08, 2],
      ["aryballos", 924, 0.98, 0, "s"],
    ],
  },
];
export const BANK_ROWS = ROWS.length;
export const BANK: BankPiece[] = ROWS.flatMap((R, row) =>
  R.defs.map(([kind, x, s = 1, rot = 0, fl = ""], col): BankPiece => {
    const top = ROOM.line + 9 + 11 * hash(col, 61);
    const y = row === BANK_ROWS - 1 ? top + PIECES[kind].h * s : R.base + (row ? 5 * (hash(col + row * 20, 62) - 0.5) : 0);
    return { kind, row, x, y, s, rot, flip: fl.includes("f"), silver: fl.includes("s"), col };
  }),
);
export const ROW_TONE = ROWS.map((r) => r.tone);
/** how many pieces each row has */
export const ROW_COUNT = ROWS.map((r) => r.defs.length);
/** the dark of the heap between the pieces: its top as each row comes */
const MASS_TOP = [ROOM.floor - 66, 1322, 1250, ROOM.line + 100];
const DRAW_ORDER = BANK.map((_, i) => i).sort((a, b) => BANK[b].row - BANK[a].row || hash(BANK[a].col, 63 + BANK[a].row) - hash(BANK[b].col, 63 + BANK[b].row));
/** the bank. rise(piece, index) = that piece's arrival 0..1 (it slides up 30 px into place);
 *  omitted = the full bank. shadeX: the pieces behind a figure standing at that x step down to the 0.55 ink. */
export const Bank: React.FC<{ rise?: (p: BankPiece, i: number) => number; shadeX?: number | null }> = ({ rise, shadeX = null }) => {
  const prog = BANK.map((p, i) => (rise ? clamp01(rise(p, i)) : 1));
  const rowP = ROWS.map((_, r) => {
    const mine = BANK.map((p, i) => (p.row === r ? prog[i] : -1)).filter((v) => v >= 0);
    return mine.reduce((a, b) => a + b, 0) / mine.length;
  });
  if (rowP[0] <= 0.001) return null;
  let top = ROOM.floor;
  MASS_TOP.forEach((t, r) => {
    top += (t - (r ? MASS_TOP[r - 1] : ROOM.floor)) * smoothstep(rowP[r]);
  });
  return (
    <g>
      <path d={`M${ROOM.x0},${ROOM.floor}L${ROOM.x0},${f1(top)}L${ROOM.x1},${f1(top)}L${ROOM.x1},${ROOM.floor}Z`} fill="#17120D" />
      {DRAW_ORDER.map((i) => {
        const p = BANK[i];
        const a = prog[i];
        if (a <= 0.001) return null;
        const e = 1 - Math.pow(1 - a, 3);
        const behind = shadeX === null ? 1 : mix(0.55 / ROW_TONE[p.row], 1, smoothstep((Math.abs(p.x - shadeX) - 58) / 70));
        return <GoldPiece key={i} kind={p.kind} x={p.x} y={p.y + 30 * (1 - e)} s={p.s} rot={p.rot} flip={p.flip} silver={p.silver} tone={ROW_TONE[p.row] * Math.min(1, behind)} opacity={clamp01(a * 3.5)} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CAPTOR'S HAND, V2: stringsFigures' gauntlet (same plates, same hatching),
// drawn here so that its fingers can OPEN round the bar (grip 1 = closed over
// it, 0.5 = half open: the fingers hang longer and apart, the thumb swings
// clear) and the bar can dip in the loosened hand. at = the middle of the grip.
// ---------------------------------------------------------------------------
const C_DEEP = "#D3C5A2";
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = "";
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.5;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    let t0 = -R;
    let t1 = R;
    if (Math.abs(dx) > 1e-6) {
      const a = (x0 - px) / dx;
      const b = (x1 - px) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (px < x0 || px > x1) continue;
    if (Math.abs(dy) > 1e-6) {
      const a = (y0 - py) / dy;
      const b = (y1 - py) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (py < y0 || py > y1) continue;
    const span = t1 - t0;
    if (span < 3) continue;
    t0 += hash(i, seed + 7) * rag * span;
    t1 -= hash(i, seed + 13) * rag * span;
    d += `M${f1(px + dx * t0)},${f1(py + dy * t0)}L${f1(px + dx * t1)},${f1(py + dy * t1)}`;
  }
  return d;
};
const H_FORE = "M-43,-150L-50,-900L50,-900L43,-150Z";
const H_CUFF = "M-77,-176Q-40,-186 0,-192Q40,-186 77,-176L54,-82Q0,-70 -54,-82Z";
const H_BACK = "M-53,-58Q0,-67 53,-58L59,-13Q0,-4 -59,-13Z";
const H_THUMB = "M52,-46C80,-42 92,-2 76,26C68,38 50,35 50,22C56,10 58,-6 48,-24Z";
const H_STATIC = {
  fore: hatchD(6, -900, 50, -150, 96, 2.8, 71, 0.2),
  fore2: hatchD(26, -900, 50, -150, 58, 3.4, 72, 0.2),
  fore3: hatchD(-50, -900, -38, -150, 84, 3.2, 70, 0.3),
  back: hatchD(10, -66, 60, -4, 103, 2.8, 73),
  back2: hatchD(34, -66, 60, -4, 56, 3.4, 74),
  cuff: hatchD(12, -192, 78, -70, 102, 2.8, 75),
  cuff2: hatchD(40, -192, 78, -70, 55, 3.4, 76),
  cuff3: hatchD(-78, -170, -58, -80, 78, 3.2, 69, 0.3),
  thumb: hatchD(64, -46, 92, 36, 100, 2.6, 84, 0.15),
  lames: [0, 1, 2].map((j) => hatchD(14, -96 + j * 11.5, 52, -78 + j * 11.5, 98, 2.8, 79 + j, 0.15)),
  bar: hatchD(-BAR_W / 2, 18, BAR_W / 2, 26, 100, 4, 77, 0.2),
};
export const RansomHand: React.FC<{ at: P2; grip?: number; dip?: number; tone?: number; uid?: string }> = ({ at, grip = 1, dip = 0, tone = 1, uid = "rv2h" }) => {
  const S = HAND_S;
  const sc = `scale(${S})`;
  const open = clamp01(1 - grip);
  const half = BAR_W / 2;
  const ext = 40 * open; // the fingers uncurl: they hang this much longer (hand units)
  const fingers = [0, 1, 2, 3].map((j) => {
    const x0 = -59.5 + j * 29.8;
    const w = 28.8 - 7 * open;
    const xx = x0 + 3.5 * open;
    const b = 18 + ext;
    const lames: string[] = [];
    for (let yy = 0; yy < b + 4; yy += 10) lames.push(`M${f1(xx)},${f1(yy)}Q${f1(xx + w / 2)},${f1(yy + 4.4)} ${f1(xx + w)},${f1(yy)}`);
    return {
      x0,
      w: 28.8,
      turn: (j - 1.5) * 10 * open,
      d: `M${f1(xx)},-11L${f1(xx + w)},-11L${f1(xx + w)},${f1(b)}Q${f1(xx + w)},${f1(b + 13)} ${f1(xx + w / 2)},${f1(b + 13)}Q${f1(xx)},${f1(b + 13)} ${f1(xx)},${f1(b)}Z`,
      lames: lames.join(""),
      shade: hatchD(xx + w - 10, -9, xx + w - 1.4, b + 9, 95, 2.2, 78 + j, 0.2),
    };
  });
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)})`} opacity={tone}>
      <clipPath id={`${uid}-fore`}>
        <path d={H_FORE} />
      </clipPath>
      <clipPath id={`${uid}-cuff`}>
        <path d={H_CUFF} />
      </clipPath>
      <clipPath id={`${uid}-back`}>
        <path d={H_BACK} />
      </clipPath>
      <clipPath id={`${uid}-thumb`}>
        <path d={H_THUMB} />
      </clipPath>
      <g transform={sc}>
        {/* the vambrace, up and out of the picture */}
        <path d={H_FORE} fill={INK} {...OUT} />
        <g clipPath={`url(#${uid}-fore)`}>
          <path d={H_STATIC.fore} {...ln(0.9, 0.62)} />
          <path d={H_STATIC.fore2} {...ln(0.85, 0.5)} />
          <path d={H_STATIC.fore3} {...ln(0.85, 0.4)} />
          <path d="M-14,-900L-12,-150" {...ln(1.3, 0.7)} />
          {[-250, -330, -410, -490, -570, -650, -730, -810].map((yy) => (
            <path key={yy} d={`M-52,${yy}Q0,${yy + 11} 52,${yy}`} {...ln(1.3, 0.75)} />
          ))}
        </g>
        {/* the wrist lames, the back of the hand */}
        {[0, 1, 2].map((j) => {
          const y0 = -90 + j * 11.5;
          return (
            <g key={j}>
              <path d={`M-52,${y0}Q0,${y0 - 9} 52,${y0}L53,${y0 + 14}Q0,${y0 + 5} -53,${y0 + 14}Z`} fill={j === 1 ? C_DEEP : INK} {...OUT} strokeWidth={1.9} />
              <path d={H_STATIC.lames[j]} {...ln(0.8, 0.55)} />
            </g>
          );
        })}
        <path d={H_BACK} fill={INK} {...OUT} />
        <g clipPath={`url(#${uid}-back)`}>
          <path d={H_STATIC.back} {...ln(0.9, 0.62)} />
          <path d={H_STATIC.back2} {...ln(0.85, 0.5)} />
          <path d="M-30,-60L-38,-10M0,-63L0,-8M30,-60L38,-10" {...ln(1.2, 0.6)} />
          <path d="M-57,-22Q0,-13 57,-22" {...ln(1.2, 0.6)} />
        </g>
        {/* the cuff, flaring toward the elbow */}
        <path d={H_CUFF} fill={INK} {...OUT} />
        <g clipPath={`url(#${uid}-cuff)`}>
          <path d={H_STATIC.cuff} {...ln(0.9, 0.62)} />
          <path d={H_STATIC.cuff2} {...ln(0.85, 0.5)} />
          <path d={H_STATIC.cuff3} {...ln(0.85, 0.4)} />
          <path d="M-74,-163Q-38,-172 0,-178Q38,-172 74,-163M-57,-93Q0,-81 57,-93" {...ln(1.3, 0.8)} />
          <path d="M0,-192L0,-80" {...ln(1.2, 0.6)} />
        </g>
        {[-60, -32, 32, 60].map((cx) => (
          <circle key={cx} cx={cx} cy={-169.5 - (1 - Math.abs(cx) / 77) * 11} r={2.5} fill={DARK} opacity={0.8} />
        ))}
      </g>
      {/* the dark of the half-open hand behind the bar */}
      {open > 0.02 ? <path d={`M${-58 * S},${-10 * S}L${58 * S},${-10 * S}L${60 * S},${(10 + ext) * S}L${-60 * S},${(10 + ext) * S}Z`} fill={DARK} opacity={0.82 * Math.min(1, open * 4)} /> : null}
      {/* the cross-bar: it dips as the grip loosens */}
      <g transform={`translate(0 ${dip.toFixed(2)})`}>
        <path d={`M${-half},2L${half},2L${half + 3},14L${half},26L${-half},26L${-half - 3},14Z`} fill={C_DEEP} {...OUT} />
        <path d={`M${-half + 8},8Q${-half * 0.4},5.5 0,8T${half - 8},7.5M${-half + 14},13.5Q${-half * 0.5},16 ${-half * 0.1},13T${half - 10},14M${-half + 6},19Q0,21 ${half - 6},19`} {...ln(0.95, 0.6)} />
        <path d={H_STATIC.bar} {...ln(0.85, 0.5)} />
        {[-1, 1].map((sg) => (
          <path key={sg} d={[-3.4, 0, 3.4].map((o) => `M${sg * (half - 12) + o},1L${sg * (half - 12) + o},27`).join("")} {...ln(1.5, 0.9)} />
        ))}
      </g>
      <g transform={sc}>
        <g transform={`rotate(${(-34 * open).toFixed(2)} 54 -44)`}>
          <path d={H_THUMB} fill={C_DEEP} {...OUT} strokeWidth={2} />
          <g clipPath={`url(#${uid}-thumb)`}>
            <path d={H_STATIC.thumb} {...ln(0.8, 0.6)} />
            <path d="M52,-22Q68,-26 84,-16M54,2Q70,0 86,8" {...ln(1.1, 0.75)} />
          </g>
        </g>
        {fingers.map((f, j) => (
          <g key={j} transform={`rotate(${f.turn.toFixed(2)} ${f1(f.x0 + f.w / 2)} -14)`}>
            <path d={f.d} fill={INK} {...OUT} strokeWidth={2} />
            <path d={f.lames} {...ln(1.05, 0.75)} />
            <path d={f.shade} {...ln(0.8, 0.6)} />
          </g>
        ))}
        {fingers.map((f, j) => (
          <g key={j}>
            <path d={`M${f.x0 + 1},-9Q${f.x0 + f.w / 2},-27 ${f.x0 + f.w - 1},-9Z`} fill={INK} {...OUT} strokeWidth={1.9} />
            <path d={`M${f.x0 + f.w * 0.55},-17.4q5,2 6.6,7.6M${f.x0 + f.w * 0.7},-13.6q2.6,1.6 3.2,4`} {...ln(0.8, 0.55)} />
          </g>
        ))}
      </g>
    </g>
  );
};
/** where the three strings leave the bar (WORLD px): under its middle and 12 px inside each end */
export const barAnchors = (at: P2, dip = 0) => ({
  c: [at[0], at[1] + 25 + dip] as P2,
  l: [at[0] - (BAR_W / 2 - 12), at[1] + 25 + dip] as P2,
  r: [at[0] + (BAR_W / 2 - 12), at[1] + 25 + dip] as P2,
});

// ---------------------------------------------------------------------------
// SCENES
// ---------------------------------------------------------------------------
export type HoldString = { slack: number; sag?: number; side?: number };
export type RansomScene = {
  emperor: EmperorPose;
  /** his feet (WORLD px) */
  at: P2;
  /** the chalk line's progress from his hand, left and right (0 = none) */
  line: { l: number; r: number };
  /** the bank: null = none, "full", or each piece's arrival 0..1 */
  bank: null | "full" | ((p: BankPiece, i: number) => number);
  /** the captor: grip 1 = closed on the bar, 0.5 = half open; dip = the bar's drop (world px) */
  hand: { at: P2; grip: number; dip: number };
  /** the three orange strings (bar -> his head, his left forearm, his right forearm): slack 0 = taut */
  strings: { head: HoldString; l: HoldString; r: HoldString };
};
/** where the captor's side strings tie: on his forearms (as in ReachingOutToHisPeople), and his head-top; WORLD px */
export const holdAnchors = (pose: EmperorPose, at: P2) => {
  const r = emperorRig(pose, "inca");
  const w = (v: P2): P2 => [at[0] + v[0], at[1] + v[1]];
  const tie = (arm: { E: P2; W: P2 }): P2 => w([mix(arm.E[0], arm.W[0], 0.42), mix(arm.E[1], arm.W[1], 0.42)]);
  return { head: w(r.headTop), l: tie(r.armL), r: tie(r.armR) };
};
export const holdStrings = (sc: RansomScene): { head: StringGeom; l: StringGeom; r: StringGeom } => {
  const a = holdAnchors(sc.emperor, sc.at);
  const b = barAnchors(sc.hand.at, sc.hand.dip);
  const g = (from: P2, to: P2, s: HoldString, side: number): StringGeom => ({ from, to, slack: s.slack, sag: s.sag ?? 0.17, side: s.side ?? side });
  return { head: g(b.c, a.head, sc.strings.head, 1), l: g(b.l, a.l, sc.strings.l, -1), r: g(b.r, a.r, sc.strings.r, 1) };
};
const CASE_ID = "rv2-case";
/** a whole state of the room under `cam`: wall, chalk line, bank, Atahualpa (cased in dark once the bank is behind him), strings, hand */
export const RansomTableau: React.FC<{ scene: RansomScene; cam: Cam; frame?: number; uid?: string }> = ({ scene, cam, frame = 0, uid = "rv2" }) => {
  const st = holdStrings(scene);
  const hasBank = scene.bank !== null;
  const rise = typeof scene.bank === "function" ? scene.bank : undefined;
  const cased = hasBank ? (rise ? clamp01(rise(BANK[0], 0) * 2) : 1) : 0;
  const strings: [StringGeom, HoldString, number][] = [
    [st.head, scene.strings.head, 7],
    [st.l, scene.strings.l, 8],
    [st.r, scene.strings.r, 9],
  ];
  return (
    <WorldSvg cam={cam}>
      <defs>
        <filter id={`${uid}-${CASE_ID}`} x="-40%" y="-25%" width="180%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius={5.5} result="fat" />
          <feFlood floodColor={DARK} floodOpacity={0.92 * cased} />
          <feComposite in2="fat" operator="in" result="case" />
          <feMerge>
            <feMergeNode in="case" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <RansomWall />
      <ChalkLine l={scene.line.l} r={scene.line.r} />
      {hasBank ? <Bank rise={rise} shadeX={scene.at[0]} /> : null}
      <g filter={cased > 0.01 ? `url(#${uid}-${CASE_ID})` : undefined}>
        <Emperor pose={scene.emperor} variant="inca" at={scene.at} tone={1} uid={`${uid}-e`} />
      </g>
      {strings.map(([g, s, i]) => (
        <PuppetString key={i} {...g} base={1} live={[0, 1]} highlight={s.slack < 0.1 ? glintAt(frame, i) : null} k={cam.k} />
      ))}
      <RansomHand at={scene.hand.at} grip={scene.hand.grip} dip={scene.hand.dip} uid={`${uid}-h`} />
    </WorldSvg>
  );
};

const TAUT: HoldString = { slack: 0 };
/** the MAIN framing's picture: he stands by the full bank, the line drawn, the hold still taut */
export const RANSOM_MAIN: RansomScene = {
  emperor: POSE_REST,
  at: [ROOM.standX, ROOM.floor],
  line: { l: 1, r: 1 },
  bank: "full",
  hand: { at: ROOM.hand, grip: 1, dip: 0 },
  strings: { head: TAUT, l: TAUT, r: TAUT },
};
/** the END state's values: the grip half open, the bar dipped, the three strings deep in slack */
export const END_GRIP = 0.5;
export const END_DIP = 14;
export const END_SLACK = 0.5;
export const END_SAG = 0.46;
/** the END state as a living hold: the slack strings sway slowly (f = any frame; FillThatRoomV2's last frame is f 189) */
export const ransomEndScene = (f: number): RansomScene => ({
  emperor: { ...POSE_REST, head: 0.7 * Math.sin(f / 23) },
  at: [ROOM.standX, ROOM.floor],
  line: { l: 1, r: 1 },
  bank: "full",
  hand: { at: ROOM.hand, grip: END_GRIP, dip: END_DIP },
  strings: {
    head: { slack: END_SLACK, sag: END_SAG * (1 + 0.1 * Math.sin(f / 11)), side: 1 + 0.3 * Math.sin(f / 13) },
    l: { slack: END_SLACK, sag: END_SAG * (1 + 0.1 * Math.sin(f / 10 + 1.7)), side: -(1 + 0.3 * Math.sin(f / 12.5 + 2.3)) },
    r: { slack: END_SLACK, sag: END_SAG * (1 + 0.1 * Math.sin(f / 9.5 + 3.1)), side: 1 + 0.3 * Math.sin(f / 14 + 4) },
  },
});
export const RANSOM_END: RansomScene = ransomEndScene(189);

// ---------------------------------------------------------------------------
// CAMERAS (plain Cam: k and the world point at the frame's middle)
// ---------------------------------------------------------------------------
/** the MAIN framing: k 1.55, the floor at screen y 1130, Atahualpa at screen x ~380 */
export const CAM_RANSOM_MAIN: Cam = { k: 1.55, cx: 540, cy: ROOM.floor - (1130 - 960) / 1.55 };
/** the END framing (before the hold's creep): the gauntlet in the upper third, his head and shoulders at the bottom */
export const CAM_RANSOM_END: Cam = { k: 1.7, cx: 478, cy: ROOM.hand[1] + (960 - 640) / 1.7 };
/** the living hold's creep (<= 2 %): the zoom's factor at frame f (1 until f 150) */
export const endCreep = (f: number) => Math.exp(0.02 * smoothstep((f - 150) / 60));
/** the END camera at frame f (f >= 172), creep and the house sway included: FillThatRoomV2's own camera from f 172 on */
export const ransomEndCam = (f: number): Cam => swayCam({ ...CAM_RANSOM_END, k: CAM_RANSOM_END.k * endCreep(f) }, f);
/** the frame the label's slide-up starts in FillThatRoomV2 (it is fully in long before the end) */
export const PIZARRO_F0 = 138;
/** the PIZARRO label: IM Fell SC 44 px, world anchor beside the cuff */
export const PIZARRO = { text: "PIZARRO", x: 664, y: 590, size: 44 };
export const PizarroLabel: React.FC<{ cam: Cam; frame: number; f0?: number }> = ({ cam, frame, f0 = PIZARRO_F0 }) => <Label text={PIZARRO.text} x={PIZARRO.x} y={PIZARRO.y} cam={cam} frame={frame} f0={f0} size={PIZARRO.size} />;
