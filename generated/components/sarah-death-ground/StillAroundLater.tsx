// ---------------------------------------------------------------------------
// StillAroundLater (file 99_StillAroundLater; Sarah Paine, "Death ground: why
// regime change is brutal"). Dwarkesh map style, the non-map umber page; the
// cast is dgFigures (Warring States China), imported read-only. Opaque
// 1080x1920, 24 fps.
//
// CHECK LINE: "After a limited war the defeated king is still there across the
// table - you have to deal with him - and his army can grow back behind him."
//
// THE LINE: "A limited war is something less. And it means that the defeated
// government is going to be around. You're going to be negotiating with them,
// whether you like it or not. And they may come back to cause you problems later."
// WORD -> FRAME: A 6 · limited 9 · war 15 · is 24 · something 31 · less 40 ·
//   And 55 · it 63 · means 66 · that 74 · the 78 · defeated 80 · government 88 ·
//   is 95 · going 99 · to 101 · be 102 · around 104 · You're 113 · going 116 ·
//   negotiating 120 · with 133 · them 138 · whether 146 · you 148 · like 150 ·
//   it 156 · or 158 · not 161 · And 170 · they 175 · may 186 · come 190 ·
//   back 195 · to 199 · cause 203 · you 209 · problems 213 · later 221.
// DURATION: the sequence runs 99.250-109.042 s = 9.792 s x 24 = 235 frames
//   (f0..f234); it is the last shot of the clip.
//
// THE MOTION (one move): a peace table in side elevation on an engraved ground
// plane (rush mats, receding hatching), a ridge behind. Frame 0 is close on the
// hands: the CREAM general (the victor) sits upright, two cream guards standing
// behind him with their ge, his straight arm's fingers on the bamboo-slip
// treaty's roll; across the table the ORANGE king kneels, head bowed. A flick and
// the treaty rolls open between them while the camera pulls back in one move,
// revealing the crowned king on his own mat and his government still in place
// behind him (a kneeling minister, a standing courtier, his standard); on
// "around" the king lifts his head. A slow push in on the exchange: the general
// points at the terms, the king answers with his own open hand, the general sits
// back stiffly. Then the camera drifts right and up (the victor and a guard kept
// in the left third): orange standards rise over the crest, orange ranks march up
// over it onto the near slope, and on "problems later" the front ranks level
// their ge toward the general's side while the king turns his head to him.
// No text. Orange = the king and his side; cream = the victor.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DARK, LAND, hash, mixColor, pchip, smootherstep } from "../kits/maps/incaShared";
import {
  Banner,
  CREAM,
  General,
  King,
  LowTable,
  Minister,
  ORANGE,
  POSES,
  Soldier,
  TABLE,
  aimWeapon,
  dgAnchors,
  idle,
  lerpFig,
  poseTrack,
  track,
  type FigPose,
  type Ink,
} from "./dgFigures";
import { TexcocoPage, WorldSvg, makeCamera, walkPose, type P2 } from "../kits/maps/texcocoShared";

export const FPS = 24;
export const DURATION = 235;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const rad = (d: number) => (d * Math.PI) / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------------------
// LAYOUT (world px). The court floor is the near ground line; the ground
// recedes up the page to a ridge whose crest hides the land behind the king.
// ---------------------------------------------------------------------------
const FLOOR = 1300;
/** px per figure unit of the two parties (seated ~450 px to the head, ~500 to the crown) */
const S_GEN = 2.0;
const S_KING = 2.0;
const S_MIN = 1.9;
/** where the parties kneel (their feet, world px) */
const GEN_AT: P2 = [286, FLOOR - 3];
/** the victor's guards: two CREAM soldiers standing behind him, ge upright (the armed side stands, the defeated kneel) */
const GUARDS: { at: P2; s: number; seed: number }[] = [
  { at: [132, FLOOR - 72], s: 1.76, seed: 5 },
  { at: [214, FLOOR - 40], s: 1.84, seed: 2 },
];
const KING_AT: P2 = [832, FLOOR - 3];
const MIN_AT: P2 = [1062, FLOOR - 12];
/** a standing courtier behind the king and the minister (a little further back): the government still in place */
const COURTIER_AT: P2 = [998, FLOOR - 70];
const S_COURT = 1.48;
/** the low table: the middle of its front edge on the floor */
const TABLE_AT: P2 = [540, FLOOR];
const S_TABLE = 2.0;
/** the table's wood: a darker cream, so the cream treaty reads on it */
const WOOD: Ink = { main: mixColor(CREAM.hair, LAND, 0.12), deep: mixColor(CREAM.hair, LAND, 0.4), hair: mixColor(CREAM.hair, DARK, 0.3) };
/** the table's top surface (seen a little from above): its front and back edges */
const TOP_FRONT = FLOOR - TABLE.h * S_TABLE;
const TOP_BACK = TOP_FRONT - TABLE.depth * S_TABLE;
/** the treaty lying on the table top: slips running into the page, the roll seen end-on */
const TR_X0 = 384;
const SLIP_W = 15;
const TR_SLIPS = 19;
const TR_NEAR = TOP_FRONT - 3;
const TR_FAR = TOP_BACK + 5;
const ROLL_R0 = 19;
const ROLL_R1 = 7.5;
/** the king's standard, planted behind his court */
const KB_SCALE = 0.8;
const KB_BASE: P2 = [1124, FLOOR - 150];
/** the ground plane: its rows converge on the ridge's foot (y = PLANE_H); depth scale s = 1 at the court's floor line */
const PLANE_H = 730;
const planeY = (s: number) => PLANE_H + (FLOOR - PLANE_H) * s;
/** the vanishing x of the plane (the mats' sides converge on it a little) */
const PLANE_VX = 700;

/** the ridge's crest (world y at x), a slow undulation */
const CREST_KEYS: [number, number][] = [
  [-700, 583],
  [-300, 577],
  [100, 591],
  [500, 609],
  [800, 615],
  [1050, 603],
  [1300, 611],
  [1550, 597],
  [1800, 605],
  [2100, 619],
  [2600, 631],
];
const crestFn = pchip(CREST_KEYS);
const crestY = (x: number) => crestFn(x);

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
/** the treaty: the general's fingers are on the roll from f0, his arm straight; a flick of the hand (PUSH_START..RELEASE,
 *  the roll speeding up under it) sends it rolling on alone at the speed he gave it, slowing to rest. Integrated. */
const PUSH_START = 3;
const RELEASE = 11;
const OPEN0 = 0.075;
/** px the treaty is long when fully open */
const SCROLL_LEN_PX = TR_SLIPS * SLIP_W;
const ROLL_V = 6.5;
const ROLL_STOP = RELEASE + (2 * ((1 - OPEN0) * SCROLL_LEN_PX - (ROLL_V * (RELEASE - PUSH_START)) / 2)) / ROLL_V;
const sstep = (u: number) => {
  const x = c01(u);
  return x * x * (3 - 2 * x);
};
const rollV = (f: number) =>
  f < RELEASE ? ROLL_V * sstep((f - PUSH_START) / (RELEASE - PUSH_START)) : ROLL_V * (1 - sstep((f - RELEASE) / (ROLL_STOP - RELEASE)));
const OPEN_TABLE = (() => {
  const out: number[] = [OPEN0];
  let x = 0;
  const SUB = 8;
  for (let i = 1; i <= (DURATION + 1) * SUB; i++) {
    const f = i / SUB;
    x += ((rollV(f - 1 / SUB) + rollV(f)) / 2) * (1 / SUB);
    if (i % SUB === 0) out.push(Math.min(1, OPEN0 + x / SCROLL_LEN_PX));
  }
  return out;
})();
const scrollOpen = (f: number) => {
  const x = Math.max(0, Math.min(OPEN_TABLE.length - 1.001, f));
  const i = Math.floor(x);
  return OPEN_TABLE[i] + (OPEN_TABLE[i + 1] - OPEN_TABLE[i]) * (x - i);
};

// ---------------------------------------------------------------------------
// THE CAMERA: close on the hands and the treaty, one continuous pull-back that
// reveals the king and then his court behind him (f0-110), a slow push in on the
// exchange, then a drift right and up over the king to the ridge behind him.
// Every key holds the table top (world y 1182) at a screen y.
// ---------------------------------------------------------------------------
const TT = TOP_FRONT - 22;
const camAt = makeCamera([
  { f: 0, k: 1.55, wx: 560, wy: TT, sx: 540, sy: 1000 },
  { f: 35, k: 1.23, wx: 590, wy: TT, sx: 540, sy: 992 },
  { f: 70, k: 1.02, wx: 618, wy: TT, sx: 540, sy: 982 },
  { f: 110, k: 0.86, wx: 640, wy: TT, sx: 540, sy: 978 },
  { f: 140, k: 0.875, wx: 656, wy: TT, sx: 540, sy: 985 },
  { f: 164, k: 0.88, wx: 682, wy: TT, sx: 540, sy: 996 },
  { f: 195, k: 0.858, wx: 742, wy: TT, sx: 540, sy: 1078 },
  { f: 226, k: 0.832, wx: 790, wy: TT, sx: 540, sy: 1128 },
  { f: 234, k: 0.829, wx: 793, wy: TT, sx: 540, sy: 1131 },
]);

// ---------------------------------------------------------------------------
// THE ENGRAVER'S HAND (FourForOne's)
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
const lnC = (w = 1.2, a = 0.8, col = CREAM.main) => ({ fill: "none", stroke: col, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => {
  const dx = Math.cos(rad(ang));
  const dy = Math.sin(rad(ang));
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
    d += `M${P([px + dx * t0, py + dy * t0])}L${P([px + dx * t1, py + dy * t1])}`;
  }
  return d;
};
const Cased: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 1.6, children }) => (
  <>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="fat" />
      <feGaussianBlur in="fat" stdDeviation={r * 0.45} result="soft" />
      <feFlood floodColor={DARK} floodOpacity={0.62} />
      <feComposite in2="soft" operator="in" result="case" />
      <feMerge>
        <feMergeNode in="case" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <g filter={`url(#${id})`}>{children}</g>
  </>
);
const rectD = (x0: number, y0: number, x1: number, y1: number) => `M${x0.toFixed(1)},${y0.toFixed(1)}H${x1.toFixed(1)}V${y1.toFixed(1)}H${x0.toFixed(1)}Z`;

// ---------------------------------------------------------------------------
// THE LAND: the court floor, the ground receding to the ridge, the ridge's
// crest with its hatched near face, a faint far range behind it
// ---------------------------------------------------------------------------
const X_LO = -700;
const X_HI = 2700;
const crestPts = (() => {
  const pts: P2[] = [];
  for (let x = X_LO; x <= X_HI; x += 20) pts.push([x, crestY(x)]);
  return pts;
})();
const CREST_D = `M${crestPts.map(P).join("L")}`;
/** the region above the crest (the land behind it hides whatever stands lower) */
const ABOVE_CREST_D = `${CREST_D}L${X_HI},-2000L${X_LO},-2000Z`;
const FAR_RANGE_D = (() => {
  let d = "";
  for (let x = X_LO; x <= X_HI; x += 24) {
    const y = 610 - 40 * Math.sin(x / 410 + 0.6) - 20 * Math.sin(x / 167 + 2.1) - 9 * Math.sin(x / 71);
    d += `${x === X_LO ? "M" : "L"}${x},${y.toFixed(1)}`;
  }
  return d;
})();
/** the ground plane: engraved rows of broken strokes in true perspective (rows bunch up toward the ridge's foot and
 *  spread toward us), split into bands by depth so near rows are cut heavier. Quiet texture: it runs under everything. */
const PLANE_BANDS = (() => {
  const bands = { far: "", mid: "", near: "" };
  let lastY = -1e9;
  let r = 0;
  for (let z = 2.6; z >= 0.24; z -= 0.032, r++) {
    const sDepth = 1 / z;
    const y0 = planeY(sDepth);
    if (y0 - lastY < 6.5) continue;
    lastY = y0;
    const key = sDepth < 0.8 ? "far" : sDepth < 1.6 ? "mid" : "near";
    let x = X_LO + 120 * hash(r, 301);
    let i = 0;
    while (x < X_HI) {
      const len = (24 + 120 * hash(i, 302 + r)) * Math.min(2.4, sDepth);
      const y = y0 + (hash(i, 303 + r) - 0.5) * 2.4 * sDepth;
      const tilt = (hash(i, 305 + r) - 0.5) * 1.6 * sDepth;
      bands[key] += `M${x.toFixed(1)},${y.toFixed(1)}l${len.toFixed(1)},${tilt.toFixed(1)}`;
      x += len + (14 + 70 * hash(i, 304 + r)) * Math.min(2.4, sDepth);
      i++;
    }
  }
  return bands;
})();
/** the shade under the table: close hatching on the floor between its legs */
const TABLE_SHADE_D = (() => {
  let d = "";
  let i = 0;
  for (let y = FLOOR - TABLE.depth * S_TABLE + 4; y < FLOOR + 10; y += 4.2, i++) {
    const inset = 12 + 10 * hash(i, 321);
    d += `M${(TABLE_AT[0] - 160 + inset).toFixed(1)},${y.toFixed(1)}H${(TABLE_AT[0] + 160 - inset * 0.6).toFixed(1)}`;
  }
  return d;
})();
/** a few marks of the earth (small stones, tufts), scattered on the plane, larger toward us */
const EARTH_D = (() => {
  let d = "";
  for (let i = 0; i < 420; i++) {
    const sd = 0.45 + 2.3 * hash(i, 341) ** 1.6;
    const x = X_LO + (X_HI - X_LO) * hash(i, 342);
    const y = planeY(sd);
    const w = (3 + 5 * hash(i, 343)) * sd;
    d += hash(i, 344) < 0.55 ? `M${(x - w).toFixed(1)},${y.toFixed(1)}q${w.toFixed(1)},${(-w * 0.9).toFixed(1)} ${(2 * w).toFixed(1)},0` : `M${x.toFixed(1)},${y.toFixed(1)}l${(w * 0.3).toFixed(1)},${(-w).toFixed(1)}M${(x + w * 0.7).toFixed(1)},${y.toFixed(1)}l${(w * 0.1).toFixed(1)},${(-w * 1.2).toFixed(1)}M${(x + w * 1.3).toFixed(1)},${y.toFixed(1)}l${(-w * 0.2).toFixed(1)},${(-w * 0.9).toFixed(1)}`;
  }
  return d;
})();
const GroundPlane: React.FC = () => (
  <g>
    <path d={EARTH_D} {...lnC(1.6, 0.2)} />
    <path d={PLANE_BANDS.far} {...lnC(1.5, 0.2)} />
    <path d={PLANE_BANDS.mid} {...lnC(2, 0.24)} />
    <path d={PLANE_BANDS.near} {...lnC(2.6, 0.2)} />
  </g>
);
/** the near face of the ridge: contour dashes following the crest, close together under it and spreading down the slope */
const SLOPE_ROWS = [8, 15, 23, 32, 43, 56, 72, 92];
const slopeRowsD = (rows: number[], seed: number) => {
  let d = "";
  rows.forEach((off, r) => {
    let x = X_LO + 40 * hash(r, seed);
    let i = 0;
    while (x < X_HI) {
      const len = 14 + 46 * hash(i, seed + 1 + r) * (1 - r * 0.06);
      const pts: P2[] = [];
      for (let t = 0; t <= 1.001; t += 0.25) pts.push([x + len * t, crestY(x + len * t) + off + (hash(i, seed + 20 + r) - 0.5) * 2]);
      d += `M${pts.map(P).join("L")}`;
      x += len + (8 + 40 * hash(i, seed + 40 + r)) * (1 + r * 0.45);
      i++;
    }
  });
  return d;
};
const SLOPE_HATCH_D = slopeRowsD(SLOPE_ROWS.slice(0, 5), 401);
const SLOPE_HATCH2_D = slopeRowsD(SLOPE_ROWS.slice(5), 431);
/** the land below a line, as a plane a shade lighter than the page (the page's mottle shows through) */
const belowD = (d: string) => `${d}L${X_HI},2600L${X_LO},2600Z`;
const Land: React.FC = () => (
  <g>
    {/* the far range: a faint plane and its edge */}
    <path d={belowD(FAR_RANGE_D)} fill={CREAM.main} fillOpacity={0.035} />
    <path d={FAR_RANGE_D} {...lnC(2.2, 0.26)} />
    {/* the near ridge: a lighter plane under the crest */}
    <path d={belowD(CREST_D)} fill={CREAM.main} fillOpacity={0.055} />
    {/* the ridge's near face */}
    <path d={SLOPE_HATCH_D} {...lnC(2.2, 0.36)} />
    <path d={SLOPE_HATCH2_D} {...lnC(1.8, 0.22)} />
  </g>
);
/** the crest itself: a firm cream line on a dark casing (drawn over whatever stands behind it) */
const CrestLine: React.FC = () => (
  <g>
    <path d={CREST_D} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={9} strokeLinejoin="round" />
    <path d={CREST_D} {...lnC(4, 0.88)} />
  </g>
);

// ---------------------------------------------------------------------------
// THE MATS: woven rush mats lying on the ground plane (corners in plane x at
// depth s; their sides converge a little on the plane's vanishing x)
// ---------------------------------------------------------------------------
const matPt = (x: number, sd: number): P2 => [PLANE_VX + (x - PLANE_VX) * sd, planeY(sd)];
const Mat: React.FC<{ x0: number; x1: number; s0: number; s1: number; uid: string; ink: Ink }> = ({ x0, x1, s0, s1, uid, ink }) => {
  const at = (u: number, v: number) => matPt(x0 + (x1 - x0) * u, s0 + (s1 - s0) * v);
  const quad = (e: number) => `M${P(at(e, e * 1.6))}L${P(at(1 - e, e * 1.6))}L${P(at(1 - e, 1 - e * 1.6))}L${P(at(e, 1 - e * 1.6))}Z`;
  const n = Math.round((x1 - x0) / 11);
  let weave = "";
  for (let i = 1; i < n; i++) weave += `M${P(at(i / n, 0.07))}L${P(at(i / n, 0.93))}`;
  let rows = "";
  for (let j = 1; j < 6; j++) rows += `M${P(at(0.04, j / 6))}L${P(at(0.96, j / 6))}`;
  return (
    <Cased id={`${uid}-c`} r={1.3}>
      <clipPath id={`${uid}-k`}>
        <path d={quad(0)} />
      </clipPath>
      <path d={quad(0)} fill={ink.deep} {...OUT} strokeWidth={2.2} />
      <g clipPath={`url(#${uid}-k)`}>
        <path d={weave} {...ln(1.05, 0.42)} />
        <path d={rows} {...ln(0.9, 0.22)} />
        {/* the bound edge */}
        <path d={quad(0.035)} fill="none" stroke={ink.hair} strokeWidth={5} strokeOpacity={0.75} />
        <path d={quad(0.035)} {...ln(1.1, 0.6)} />
      </g>
    </Cased>
  );
};

// ---------------------------------------------------------------------------
// THE TREATY lying on the table top (seen a little from above): bamboo slips
// running into the page, bound by two cords, faint columns of marks; the roll
// at its right end seen END-ON (a spiral) rolls right and thins as it opens
// ---------------------------------------------------------------------------
const rollGeom = (open: number) => {
  const o = c01(open);
  const r = Math.sqrt(ROLL_R1 * ROLL_R1 + (1 - o) * (ROLL_R0 * ROLL_R0 - ROLL_R1 * ROLL_R1));
  const edge = TR_X0 + o * SCROLL_LEN_PX;
  return { r, x: edge + r * 0.9, edge };
};
/** how far the spiral has turned (deg): the slips laid down over the radius, integrated */
const rollTurn = (open: number) => {
  const N = 48;
  let a = 0;
  for (let i = 0; i < N; i++) {
    const o0 = OPEN0 + ((open - OPEN0) * i) / N;
    const o1 = OPEN0 + ((open - OPEN0) * (i + 1)) / N;
    a += ((o1 - o0) * SCROLL_LEN_PX) / ((rollGeom(o0).r + rollGeom(o1).r) / 2);
  }
  return (a * 180) / Math.PI;
};
const CORD = mixColor(CREAM.hair, DARK, 0.35);
const Treaty: React.FC<{ open: number }> = ({ open }) => {
  const { r, x: xr, edge } = rollGeom(open);
  const yN = TR_NEAR;
  const yF = TR_FAR;
  const cordY = [yF + (yN - yF) * 0.3, yF + (yN - yF) * 0.72];
  const flat = rectD(TR_X0, yF, edge, yN);
  let slips = "";
  let marks = "";
  for (let k = 0; TR_X0 + k * SLIP_W < edge - 1; k++) {
    const x = TR_X0 + k * SLIP_W;
    if (k > 0) slips += `M${x.toFixed(1)},${yF + 1}V${yN - 1}`;
    const cx = x + SLIP_W / 2;
    [yF + 4, cordY[0] + 4, cordY[1] + 3].forEach((y0, j) => {
      if (hash(k * 3 + j, 501) < 0.22) return;
      marks += `M${cx.toFixed(1)},${(y0 + hash(k * 3 + j, 502) * 1.5).toFixed(1)}v${(2.6 + 2.2 * hash(k, j + 7)).toFixed(1)}`;
    });
  }
  const turn = rad(rollTurn(open));
  let spiral = "";
  for (let i = 0; i <= 72; i++) {
    const t = i / 72;
    const rr = r * (0.16 + 0.76 * t);
    const a = turn + t * Math.PI * 2 * 2.4;
    spiral += `${i === 0 ? "M" : "L"}${(xr + rr * Math.cos(a)).toFixed(2)},${(yN - r + rr * Math.sin(a)).toFixed(2)}`;
  }
  const body = `M${(xr - r).toFixed(1)},${(yN - r).toFixed(1)}V${(yF - r).toFixed(1)}A${r.toFixed(1)},${r.toFixed(1)} 0 0 1 ${(xr + r).toFixed(1)},${(yF - r).toFixed(1)}V${(yN - r).toFixed(1)}Z`;
  return (
    <Cased id="sal-treaty" r={1.3}>
      {edge > TR_X0 + 1 ? (
        <>
          <clipPath id="sal-treaty-flat">
            <path d={flat} />
          </clipPath>
          <path d={flat} fill={CREAM.main} {...OUT} strokeWidth={2} />
          <g clipPath="url(#sal-treaty-flat)">
            <path d={slips} {...ln(1.5, 0.78)} />
            <path d={marks} {...ln(1.4, 0.5)} />
            {cordY.map((y, i) => (
              <path key={i} d={`M${TR_X0 - 2},${y.toFixed(1)}H${edge.toFixed(1)}`} stroke={CORD} strokeWidth={2.6} />
            ))}
          </g>
        </>
      ) : null}
      {/* the roll: its body running into the page, the cords round it, its near end a spiral */}
      <clipPath id="sal-treaty-body">
        <path d={body} />
      </clipPath>
      <path d={body} fill={CREAM.deep} {...OUT} strokeWidth={2} />
      <g clipPath="url(#sal-treaty-body)">
        <path d={[-0.55, -0.15, 0.25, 0.62].map((u) => `M${(xr + u * r).toFixed(1)},${(yF - 2 * r).toFixed(1)}V${yN}`).join("")} {...ln(1, 0.45)} />
        <path d={hatchD(xr + r * 0.35, yF - 2 * r, xr + r, yN, 100, 2.6, 511, 0.05)} {...ln(0.9, 0.45)} />
        {cordY.map((y, i) => (
          <path key={i} d={`M${(xr - r).toFixed(1)},${(y - r).toFixed(1)}H${(xr + r).toFixed(1)}`} stroke={CORD} strokeWidth={2.6} />
        ))}
      </g>
      <circle cx={xr} cy={yN - r} r={r} fill={CREAM.main} {...OUT} strokeWidth={2.1} />
      <path d={spiral} {...ln(1.3, 0.75)} />
    </Cased>
  );
};

// ---------------------------------------------------------------------------
// THE PARTIES
// ---------------------------------------------------------------------------
type Arm = "armL" | "armR";
/** the pose with one wrist moved so that hand lands on a world point (the rig clamps it to his reach) */
const reachTo = (kind: "general" | "king", q: FigPose, at: P2, scale: number, target: P2, arm: Arm): FigPose => {
  let p = q;
  for (let i = 0; i < 5; i++) {
    const A = dgAnchors(kind, p, at, scale, { weapon: "none" });
    const hand = arm === "armL" ? A.handL : A.handR;
    const a = p[arm];
    p = { ...p, [arm]: { ...a, w: [a.w[0] + (target[0] - hand[0]) / scale, a.w[1] + (target[1] - hand[1]) / scale] } };
  }
  return p;
};
const SEAT_R = POSES.seated(1);
const SEAT_L = POSES.seated(-1);

// ---- the general (facing right; armL is his near arm): leans in and shoves the roll; sits back;
// points at the terms; draws back, stiff
const genRest: FigPose = { ...SEAT_R, lean: 1, pitch: -2, brow: 0.35 };
/** the flick: sitting up, the near arm straight out to the roll (a few degrees of lean, no bow) */
const genReach: FigPose = { ...SEAT_R, lean: 6, pitch: 4, brow: 0.4 };
const genFlick: FigPose = { ...SEAT_R, lean: 8, pitch: 3, brow: 0.45 };
const genPoint: FigPose = { ...SEAT_R, lean: 5, pitch: 0, brow: 0.55, armL: { w: [112, -128], elbow: [-0.05, 1], fist: 0, hand: -14 } };
const genStiff: FigPose = { ...SEAT_R, lean: -5, pitch: -7, brow: 0.75, mouth: -0.45, headYaw: SEAT_R.headYaw - 0.1, armL: { ...SEAT_R.armL, w: [SEAT_R.armL.w[0] - 4, SEAT_R.armL.w[1] - 2], fist: 0.85 }, armR: { ...SEAT_R.armR, w: [SEAT_R.armR.w[0] - 4, SEAT_R.armR.w[1] - 2], fist: 0.85 } };
const genBody = poseTrack([
  [0, genReach],
  [RELEASE, genFlick],
  [RELEASE + 22, lerpFig(genFlick, genRest, 0.6)],
  [58, genRest],
  [112, genRest],
  [125, genPoint],
  [140, { ...genPoint, lean: 4 }],
  [152, lerpFig(genPoint, genStiff, 0.62)],
  [164, genStiff],
  [234, { ...genStiff, lean: -4 }],
]);
/** the near hand on the roll: 1 = on it (until the release), then it lifts away and goes back to his thigh */
const genOnRoll = track([
  [0, 1],
  [RELEASE, 1],
  [RELEASE + 18, 0],
]);
const contactAt = (f: number): P2 => {
  const g = rollGeom(scrollOpen(Math.min(f, RELEASE)));
  // his fingers against the back of the roll, at its axis (the spiral end stays in view); after the release the hand lifts off
  const lift = c01((f - RELEASE) / 9);
  return [g.x - g.r - 34 + 14 * lift, TR_NEAR - g.r - 9 - 40 * lift];
};
const genPose = (f: number): FigPose => {
  const q = genBody(f);
  const w = genOnRoll(f);
  if (w <= 0.001) return q;
  const on = reachTo("general", { ...q, armL: { ...q.armL, elbow: [-0.15, 1], fist: 0.05, hand: -26 } }, GEN_AT, S_GEN, contactAt(f), "armL");
  return lerpFig(q, { ...q, armL: on.armL }, w);
};

// ---- the king (facing left; armR is his near arm): composed, head a little lowered; answers with his own open hand
const kingRest: FigPose = { ...SEAT_L, lean: -3, pitch: 19, lids: 0.62, brow: -0.1 };
const kingAnswer: FigPose = { ...SEAT_L, pitch: 1, lean: -3, lids: 0.05, brow: 0.2, armR: { w: [-100, -110], elbow: [0.1, 1], fist: 0, hand: 16 } };
/** "is going to be around": he lifts his head and meets the general's eyes */
const kingUp: FigPose = { ...kingRest, lean: 0, pitch: 1, lids: 0.04, brow: 0.15 };
/** "cause you problems later": he turns his head full to the general */
const kingTurn: FigPose = { ...kingUp, lean: -5, headYaw: -1.2, pitch: -6, brow: 0.45 };
const kingBody = poseTrack([
  [0, kingRest],
  [86, kingRest],
  [104, kingUp],
  [131, kingUp],
  [144, kingAnswer],
  [155, { ...kingAnswer, armR: { ...kingAnswer.armR, w: [-96, -114] } }],
  [174, { ...kingUp, pitch: 2 }],
  [206, { ...kingUp, pitch: 1 }],
  [222, kingTurn],
  [234, { ...kingTurn, pitch: -4 }],
]);
const ministerPose: FigPose = { ...POSES.seatedHu(-1), pitch: 11 };

// ---------------------------------------------------------------------------
// THE HOST: ranks rise over the crest (from behind it) and march down onto the
// near slope; standards carried in the second rank rise first
// ---------------------------------------------------------------------------
type Man = { x: number; s: number; t0: number; v: number; rank: number; banner: boolean; seed: number; rise: number; total: number; tHead: number };
/** how tall a man stands (units, to the top of his topknot) */
const HEAD_H = 330;
/** the march: constant speed (world px / frame), easing into the halt over HALT frames */
const MARCH_V = 10.5;
const HALT = 8;
/** how far each man has already walked up the hidden back slope when his head tops the crest */
const HIDDEN_RUN = 520;
/** the standards are held low on a long pole (units from the butt to the fist) */
const STANDARD_GRIP = 118;
/** the host, rank by rank (0 = the nearest): each man is defined by the frame his HEAD tops the crest */
const HOST: Man[] = (() => {
  const men: Man[] = [];
  const ranks = [
    // scale, where he halts below the crest (- = still behind it), files from..to, step, head-over-the-crest frame, standards every n-th file
    { rank: 3, s: 0.65, below: -110, x0: 150, x1: 1700, step: 150, tHead: 183, every: 3 },
    { rank: 2, s: 0.73, below: -40, x0: 170, x1: 1700, step: 124, tHead: 177, every: 0 },
    { rank: 1, s: 0.81, below: 2, x0: 260, x1: 1700, step: 128, tHead: 173, every: 3 },
    { rank: 0, s: 0.9, below: 24, x0: 330, x1: 1700, step: 140, tHead: 170, every: 0 },
  ];
  ranks.forEach((rk) => {
    let i = 0;
    for (let x = rk.x0 + (rk.rank % 2) * rk.step * 0.5; x <= rk.x1; x += rk.step, i++) {
      const xx = x + (hash(i, 600 + rk.rank) - 0.5) * 18;
      // the path: up the back slope until his feet reach the crest (rise), then down the near slope; he halts at rise + below
      const rise = rk.s * HEAD_H + HIDDEN_RUN;
      const total = rise + rk.below;
      const banner = rk.every > 0 && i % rk.every === 1;
      // a sweep from behind the king outward, each man a hair off his neighbours; the standards lead
      const tHead = rk.tHead + Math.abs(xx - 900) / 170 + 2.5 * (hash(i, 610 + rk.rank) - 0.5) - (banner ? 7 : 0);
      const v = MARCH_V * (0.96 + 0.08 * hash(i, 620 + rk.rank));
      const t0 = tHead - HIDDEN_RUN / v;
      men.push({ x: xx, s: rk.s, t0, v, rank: rk.rank, banner, seed: Math.floor(hash(i, 630 + rk.rank) * 12), rise, total, tHead });
    }
  });
  return men;
})();
/** the run time before the halt begins */
const runFrames = (m: Man) => (m.total - (m.v * HALT) / 2) / m.v;
/** the path length covered at frame f (constant speed, then the ease into the halt) */
const manTravel = (m: Man, f: number) => {
  const tRun = runFrames(m);
  const t = f - m.t0;
  if (t < tRun) return m.v * t;
  const u = Math.min(1, (t - tRun) / HALT);
  return m.v * tRun + m.v * HALT * (u - (u * u) / 2);
};
/** his feet: up the hidden back slope to the crest, then down the near slope; walking 1..0 into the halt */
const manState = (m: Man, f: number) => {
  const d = manTravel(m, f);
  const c = crestY(m.x);
  const y = d <= m.rise ? c + (m.rise - d) : c + (d - m.rise);
  const amt = 1 - smootherstep(c01((f - m.t0 - runFrames(m)) / HALT));
  return { y, behind: d < m.rise - 0.01, walking: amt, d };
};
/** marching: three-quarter toward us and to screen left, the ge (or a standard) upright in the near fist */
const MARCH_YAW = -0.74;
const marchBase = (banner: boolean): FigPose =>
  aimWeapon({ ...POSES.carry(-1), yaw: MARCH_YAW, headYaw: MARCH_YAW + 0.05 }, -2, "soldier", banner ? { weapon: "banner", gripAt: STANDARD_GRIP } : { weapon: "ge" });
const MARCH_GE = marchBase(false);
const MARCH_STD = marchBase(true);
/** the walk seen three-quarter: a shorter stride on screen */
const STRIDE = 44 * Math.abs(Math.sin(MARCH_YAW));
/** "cause you problems later": the two front ranks level their ge toward the general's side (screen left), a wave
 *  running from the left; the feet stay planted, the knees give a little */
const LEVELLED: FigPose = { ...POSES.guard(-1), footL: MARCH_GE.footL, footR: MARCH_GE.footR, liftL: MARCH_GE.liftL, liftR: MARCH_GE.liftR, crouch: 9 };
const LEVEL_LEN = 12;
const levelAt = (m: Man) => 199 + (m.x - 300) / 175 + 2 * hash(Math.round(m.x), 640 + m.rank);
const HostMan: React.FC<{ m: Man; f: number }> = ({ m, f }) => {
  const st = manState(m, f);
  const lv = m.rank <= 1 && !m.banner ? sstep((f - levelAt(m)) / LEVEL_LEN) : 0;
  const base = m.banner ? MARCH_STD : lv > 0 ? lerpFig(MARCH_GE, LEVELLED, lv) : MARCH_GE;
  const walked = walkPose(base, (f - m.t0) / 22 + m.seed * 0.17, st.walking, STRIDE);
  const pose = idle({ ...walked, armL: base.armL, armR: base.armR }, f, m.seed, 0.6);
  return (
    <Soldier
      pose={pose}
      at={[m.x, st.y]}
      scale={m.s}
      uid={`sal-h${m.rank}-${Math.round(m.x)}`}
      ink={ORANGE}
      weapon={m.banner ? "banner" : "ge"}
      gripAt={m.banner ? STANDARD_GRIP : undefined}
      wave={f * 0.034 + m.seed * 0.29}
      seed={m.seed}
    />
  );
};

// ---------------------------------------------------------------------------
// THE FRAME
// ---------------------------------------------------------------------------
const StillAroundLater: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const open = scrollOpen(frame);
  const gen = idle(genPose(frame), frame, 1.3, 0.7);
  const king = idle(kingBody(frame), frame, 4.1, 0.8);
  const mini = idle(ministerPose, frame, 7.7, 0.8);
  const states = HOST.map((m) => ({ m, st: manState(m, frame) }));
  // only the men whose top can be above the crest are drawn behind it
  const behind = states.filter(({ m, st }) => st.behind && st.y - 2.2 * HEAD_H * m.s < crestY(m.x)).sort((a, b) => b.m.rank - a.m.rank || a.m.x - b.m.x);
  const front = states.filter(({ st }) => !st.behind).sort((a, b) => a.st.y - b.st.y);
  const kbGrip: P2 = [KB_BASE[0], KB_BASE[1] - 190 * KB_SCALE];
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Land />
          {/* the host behind the crest: only what stands above it shows */}
          <clipPath id="sal-above-crest">
            <path d={ABOVE_CREST_D} />
          </clipPath>
          <g clipPath="url(#sal-above-crest)">
            {behind.map(({ m }) => (
              <HostMan key={`${m.rank}-${m.x}`} m={m} f={frame} />
            ))}
          </g>
          <CrestLine />
          {front.map(({ m }) => (
            <HostMan key={`${m.rank}-${m.x}`} m={m} f={frame} />
          ))}
          <GroundPlane />
          <path d={TABLE_SHADE_D} {...ln(1.3, 0.32)} />
          {/* the court: the mats, the standards, the back row, the minister, the table and the treaty, the parties */}
          <Mat x0={128} x1={468} s0={0.93} s1={1.12} uid="sal-matg" ink={{ ...CREAM, deep: mixColor(LAND, CREAM.deep, 0.75), hair: mixColor(LAND, CREAM.hair, 0.8) }} />
          <Mat x0={690} x1={1290} s0={0.84} s1={1.12} uid="sal-matk" ink={{ ...ORANGE, deep: mixColor(LAND, ORANGE.deep, 0.55), hair: mixColor(LAND, ORANGE.deep, 0.32) }} />
          <Banner at={kbGrip} scale={KB_SCALE} angle={0} dir={1} wave={frame * 0.03 + 0.4} ink={ORANGE} uid="sal-kb" />
          <Minister pose={idle({ ...POSES.hu(-1), pitch: 8 }, frame, 11.2, 0.7)} at={COURTIER_AT} scale={S_COURT} uid="sal-court" ink={ORANGE} />
          <Minister pose={mini} at={MIN_AT} scale={S_MIN} uid="sal-min" ink={ORANGE} />
          {GUARDS.map((g, i) => (
            <Soldier key={i} pose={idle(POSES.carry(1), frame, g.seed, 0.6)} at={g.at} scale={g.s} uid={`sal-gd${i}`} seed={g.seed} />
          ))}
          <LowTable at={TABLE_AT} scale={S_TABLE} uid="sal-table" ink={WOOD} />
          <Treaty open={open} />
          <King pose={king} at={KING_AT} scale={S_KING} uid="sal-king" ink={ORANGE} />
          <General pose={gen} at={GEN_AT} scale={S_GEN} uid="sal-gen" />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default StillAroundLater;

/** probes for the build: the general's hand vs the roll; the host */
export const STILL_PROBE = {
  hand: (f: number) => {
    const A = dgAnchors("general", genPose(f), GEN_AT, S_GEN, { weapon: "none" });
    return { hand: A.handL, contact: contactAt(f), roll: rollGeom(scrollOpen(f)) };
  },
  host: HOST,
  manState,
  camAt,
  crestY,
};
