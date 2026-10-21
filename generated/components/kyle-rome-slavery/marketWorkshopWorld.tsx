// ---------------------------------------------------------------------------
// marketWorkshopWorld: the shared world of kyle-rome-slavery cuts C (WeKeepThemApart, cut 20) and D
// (SlavesInTheWorkshop, cut 33). One Roman stage of stone flags in one-point perspective (londonDepth, read only),
// cut along its centre line into two halves:
//   LEFT  (X < 0)  a slave sale: the catasta (a raised timber platform with steps), a slave on it with chalked feet
//                  and a blank titulus at his neck, a fettered slave waiting at its back, the dealer pointing to
//                  him, a buyer in a toga looking up from below. Lit flat and cold (inks sunk toward DEAD).
//   RIGHT (X > 0)  a red-gloss (terra sigillata) pottery under a timber roof: three rows of potters at their wheels
//                  (slaves in plain tunics, no collars or fetters), two EMPTY seats (stool + wheel, facing right) at
//                  the workshop's front-left just across the seam, a domed kiln at the back with a glowing (cream) mouth, a long rack of shelves on which
//                  ORANGE bowls stack up (orange = productive output), a crate being filled.
// The split (0..1) slides the two halves apart along X on the floor plane (each a slab with a dark front face), a
// dark chasm opening between them. Cut C ends at split 1; cut D opens there and reverses it.
//
// UNITS AND THE CAMERA. 3D units = romeCast units (a man ~312). X across (the seam at X = 0), Y height (the floor
// is Y = 0, up is - Y), Z depth behind the front plane. Each half is drawn in its OWN local coordinates: at split s
// the left half sits at world X + halfDX("L", s) (= - SPLIT_DX * s), the right at + SPLIT_DX * s. A camera is the
// 2D camera of the front plane in floor coordinates ({ k, cx, cy }, the floor line y = 0) and the kit's
// perspective(cam, DEPTH) (the VP is at cam.cx on the horizon y = DEPTH.eyeY, so always at screen x 540).
//
// API (for cut D)
//   DEPTH, SLAB, SPLIT_DX, halfDX(half, split), halfPersp(cam, half, split) -> { P, dx }: P is the half's own
//     perspective (local X); draw its points inside <g transform={`translate(${dx} 0)`}> in a WorldSvg of `cam`.
//   PLATFORM, STEPS, MAIN_SLAVE, WAITING (1), DEALER, BUYER: positions (local, left half) + variants.
//   FRONT_STATIONS (2 empty seats, dir 1), BACK_STATIONS (6, dir -1), stationPlace(st) -> { feet, wheel, stool, dir } (local X).
//   RACK, CRATE, KILN, POSTS: the workshop's volumes.
//   Poses (pure, frame-driven): mainSlavePose(f), waitingPose(i, f), dealerPose(f), buyerPose(f), potterPhase(i, f).
//   <MarketWorkshopStage cam frame split seam stack frontSeated hide extra uid />:
//     split   0..1  the halves' separation (0 = one stage, 1 = cut C's end: the gap 2 * SPLIT_DX)
//     seam    0..1  the crack drawn along the centre line from the front edge to the back (C: 1 from f143)
//     stack   0..1  the bowls' fill level (per-stack counts; the fraction shows the next bowl coming down onto it)
//     frontSeated   boolean[2]: a slave seated at that front stool, potting (D's payoff); default all empty
//     hide          { main?, waiting?: [bool] }: leave platform slaves out (D draws them walking)
//     extra         StageExtra[]: your own items { half: "L" | "R", Z, node(P) } sorted into the painter's order
//                   (node draws in the half's local coordinates with that half's P; D's walkers once split = 0)
//     frame         drives the ambient life (wheels, kiln, breathing): D passes C_END.frame + its own frame.
//   C camera: cutCCamAt(f) (sway included); C_END = { frame 210, cam, split 1, seam 1, stack } = cut C's last
//     frame exactly. Cut D's frame 0 = <MarketWorkshopStage cam={C_END.cam} frame={210} split={1} seam={1}
//     stack={C_END.stack} />.
//
// FACTS (illustrative; nothing on screen): Roman slave sales on a raised platform (catasta) with a label (titulus)
// hung at the neck; newly imported slaves had chalked feet (Pliny, Natural History 35.199). Arretine terra sigillata
// workshops (Arezzo, 1st c. BC - 1st c. AD): stamps name the owner and often the enslaved potter (Perennius and his
// potter Tigranes; Ateius and his slaves).
// ---------------------------------------------------------------------------
import React from "react";
import { random } from "remotion";
import { hash, mixColor, swayCam, type Cam, type P2 } from "../kits/maps/incaShared";
import { Box, ContactShadow, Cylinder, GroundPlane, depthTint, perspective, tintInk, type DepthOpts, type Persp, type VolInk } from "../kyle-london/londonDepth";
import {
  CREAM,
  DARK,
  Dominus,
  Overseer,
  POSES,
  POTTER,
  PotterWheel,
  Slave,
  Stool,
  headTurn,
  idle,
  mixInk,
  romeAnchors,
  shadeInk,
  type FigPose,
  type Ink,
} from "./romeCast";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DEAD = "#8A7B62";
export const PAGE = "#3F3428";

// ---------------------------------------------------------------------------
// THE STAGE
// ---------------------------------------------------------------------------
/** one camera: the eye 3.2 men up (the horizon), dRef at zoom kRef, half of a zoom is a dolly */
export const DEPTH: DepthOpts = { eyeY: -1000, dRef: 1600, kRef: 1, dolly: 0.5 };
/** the stage slab (local X of the whole stage before the split; the seam at X = 0): flags on top (Y 0), its faces
 *  T deep and sinking into the page below, the front edge at z0, the floor fading into the page by z1 */
export const SLAB = { x0: -1700, x1: 1700, z0: 0, z1: 1800, T: 300 };
/** each half's X offset at split 1 (the gap is 2 * SPLIT_DX: ~290 px at the front edge on C's last frame) */
export const SPLIT_DX = 105;
export type Half = "L" | "R";
export const halfDX = (h: Half, split: number) => (h === "L" ? -1 : 1) * SPLIT_DX * split;
/** a half's own perspective: draw its local points with P inside translate(dx, 0) in a WorldSvg of `cam` */
export const halfPersp = (cam: Cam, h: Half, split: number) => {
  const dx = halfDX(h, split);
  return { P: perspective({ k: cam.k, cx: cam.cx - dx, cy: cam.cy }, DEPTH), dx };
};

// ---------------------------------------------------------------------------
// THE SALE (left half, local X < 0)
// ---------------------------------------------------------------------------
/** the catasta: a timber platform (box) X0..X1, Z0 (front)..Z1, its top at Y = -H */
export const PLATFORM = { X0: -272, X1: -48, Z0: 80, Z1: 360, H: 100 };
/** three steps up its front, at the right */
export const STEPS = [
  { X0: -140, X1: -60, Z0: 20, Z1: 80, top: -25 },
  { X0: -140, X1: -60, Z0: 40, Z1: 80, top: -50 },
  { X0: -140, X1: -60, Z0: 60, Z1: 80, top: -75 },
];
export type Spot = { X: number; Y: number; Z: number; variant: number };
/** the slave being sold: front centre of the platform, half turned toward the buyer (down left) */
export const MAIN_SLAVE: Spot = { X: -166, Y: -PLATFORM.H, Z: 165, variant: 0 };
/** a fettered slave waiting at the head of the steps beside him, next in line (one per front seat: cut D walks
 *  MAIN_SLAVE and WAITING[0] over to FRONT_STATIONS) */
export const WAITING: Spot[] = [{ X: -92, Y: -PLATFORM.H, Z: 150, variant: 1 }];
/** the dealer (Overseer 2, the auctioneer) on the platform at the slave's left, beside the buyer, presenting him with
 *  his open hand (the traders together on the left, the traded man alone at the platform's front) */
export const DEALER: Spot = { X: -250, Y: -PLATFORM.H, Z: 212, variant: 2 };
/** the buyer (Dominus 0) on the floor beside the platform's left side, upstage (his head and hands clear the caption bands), looking up at him */
export const BUYER: Spot = { X: -334, Y: 0, Z: 215, variant: 0 };

/** the forum's portico behind the sale: columns at PORTICO.xs, depth Z, an architrave on top */
export const PORTICO = { xs: [-120, -340, -560, -780], Z: 1200, R: 30, H: 700, arch: 64, X0: -900, X1: -60 };

const breath = (f: number, seed: number) => Math.sin(f / 17 + seed);
export const mainSlavePose = (f: number): FigPose => {
  const q = POSES.stoop(-1);
  return { ...q, crouch: q.crouch + 1.2 * breath(f, 0.3), pitch: q.pitch + 3 + 1.5 * Math.sin(f / 31) };
};
export const waitingPose = (i: number, f: number): FigPose => {
  const q = POSES.bowed(POSES.stand(i === 0 ? 1 : -1));
  return { ...q, crouch: q.crouch + 1 * breath(f, 1.7 + i) };
};
export const dealerPose = (f: number): FigPose => {
  // the auctioneer's patter: his near hand open toward the slave, lifted on "slavery", easing down a little after
  const t = 0.75 + 0.25 * ease(f / 16) - 0.15 * ease((f - 60) / 40);
  return idle(headTurn(POSES.gesture(1, t), 0.45, 2), f, 3, 0.6);
};
export const buyerPose = (f: number): FigPose => {
  // facing right, looking up at him, weighing him: the near hand a little forward, the far hand up at his chin
  const g = POSES.gesture(1, 0.35 + 0.1 * Math.sin(f / 23));
  const q: FigPose = { ...g, armR: { w: [30, -250 + 3 * Math.sin(f / 29)], elbow: [0.5, 1], fist: 0.7, hand: -40 } };
  return idle(headTurn(q, 0.5, -14), f, 9, 0.5);
};

// ---------------------------------------------------------------------------
// THE WORKSHOP (right half, local X > 0)
// ---------------------------------------------------------------------------
export type Station = { X: number; Z: number; variant: number; dir?: 1 | -1 }; // dir default -1 (facing left)
/** a potter's place: his feet at X facing dir, the wheel POTTER.wheelDX units in front of him, the stool behind
 *  (dir -1: wheel X - 112, stool X + 6, as before) */
export const stationPlace = (st: Station) => {
  const d = st.dir ?? -1;
  return { feet: st.X, wheel: st.X + d * POTTER.wheelDX, stool: st.X + d * POTTER.stoolDX, dir: d };
};
/** the two EMPTY seats at the workshop's front-left, just across the seam, facing right into the workshop (cut D
 *  seats the platform slaves here: the chalk-footed slave at [0], the fettered slave at [1]; <notes>/D_STATIONS.md) */
export const FRONT_STATIONS: Station[] = [
  { X: 70, Z: 70, variant: 0, dir: 1 },
  { X: 80, Z: 250, variant: 1, dir: 1 },
];
/** the back rows, worked (slaves in plain tunics, no collars or fetters) */
export const BACK_STATIONS: Station[] = [
  { X: 175, Z: 720, variant: 4 },
  { X: 380, Z: 720, variant: 2 },
  { X: 175, Z: 990, variant: 1 },
  { X: 380, Z: 990, variant: 3 },
  { X: 175, Z: 1260, variant: 0 },
  { X: 380, Z: 1260, variant: 4 },
];
/** the wheel's phase for back potter i (cycles) */
export const potterPhase = (i: number, f: number) => f / 38 + hash(i, 61);
/** the rack: shelves along the right of the workshop, X0..X1, Z0..Z1, boards at TIERS (Y of each board's top) */
export const RACK = { X0: 430, X1: 488, Z0: 560, Z1: 1400, posts: [560, 840, 1120, 1400], tiers: [-8, -110, -212], top: -300, board: 9 };
/** the stacks on the rack: per tier, NSTACK stacks along Z; each up to `max` bowls */
export const NSTACK = 9;
export const BOWL = { R: 19, foot: 7, h: 17, step: 10.5, maxPer: 7 };
/** the crate being filled, at the workshop's front by the seam */
export const CRATE = { X0: 22, X1: 102, Z0: 300, Z1: 368, H: 58 };
export const KILN = { X: 270, Z: 1530, R: 165, H: 260, dome: 140, mouthW: 96, mouthH: 116 };
/** the roof: posts (square timbers) at X POST_X, Z POST_Z, beams on top, the roof's underside at ROOF_Y */
export const POST_X = [25, 545];
export const POST_Z = [400, 900, 1400];
export const POST_W = 30;
export const ROOF_Y = -1260;
export const BEAM_Y = -1220;

// ---------------------------------------------------------------------------
// INKS: the sale sunk and cold (toward DEAD), the workshop lit (in-play cream ~0.9)
// ---------------------------------------------------------------------------
const DEAD_INK: Ink = { main: DEAD, deep: "#766950", hair: "#544A39" };
const coldInk = (Z: number, dead = 0.62) => tintInk(mixInk(CREAM, DEAD_INK, dead), depthTint(Z, { far: 1400, min: 0.55 }));
const warmInk = (Z: number) => tintInk(shadeInk(1), depthTint(Z, { far: 1800, min: 0.74 }));
/** timber, lit from the upper left: warm and lit in the workshop, cold and flat in the market */
const TIMBER: VolInk = { lit: "#9A7B52", mid: "#634C33", dark: "#2E2216" };
const TIMBER_COLD: VolInk = { lit: "#64594A", mid: "#423A2E", dark: "#252019" };
/** the steps' treads lit (their tops read as steps) */
const STEP_COLD: VolInk = { lit: "#7E725E", mid: "#4A4134", dark: "#262019" };
const STONE_COLD: VolInk = { lit: "#6A604F", mid: "#463E32", dark: "#29231B" };
const BRICK: VolInk = { lit: "#8E6842", mid: "#5E452D", dark: "#2B1F14" };
const volTint = (v: VolInk, t: number): VolInk => ({ lit: mixColor(PAGE, v.lit, t), mid: mixColor(PAGE, v.mid, t), dark: mixColor(PAGE, v.dark, t) });

// ---------------------------------------------------------------------------
// DRAWN PIECES
// ---------------------------------------------------------------------------
/** a stack of n nested red-gloss bowls standing at (X, Y, Z) (Y = the board's top), plus a falling one (u 0..1) */
const BowlStack: React.FC<{ P: Persp; X: number; Y: number; Z: number; n: number; fall: number; uid: string; tone?: number }> = ({ P, X, Y, Z, n, fall, uid, tone = 1 }) => {
  const r = P.r(Z);
  const sw = 1.7 * r;
  const els: React.ReactNode[] = [];
  const bowl = (y0: number, key: string, inner: boolean) => {
    // y0 = the bowl's foot (Y); body flares to the rim at y0 - h
    const yr = y0 - BOWL.h;
    const foot = P.p(X, y0, Z);
    const rim = P.p(X, yr, Z);
    const ryOf = (yy: number, R: number) => Math.max(0.6, (P.p(X, yy, Z - R)[1] - P.p(X, yy, Z + R)[1]) / 2);
    const rf = BOWL.foot * r;
    const rr = BOWL.R * r;
    const ryr = ryOf(yr, BOWL.R);
    const ryf = ryOf(y0, BOWL.foot);
    // a flaring cup (the Dragendorff 29 / 37 profile simplified): a near-conical wall, a small foot ring; nested in
    // a stack each bowl shows a band narrowing downward, so the stack's sides are saw-toothed (not a coin column)
    const body = `M${Pt([rim[0] - rr, rim[1]])}Q${Pt([rim[0] - rr * 0.82, foot[1] - (foot[1] - rim[1]) * 0.2])} ${Pt([foot[0] - rf, foot[1]])}A${rf.toFixed(2)},${ryf.toFixed(2)} 0 0 0 ${Pt([foot[0] + rf, foot[1]])}Q${Pt([rim[0] + rr * 0.82, foot[1] - (foot[1] - rim[1]) * 0.2])} ${Pt([rim[0] + rr, rim[1]])}A${rr.toFixed(2)},${ryr.toFixed(2)} 0 0 1 ${Pt([rim[0] - rr, rim[1]])}Z`;
    els.push(
      <g key={key}>
        <path d={body} fill={ACCENT} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />
        {/* the right side in shade (light from the upper left) */}
        <path d={`M${Pt([rim[0] + rr * 0.3, rim[1] + ryr])}L${Pt([rim[0] + rr * 0.98, rim[1] + 1])}Q${Pt([rim[0] + rr * 0.82, foot[1] - (foot[1] - rim[1]) * 0.2])} ${Pt([foot[0] + rf, foot[1]])}L${Pt([foot[0] + rf * 0.1, foot[1] + ryf * 0.9])}Z`} fill={ACCENT_DEEP} />
        {/* the rim's lip, a fine dark line just under it */}
        <path d={`M${Pt([rim[0] - rr * 0.97, rim[1] + 2.4 * r])}A${(rr * 0.97).toFixed(2)},${ryr.toFixed(2)} 0 0 0 ${Pt([rim[0] + rr * 0.97, rim[1] + 2.4 * r])}`} fill="none" stroke={DARK} strokeWidth={sw * 0.5} strokeOpacity={0.7} />
        <path d={`M${Pt([rim[0] - rr, rim[1]])}A${rr.toFixed(2)},${ryr.toFixed(2)} 0 0 0 ${Pt([rim[0] + rr, rim[1]])}`} fill="none" stroke={DARK} strokeWidth={sw} />
        {inner ? <ellipse cx={rim[0]} cy={rim[1]} rx={rr * 0.86} ry={ryr * 0.8} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={sw * 0.7} /> : null}
      </g>,
    );
  };
  for (let i = 0; i < n; i++) bowl(Y - i * BOWL.step, `${uid}-${i}`, i === n - 1 && fall <= 0);
  if (fall > 0) {
    // the next bowl set down onto the stack: lowered from just above, easing in and out (no fall, no bounce)
    const drop = 16 * (1 - ease(fall));
    bowl(Y - n * BOWL.step - drop, `${uid}-f`, true);
  }
  return <g opacity={tone}>{els}</g>;
};

/** the per-stack bowl count (float) at fill level s */
const stackCount = (j: number, s: number) => {
  const m = 4 + Math.floor(hash(j, 7) * (BOWL.maxPer - 3));
  const lag = 0.18 * hash(j, 11);
  return m * c01((s - lag) / (1 - lag));
};

// ---------------------------------------------------------------------------
// THE STAGE COMPONENT
// ---------------------------------------------------------------------------
export type StageExtra = { half: Half; Z: number; node: (P: Persp) => React.ReactNode };
type Item = { half: Half; Z: number; node: (P: Persp) => React.ReactNode };

export type StageProps = {
  cam: Cam;
  frame: number;
  split: number;
  seam?: number;
  stack: number;
  frontSeated?: boolean[];
  hide?: { main?: boolean; waiting?: boolean[] };
  extra?: StageExtra[];
  uid?: string;
};

export const MarketWorkshopStage: React.FC<StageProps> = ({ cam, frame: f, split, seam = 0, stack, frontSeated = [false, false], hide = {}, extra = [], uid = "mw" }) => {
  const L = halfPersp(cam, "L", split);
  const R = halfPersp(cam, "R", split);
  const PH = { L: L.P, R: R.P };
  const DX = { L: L.dx, R: R.dx };
  const gap = R.dx - L.dx;
  const S = SLAB;
  const items: Item[] = [];

  // ----- under the floor: the two blocks' faces. The gap between them is EMPTY (the page shows through): two islands,
  // not a trench. Each block's faces fade to the page downward (bands in Y) and with depth (bands in Z). -----
  const under: React.ReactNode[] = [];
  const NY = 7;
  const yFade = (j: number) => Math.pow(1 - j / NY, 1.3);
  const faceOf = (h: Half) => {
    const P = PH[h];
    const x0 = h === "L" ? S.x0 : 0;
    const x1 = h === "L" ? 0 : S.x1;
    const sw = 2.3 * P.r(S.z0);
    const els: React.ReactNode[] = [];
    // the inner (cut) face, seen once the halves part. Light from the upper left: the LEFT block's inner face looks
    // right (away from the light: dark), the RIGHT block's looks left (into the light: lit)
    if (gap > 0.5) {
      const NZ = 9;
      const fill = h === "L" ? "#1C1610" : "#5C4A35";
      for (let i = 0; i < NZ; i++) {
        const za = mix(S.z0, S.z1, Math.pow(i / NZ, 1.5));
        const zb = mix(S.z0, S.z1, Math.pow((i + 1) / NZ, 1.5));
        const az = 1 - c01((za - 250) / (S.z1 - 250));
        for (let j = 0; j < NY; j++) {
          const ya = (S.T * j) / NY;
          const yb = (S.T * (j + 1)) / NY;
          els.push(<path key={`in${i}-${j}`} d={poly([P.p(0, ya, za), P.p(0, ya, zb), P.p(0, yb, zb), P.p(0, yb, za)])} fill={fill} stroke={fill} strokeWidth={0.6} opacity={az * yFade(j)} />);
        }
      }
      // its top edge, a firm line fading with depth
      const NE = 6;
      for (let i = 0; i < NE; i++) {
        const za = mix(S.z0, S.z1, i / NE);
        const zb = mix(S.z0, S.z1, (i + 1) / NE);
        els.push(<path key={`ie${i}`} d={`M${Pt(P.p(0, 0, za))}L${Pt(P.p(0, 0, zb))}`} stroke={DARK} strokeWidth={sw * P.r(za)} strokeOpacity={1 - c01((za - 250) / (S.z1 - 250))} />);
      }
    }
    // the front face: dark stone at the top edge, sinking into the page below
    const fill = h === "L" ? "#2A2219" : "#3A2D20";
    for (let j = 0; j < NY; j++) {
      const ya = (S.T * j) / NY;
      const yb = (S.T * (j + 1)) / NY;
      els.push(<path key={`fr${j}`} d={poly([P.p(x0, ya, S.z0), P.p(x1, ya, S.z0), P.p(x1, yb, S.z0), P.p(x0, yb, S.z0)])} fill={fill} stroke={fill} strokeWidth={0.6} opacity={yFade(j)} />);
    }
    // two courses of dressed stone, fading
    [0.18, 0.4].forEach((u, i) =>
      els.push(<path key={`crs${i}`} d={`M${Pt(P.p(x0, S.T * u, S.z0))}L${Pt(P.p(x1, S.T * u, S.z0))}`} stroke={DARK} strokeWidth={sw * 0.5} strokeOpacity={0.55 * (1 - u)} />),
    );
    return (
      <g key={`fc${h}`} transform={`translate(${DX[h].toFixed(3)} 0)`}>
        {els}
      </g>
    );
  };
  // the void between the blocks: dark at the floor's level, sinking to the page downward and with depth
  if (gap > 0.5) {
    const P0 = perspective(cam, DEPTH);
    const NZ = 10;
    for (let i = 0; i < NZ; i++) {
      const za = mix(S.z0, S.z1, Math.pow(i / NZ, 1.5));
      const zb = mix(S.z0, S.z1, Math.pow((i + 1) / NZ, 1.5));
      const a = 0.92 * (1 - c01((za - 250) / (S.z1 - 250)));
      under.push(<path key={`vd${i}`} d={poly([P0.p(L.dx, 0, za), P0.p(R.dx, 0, za), P0.p(R.dx, 0, zb), P0.p(L.dx, 0, zb)])} fill={DARK} stroke={DARK} strokeWidth={0.6} opacity={a} />);
    }
    const NV = 9;
    for (let j = 0; j < NV; j++) {
      const ya = (S.T * 1.5 * j) / NV;
      const yb = (S.T * 1.5 * (j + 1)) / NV;
      under.push(<path key={`vf${j}`} d={poly([P0.p(L.dx, ya, S.z0), P0.p(R.dx, ya, S.z0), P0.p(R.dx, yb, S.z0), P0.p(L.dx, yb, S.z0)])} fill={DARK} stroke={DARK} strokeWidth={0.6} opacity={0.92 * Math.pow(1 - j / NV, 1.4)} />);
    }
  }
  under.push(faceOf("L"), faceOf("R"));

  // ----- the floors (each half's flags): the sale's sunk and cold, the workshop's lit warm -----
  const floors = (["L", "R"] as Half[]).map((h) => {
    const P = PH[h];
    const xa = h === "L" ? S.x0 : 0;
    const xb = h === "L" ? 0 : S.x1;
    const wash: React.ReactNode[] = [];
    if (h === "R") {
      const NB = 10;
      for (let i = 0; i < NB; i++) {
        const za = mix(S.z0, S.z1, Math.pow(i / NB, 1.4));
        const zb = mix(S.z0, S.z1, Math.pow((i + 1) / NB, 1.4));
        wash.push(<path key={`w${i}`} d={poly([P.p(xa, 0, za), P.p(xb, 0, za), P.p(xb, 0, zb), P.p(xa, 0, zb)])} fill="#A88B66" opacity={0.42 * (1 - c01((za - 200) / (S.z1 - 200)))} />);
      }
    } else {
      wash.push(<path key="wl" d={poly([P.p(xa, 0, S.z0), P.p(xb, 0, S.z0), P.p(xb, 0, S.z1), P.p(xa, 0, S.z1)])} fill={DARK} opacity={0.22} />);
    }
    return (
      <g key={`fl${h}`} transform={`translate(${DX[h].toFixed(3)} 0)`}>
        {wash}
        <GroundPlane P={P} kind="flags" x0={xa} x1={xb} z0={S.z0} zFar={S.z1} course={130} uid={`${uid}-gp${h}`} tone={h === "L" ? 0.45 : 1.2} />
        {/* the front edge, a firm line */}
        <path d={`M${Pt(P.p(xa, 0, S.z0))}L${Pt(P.p(xb, 0, S.z0))}`} stroke={DARK} strokeWidth={2.4 * P.r(S.z0)} />
      </g>
    );
  });
  let seamEl: React.ReactNode = null;
  if (seam > 0 && gap <= 0.5) {
    const P0 = perspective(cam, DEPTH);
    const zt = mix(S.z0, S.z1 * 0.8, seam);
    seamEl = (
      <g>
        <path d={`M${Pt(P0.p(0, 0, S.z0))}L${Pt(P0.p(0, 0, zt))}`} stroke={DARK} strokeWidth={3.2 * P0.r(S.z0)} strokeLinecap="round" />
        <path d={`M${Pt(P0.p(0, 0, S.z0))}L${Pt(P0.p(0, S.T * c01(seam * 4), S.z0))}`} stroke={DARK} strokeWidth={3.2 * P0.r(S.z0)} />
      </g>
    );
  }

  // ----- contact shadows (on the floor / the platform top) -----
  const shadows: Item[] = [];
  const shadow = (h: Half, X: number, Z: number, w: number, d: number, k: string, amt = 1, Y = 0) => shadows.push({ half: h, Z: 1e6, node: (P) => <ContactShadow key={k} P={P} X={X} Z={Z} w={w} d={d} Y={Y} uid={`${uid}-${k}`} amt={amt} /> });

  // ===================== THE SALE =====================
  const pl = PLATFORM;
  shadow("L", (pl.X0 + pl.X1) / 2, (pl.Z0 + pl.Z1) / 2, (pl.X1 - pl.X0) * 0.58, (pl.Z1 - pl.Z0) * 0.6, "csp", 0.7);
  shadow("L", BUYER.X, BUYER.Z, 60, 30, "csb");
  items.push({
    half: "L",
    Z: pl.Z1,
    node: (P) => {
      const ink = TIMBER_COLD;
      const top = -pl.H;
      const sw = 1.6 * P.r(pl.Z0);
      // planks on the top (along X) and the front face's boards
      let planks = "";
      for (let z = pl.Z0 + 40; z < pl.Z1; z += 40) planks += `M${Pt(P.p(pl.X0, top, z))}L${Pt(P.p(pl.X1, top, z))}`;
      let boards = "";
      for (let y = top + 25; y < 0; y += 25) boards += `M${Pt(P.p(pl.X0, y, pl.Z0))}L${Pt(P.p(pl.X1, y, pl.Z0))}`;
      return (
        <g key="plat">
          <Box P={P} X0={pl.X0} X1={pl.X1} Y0={top} Y1={0} Z0={pl.Z0} Z1={pl.Z1} ink={ink} uid={`${uid}-plat`} />
          <path d={planks} stroke={DARK} strokeWidth={sw} strokeOpacity={0.55} />
          <path d={boards} stroke={DARK} strokeWidth={sw} strokeOpacity={0.5} />
          {/* the corner posts on the front face */}
          {[pl.X0 + 10, pl.X1 - 10].map((x) => (
            <path key={x} d={poly([P.p(x - 10, top, pl.Z0 - 1), P.p(x + 10, top, pl.Z0 - 1), P.p(x + 10, 0, pl.Z0 - 1), P.p(x - 10, 0, pl.Z0 - 1)])} fill={ink.lit} stroke={DARK} strokeWidth={sw} />
          ))}
        </g>
      );
    },
  });
  STEPS.forEach((st, i) =>
    items.push({ half: "L", Z: st.Z1 - 1 - i, node: (P) => <Box key={`st${i}`} P={P} X0={st.X0} X1={st.X1} Y0={st.top} Y1={i === 0 ? 0 : STEPS[i - 1].top} Z0={st.Z0} Z1={st.Z1} ink={STEP_COLD} uid={`${uid}-st${i}`} hatch={false} /> }),
  );
  const figOn = (P: Persp, s: Spot): { at: P2; scale: number } => ({ at: P.p(s.X, s.Y, s.Z), scale: P.r(s.Z) });
  // the waiting slaves (fettered), at the platform's back
  WAITING.forEach((w, i) => {
    if (hide.waiting?.[i]) return;
    shadow("L", w.X, w.Z, 50, 26, `csw${i}`, 1, w.Y);
    items.push({
      half: "L",
      Z: w.Z,
      node: (P) => {
        const o = figOn(P, w);
        const ink = coldInk(w.Z);
        return <Slave key={`w${i}`} pose={waitingPose(i, f)} at={o.at} scale={o.scale} uid={`${uid}-w${i}`} variant={w.variant} ink={ink} cloth={ink} shade={1} fetters />;
      },
    });
  });
  // the dealer
  shadow("L", DEALER.X, DEALER.Z, 52, 26, "csd", 1, DEALER.Y);
  items.push({
    half: "L",
    Z: DEALER.Z,
    node: (P) => {
      const o = figOn(P, DEALER);
      const ink = coldInk(DEALER.Z);
      return <Overseer key="dl" pose={dealerPose(f)} at={o.at} scale={o.scale} uid={`${uid}-dl`} variant={DEALER.variant} ink={ink} cloth={ink} shade={1} tool="none" />;
    },
  });
  // the slave on sale: chalked feet, the titulus at his neck
  if (!hide.main) {
    shadow("L", MAIN_SLAVE.X, MAIN_SLAVE.Z, 52, 26, "csm", 1, MAIN_SLAVE.Y);
    items.push({ half: "L", Z: MAIN_SLAVE.Z, node: (P) => <SaleSlave key="ms" P={P} f={f} uid={`${uid}-ms`} /> });
  }
  // the buyer
  items.push({
    half: "L",
    Z: BUYER.Z,
    node: (P) => {
      const o = figOn(P, BUYER);
      // the buyer is nearest, so he is sunk a step further toward DEAD: the slave stays the brightest figure on the left
      const ink = coldInk(BUYER.Z, 0.66);
      return <Dominus key="by" pose={buyerPose(f)} at={o.at} scale={o.scale} uid={`${uid}-by`} variant={BUYER.variant} ink={ink} cloth={ink} shade={1} />;
    },
  });

  // the portico at the back of the market (cold stone, sunk by depth)
  {
    const po = PORTICO;
    const ink = volTint(STONE_COLD, depthTint(po.Z, { far: 1400, min: 0.5 }));
    po.xs.forEach((x, i) => {
      shadow("L", x, po.Z, po.R * 1.4, po.R, `cspc${i}`, 0.6);
      items.push({ half: "L", Z: po.Z + 1, node: (P) => <Cylinder key={`pc${i}`} P={P} X={x} Z={po.Z} R={po.R} Y0={-po.H} Y1={0} ink={ink} uid={`${uid}-pc${i}`} /> });
    });
    items.push({ half: "L", Z: po.Z - po.R - 1, node: (P) => <Box key="parch" P={P} X0={po.X0} X1={po.X1} Y0={-po.H - po.arch} Y1={-po.H} Z0={po.Z - po.R - 6} Z1={po.Z + po.R + 6} ink={ink} uid={`${uid}-parch`} /> });
  }

  // ===================== THE WORKSHOP =====================
  // the roof's underside (above the eye: seen from below), its rafters, the beams and posts
  items.push({
    half: "R",
    Z: 1e5,
    node: (P) => {
      const x0 = POST_X[0] - 20;
      const x1 = POST_X[1] + 40;
      const z0 = POST_Z[0] - 30;
      const z1 = POST_Z[POST_Z.length - 1];
      const NB = 8;
      const bands: React.ReactNode[] = [];
      for (let i = 0; i < NB; i++) {
        const za = mix(z0, z1, i / NB);
        const zb = mix(z0, z1, (i + 1) / NB);
        bands.push(<path key={i} d={poly([P.p(x0, ROOF_Y, za), P.p(x1, ROOF_Y, za), P.p(x1, ROOF_Y, zb), P.p(x0, ROOF_Y, zb)])} fill="#241C14" opacity={mix(0.95, 0.35, i / NB)} />);
      }
      let raft = "";
      for (let z = z0 + 45; z < z1; z += 90) raft += `M${Pt(P.p(x0, ROOF_Y, z))}L${Pt(P.p(x1, ROOF_Y, z))}`;
      return (
        <g key="roof">
          {bands}
          <path d={raft} stroke="#5E4A33" strokeWidth={5 * P.r(400)} strokeOpacity={0.55} />
          <path d={raft} stroke={DARK} strokeWidth={1.2 * P.r(400)} strokeOpacity={0.6} />
        </g>
      );
    },
  });
  POST_X.forEach((px, i) =>
    items.push({ half: "R", Z: 9e4 - i, node: (P) => <Box key={`lb${i}`} P={P} X0={px - 20} X1={px + 20} Y0={ROOF_Y + 2} Y1={BEAM_Y} Z0={POST_Z[0] - 30} Z1={POST_Z[POST_Z.length - 1]} ink={TIMBER} uid={`${uid}-lb${i}`} /> }),
  );
  POST_Z.forEach((pz, j) => {
    items.push({ half: "R", Z: pz + POST_W / 2 + 0.5, node: (P) => <Box key={`tb${j}`} P={P} X0={POST_X[0] - 20} X1={POST_X[1] + 20} Y0={BEAM_Y - 4} Y1={BEAM_Y + 34} Z0={pz - 16} Z1={pz + 16} ink={volTint(TIMBER, depthTint(pz, { far: 2000, min: 0.8 }))} uid={`${uid}-tb${j}`} /> });
    POST_X.forEach((px, i) => {
      shadow("R", px, pz, 34, 20, `cspo${i}${j}`, 0.8);
      items.push({ half: "R", Z: pz, node: (P) => <Box key={`po${i}${j}`} P={P} X0={px - POST_W / 2} X1={px + POST_W / 2} Y0={BEAM_Y} Y1={0} Z0={pz - POST_W / 2} Z1={pz + POST_W / 2} ink={volTint(TIMBER, depthTint(pz, { far: 2000, min: 0.8 }))} uid={`${uid}-po${i}${j}`} /> });
    });
  });
  // the kiln: a brick drum with a dome, its mouth glowing (cream), a little light on the floor before it
  shadow("R", KILN.X, KILN.Z, KILN.R * 1.1, KILN.R * 0.9, "csk", 0.8);
  items.push({ half: "R", Z: KILN.Z, node: (P) => <Kiln key="kiln" P={P} f={f} uid={`${uid}-kiln`} /> });
  // the potters at the back (worked) and the two front seats (empty unless seated)
  const stationItems = (st: Station, key: string, worker: boolean, phase: number) => {
    const pl2 = stationPlace(st);
    shadow("R", pl2.wheel, st.Z, 62, 30, `${key}cw`, 0.8);
    shadow("R", pl2.stool - 6 * pl2.dir, st.Z, 40, 22, `${key}cs`, 0.8);
    items.push({
      half: "R",
      Z: st.Z,
      node: (P) => {
        const sc = P.r(st.Z);
        const ink = warmInk(st.Z);
        return (
          <g key={key}>
            <Stool at={P.p(pl2.stool, 0, st.Z + 4)} scale={sc} uid={`${uid}-${key}s`} ink={ink} />
            <PotterWheel at={P.p(pl2.wheel, 0, st.Z - 4)} scale={P.r(st.Z - 4)} uid={`${uid}-${key}w`} ink={ink} turn={worker ? phase : 0.15} dir={pl2.dir} />
            {worker ? <Slave pose={idle(POSES.potter(pl2.dir, phase), f, 13 + st.variant, 0.4)} at={P.p(pl2.feet, 0, st.Z)} scale={sc} uid={`${uid}-${key}p`} variant={st.variant} ink={ink} cloth={ink} shade={1} /> : null}
          </g>
        );
      },
    });
  };
  BACK_STATIONS.forEach((st, i) => stationItems(st, `bk${i}`, true, potterPhase(i, f)));
  FRONT_STATIONS.forEach((st, i) => stationItems(st, `fr${i}`, !!frontSeated[i], potterPhase(10 + i, f)));
  // the rack of shelves and its bowls, sliced by bay so the painter's order holds along its length
  for (let b = 0; b < RACK.posts.length - 1; b++) {
    const za = RACK.posts[b];
    const zb = RACK.posts[b + 1];
    items.push({ half: "R", Z: zb, node: (P) => <RackBay key={`rb${b}`} P={P} za={za} zb={zb} bay={b} stack={stack} uid={`${uid}-rb${b}`} /> });
  }
  RACK.posts.forEach((pz, i) => {
    shadow("R", (RACK.X0 + RACK.X1) / 2, pz, 30, 16, `csr${i}`, 0.7);
    items.push({ half: "R", Z: pz - 8, node: (P) => <Box key={`rp${i}`} P={P} X0={RACK.X0} X1={RACK.X0 + 14} Y0={RACK.top} Y1={0} Z0={pz - 7} Z1={pz + 7} ink={volTint(TIMBER, depthTint(pz, { far: 2000, min: 0.8 }))} uid={`${uid}-rp${i}`} /> });
    items.push({ half: "R", Z: pz - 8.5, node: (P) => <Box key={`rq${i}`} P={P} X0={RACK.X1 - 14} X1={RACK.X1} Y0={RACK.top} Y1={0} Z0={pz - 7} Z1={pz + 7} ink={volTint(TIMBER, depthTint(pz, { far: 2000, min: 0.8 }))} uid={`${uid}-rq${i}`} /> });
  });
  // the crate at the rack's front end, filling
  shadow("R", (CRATE.X0 + CRATE.X1) / 2, (CRATE.Z0 + CRATE.Z1) / 2, 60, 40, "csc", 0.8);
  items.push({ half: "R", Z: CRATE.Z1, node: (P) => <Crate key="crate" P={P} stack={stack} uid={`${uid}-crate`} /> });

  // the caller's own items
  for (const e of extra) items.push(e);

  items.sort((a, b) => b.Z - a.Z);
  const draw = (it: Item, i: number) => (
    <g key={i} transform={`translate(${DX[it.half].toFixed(3)} 0)`}>
      {it.node(PH[it.half])}
    </g>
  );
  return (
    <g>
      {under}
      {floors}
      {seamEl}
      {shadows.map(draw)}
      {items.map(draw)}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SALE SLAVE (with chalked feet and the titulus)
// ---------------------------------------------------------------------------
const SaleSlave: React.FC<{ P: Persp; f: number; uid: string }> = ({ P, f, uid }) => {
  const s = MAIN_SLAVE;
  const at = P.p(s.X, s.Y, s.Z);
  const sc = P.r(s.Z);
  const pose = mainSlavePose(f);
  const ink = coldInk(s.Z, 0.3);
  const a = romeAnchors("slave", pose, at, sc, { variant: s.variant });
  // the titulus: a small blank board hung on a cord at his neck, resting on his chest
  const bc: P2 = [a.chest[0] + 4 * sc, a.chest[1] + 16 * sc];
  // the cord runs up from the board's corners and goes behind his bowed chin
  const neck: P2 = [bc[0], bc[1] - 30 * sc];
  const bw = 40 * sc;
  const bh = 26 * sc;
  const board: P2[] = [
    [bc[0] - bw / 2, bc[1] - bh / 2 + 2 * sc],
    [bc[0] + bw / 2, bc[1] - bh / 2 - 1 * sc],
    [bc[0] + bw / 2, bc[1] + bh / 2 - 1 * sc],
    [bc[0] - bw / 2, bc[1] + bh / 2 + 2 * sc],
  ];
  // chalk on his bare feet: whitened over the instep and toes
  const chalk = (ank: P2, k: string) => (
    <g key={k}>
      <ellipse cx={ank[0] + 4 * sc} cy={ank[1] + 8 * sc} rx={11 * sc} ry={5 * sc} fill="#F3EBD8" opacity={0.92} />
      <path d={`M${Pt([ank[0] - 5 * sc, ank[1] + 3 * sc])}l${(4 * sc).toFixed(2)},${(-6 * sc).toFixed(2)}l${(6 * sc).toFixed(2)},${(-1 * sc).toFixed(2)}`} fill="none" stroke="#F3EBD8" strokeWidth={3 * sc} strokeLinecap="round" opacity={0.8} />
    </g>
  );
  return (
    <g>
      <Slave pose={pose} at={at} scale={sc} uid={uid} variant={s.variant} ink={ink} cloth={ink} shade={1} />
      {chalk(a.ankleL, "cl")}
      {chalk(a.ankleR, "cr")}
      <path d={`M${Pt(board[0])}L${Pt([neck[0] - 7 * sc, neck[1]])}M${Pt(board[1])}L${Pt([neck[0] + 7 * sc, neck[1]])}`} stroke={DARK} strokeWidth={1.6 * sc} fill="none" />
      <path d={poly(board)} fill="#EFE6CF" stroke={DARK} strokeWidth={2 * sc} strokeLinejoin="round" />
      <path d={`M${Pt([board[0][0] + 2 * sc, board[3][1] - 2.5 * sc])}L${Pt([board[2][0] - 2 * sc, board[2][1] - 2.5 * sc])}L${Pt([board[1][0] - 2 * sc, board[1][1] + 3 * sc])}`} fill="none" stroke="#B9AD92" strokeWidth={1.4 * sc} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE KILN
// ---------------------------------------------------------------------------
const Kiln: React.FC<{ P: Persp; f: number; uid: string }> = ({ P, f, uid }) => {
  const k = KILN;
  const t = depthTint(k.Z, { far: 2200, min: 0.8 });
  const ink = volTint(BRICK, t);
  const zf = k.Z - k.R; // the front of the drum
  const top = P.p(k.X, -k.H, k.Z);
  const rx = k.R * P.r(k.Z);
  const ry = Math.abs((P.p(k.X, -k.H, k.Z - k.R)[1] - P.p(k.X, -k.H, k.Z + k.R)[1]) / 2);
  const apex = P.p(k.X, -k.H - k.dome, k.Z);
  const dome = `M${Pt([top[0] - rx, top[1]])}C${Pt([top[0] - rx, apex[1] + (top[1] - apex[1]) * 0.25])} ${Pt([top[0] - rx * 0.55, apex[1]])} ${Pt(apex)}C${Pt([top[0] + rx * 0.55, apex[1]])} ${Pt([top[0] + rx, apex[1] + (top[1] - apex[1]) * 0.25])} ${Pt([top[0] + rx, top[1]])}A${rx.toFixed(2)},${ry.toFixed(2)} 0 0 1 ${Pt([top[0] - rx, top[1]])}Z`;
  const sw = 2.3 * P.r(k.Z);
  // the mouth: an arch at the drum's front, glowing; flicker
  const fl = 0.85 + 0.15 * (random(`kiln-${Math.floor(f / 2)}`) - 0.5) + 0.06 * Math.sin(f / 5);
  const m0 = P.p(k.X - k.mouthW / 2, 0, zf);
  const m1 = P.p(k.X + k.mouthW / 2, 0, zf);
  const mt = P.p(k.X, -k.mouthH, zf);
  const ms = P.p(k.X - k.mouthW / 2, -k.mouthH * 0.62, zf);
  const mouth = `M${Pt(m0)}L${Pt(ms)}Q${Pt([ms[0], mt[1]])} ${Pt(mt)}Q${Pt([m1[0], mt[1]])} ${Pt([m1[0], ms[1]])}L${Pt(m1)}Z`;
  const glow = mixColor("#C9B48A", "#FFF2D2", fl);
  // the light it throws on the floor: a flat cream wedge, very faint
  const pool = poly([P.p(k.X - k.mouthW * 0.5, 0, zf), P.p(k.X + k.mouthW * 0.5, 0, zf), P.p(k.X + k.mouthW * 1.6, 0, zf - 420), P.p(k.X - k.mouthW * 1.6, 0, zf - 420)]);
  let courses = "";
  for (let y = -30; y > -k.H; y -= 30) {
    const c = P.p(k.X, y, k.Z);
    const ryy = Math.abs((P.p(k.X, y, k.Z - k.R)[1] - P.p(k.X, y, k.Z + k.R)[1]) / 2);
    courses += `M${Pt([c[0] - rx, c[1]])}A${rx.toFixed(2)},${ryy.toFixed(2)} 0 0 0 ${Pt([c[0] + rx, c[1]])}`;
  }
  return (
    <g>
      <path d={pool} fill="#E9DDBF" opacity={0.14 * fl} />
      <Cylinder P={P} X={k.X} Z={k.Z} R={k.R} Y0={-k.H} Y1={0} ink={ink} uid={`${uid}-cy`} />
      <path d={dome} fill={ink.mid} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />
      <clipPath id={`${uid}-dc`}>
        <path d={dome} />
      </clipPath>
      <g clipPath={`url(#${uid}-dc)`}>
        <ellipse cx={top[0] - rx * 0.35} cy={apex[1] + (top[1] - apex[1]) * 0.45} rx={rx * 0.5} ry={(top[1] - apex[1]) * 0.55} fill={ink.lit} opacity={0.8} />
        <path d={`M${Pt([top[0] + rx * 0.3, apex[1]])}L${Pt([top[0] + rx * 1.1, apex[1]])}L${Pt([top[0] + rx * 1.1, top[1] + ry])}L${Pt([top[0] + rx * 0.3, top[1] + ry])}Z`} fill={ink.dark} opacity={0.7} />
      </g>
      <path d={courses} fill="none" stroke={DARK} strokeWidth={sw * 0.5} strokeOpacity={0.5} />
      {/* the flue at the top */}
      <path d={poly([P.p(k.X - 22, -k.H - k.dome + 8, k.Z), P.p(k.X + 22, -k.H - k.dome + 8, k.Z), P.p(k.X + 18, -k.H - k.dome - 30, k.Z), P.p(k.X - 18, -k.H - k.dome - 30, k.Z)])} fill={ink.mid} stroke={DARK} strokeWidth={sw} />
      <path d={mouth} fill={DARK} stroke={DARK} strokeWidth={sw * 1.6} strokeLinejoin="round" />
      <path d={mouth} fill={glow} transform={`translate(${((m0[0] + m1[0]) / 2).toFixed(2)} ${m0[1].toFixed(2)}) scale(0.82) translate(${(-(m0[0] + m1[0]) / 2).toFixed(2)} ${(-m0[1]).toFixed(2)})`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE RACK (one bay: the boards between two posts and the stacks on them)
// ---------------------------------------------------------------------------
const RackBay: React.FC<{ P: Persp; za: number; zb: number; bay: number; stack: number; uid: string }> = ({ P, za, zb, bay, stack, uid }) => {
  const els: React.ReactNode[] = [];
  const t = depthTint((za + zb) / 2, { far: 2000, min: 0.85 });
  const ink = volTint(TIMBER, t);
  const perBay = NSTACK / (RACK.posts.length - 1);
  RACK.tiers.forEach((ty, ti) => {
    els.push(<Box key={`b${ti}`} P={P} X0={RACK.X0} X1={RACK.X1} Y0={ty} Y1={ty + RACK.board} Z0={za} Z1={zb} ink={ink} uid={`${uid}-b${ti}`} hatch={false} />);
  });
  // stacks, far to near within the bay, each tier bottom to top
  const st: React.ReactNode[] = [];
  for (let ti = 0; ti < RACK.tiers.length; ti++) {
    for (let k2 = perBay - 1; k2 >= 0; k2--) {
      const j = ti * NSTACK + bay * perBay + k2;
      const Z = za + ((k2 + 0.5) / perBay) * (zb - za);
      const c = stackCount(j, stack);
      const n = Math.floor(c);
      const fr = c - n;
      // the next bowl comes down in the first 40% of its interval
      const fall = n < BOWL.maxPer && fr > 0 && fr < 0.4 ? fr / 0.4 : 0;
      const nn = fr >= 0.4 ? n + 1 : n;
      st.push(<BowlStack key={`s${j}`} P={P} X={(RACK.X0 + RACK.X1) / 2} Y={RACK.tiers[ti]} Z={Z} n={nn} fall={fall} uid={`${uid}-s${j}`} />);
    }
  }
  return (
    <g>
      {els}
      {st}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CRATE (filling with bowls packed rim up)
// ---------------------------------------------------------------------------
const Crate: React.FC<{ P: Persp; stack: number; uid: string }> = ({ P, stack, uid }) => {
  const c = CRATE;
  const fill = c01((stack - 0.1) / 0.9);
  const level = -c.H * (0.15 + 0.7 * fill);
  const rims: React.ReactNode[] = [];
  const n = 3;
  for (let i = n - 1; i >= 0; i--)
    for (let j = 0; j < 2; j++) {
      const X = c.X0 + 26 + j * 48;
      const Z = c.Z0 + 18 + i * 28;
      const ctr = P.p(X, level, Z);
      const rx = BOWL.R * 1.1 * P.r(Z);
      const ry = Math.max(0.8, (P.p(X, level, Z - BOWL.R)[1] - P.p(X, level, Z + BOWL.R)[1]) / 2);
      rims.push(
        <g key={`${i}${j}`}>
          <ellipse cx={ctr[0]} cy={ctr[1]} rx={rx} ry={ry} fill={ACCENT} stroke={DARK} strokeWidth={1.6 * P.r(Z)} />
          <ellipse cx={ctr[0]} cy={ctr[1]} rx={rx * 0.8} ry={ry * 0.72} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={1.1 * P.r(Z)} />
        </g>,
      );
    }
  const sw = 2 * P.r(c.Z0);
  // the box drawn as its back / inner faces, the contents, then its front / near faces
  const inner = poly([P.p(c.X0, -c.H, c.Z1), P.p(c.X1, -c.H, c.Z1), P.p(c.X1, 0, c.Z1), P.p(c.X0, 0, c.Z1)]);
  return (
    <g>
      <Box P={P} X0={c.X0} X1={c.X1} Y0={-c.H} Y1={0} Z0={c.Z0} Z1={c.Z1} ink={TIMBER} uid={`${uid}-bx`} hatch />
      {/* the open top: its inside (dark), the bowls packed, the near rim over them */}
      <path d={poly([P.p(c.X0 + 5, -c.H, c.Z0 + 5), P.p(c.X1 - 5, -c.H, c.Z0 + 5), P.p(c.X1 - 5, -c.H, c.Z1 - 5), P.p(c.X0 + 5, -c.H, c.Z1 - 5)])} fill="#1E1811" stroke={DARK} strokeWidth={sw} />
      <clipPath id={`${uid}-in`}>
        <path d={poly([P.p(c.X0 + 5, -c.H, c.Z0 + 5), P.p(c.X1 - 5, -c.H, c.Z0 + 5), P.p(c.X1 - 5, -c.H, c.Z1 - 5), P.p(c.X0 + 5, -c.H, c.Z1 - 5)])} />
      </clipPath>
      <g clipPath={`url(#${uid}-in)`}>{rims}</g>
      <path d={inner} fill="none" />
      {/* slats on the front face */}
      <path d={`M${Pt(P.p(c.X0, -c.H * 0.5, c.Z0))}L${Pt(P.p(c.X1, -c.H * 0.5, c.Z0))}`} stroke={DARK} strokeWidth={sw * 0.7} strokeOpacity={0.6} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// CUT C's CAMERA AND END STATE (cut D opens on C_END)
// ---------------------------------------------------------------------------
/** progress 0..1: a drift share spread over [0, 210] plus a raised-cosine velocity lobe a..b */
const lobe = (a: number, b: number) => (f: number) => {
  const L2 = b - a;
  const x = Math.max(0, Math.min(L2, f - a));
  return (x - (L2 / (2 * Math.PI)) * Math.sin((2 * Math.PI * x) / L2)) / L2;
};
const C_LAST = 210;
/** a channel: v0 plus raised-cosine velocity lobes [from, to, change] (each lobe one smooth move; overlapping lobes keep
 *  the camera moving between moves) */
type Lobe = readonly [number, number, number];
const channel = (v0: number, lobes: readonly Lobe[]) => (f: number) => lobes.reduce((v, [a, b, d]) => v + d * lobe(a, b)(f), v0);
/** cut C's camera, keyed on the words (Revision 1):
 *  f0-~28 CLOSE on the sale (the slave, the dealer presenting him, the buyer), a slow push so it is alive;
 *  f24-80 one sideways pan at the same close zoom over the seam onto the lit workshop (lands by "economic growth");
 *  f66-150 a slow drift along the rows and the rack while the bowls stack;
 *  f133-194 one zoom-out to the wide showing both halves (the crack and the slide play in it, landing on "together");
 *  then a creep to f210. */
export const C_CAM = {
  x: [-255, [[-14, 44, 14], [24, 80, 458], [66, 150, 30], [133, 194, -268], [180, 260, -4]]] as const,
  lnk: [Math.log(2.1), [[-18, 50, Math.log(2.2 / 2.1)], [60, 150, Math.log(2.26 / 2.2)], [133, 194, Math.log(1.31 / 2.26)], [185, 260, Math.log(0.985)]]] as const,
  y: [-330, [[-18, 50, -3], [24, 80, -155], [66, 150, -6], [133, 194, 151], [185, 260, 2]]] as const,
};
const CX = channel(C_CAM.x[0], C_CAM.x[1]);
const LK = channel(C_CAM.lnk[0], C_CAM.lnk[1]);
const CY = channel(C_CAM.y[0], C_CAM.y[1]);
export const cutCCamBase = (f: number): Cam => ({ k: Math.exp(LK(f)), cx: CX(f), cy: CY(f) });
/** cut C's camera, the house hand included */
export const cutCCamAt = (f: number): Cam => swayCam(cutCCamBase(f), f);

/** cut C's timeline: the crack (seam) and the slide (split), the bowls' fill */
export const C_SEAM: readonly [number, number] = [146, 156];
export const C_SPLIT: readonly [number, number] = [152, 189];
export const cutCSeam = (f: number) => ease((f - C_SEAM[0]) / (C_SEAM[1] - C_SEAM[0]));
export const cutCSplit = (f: number) => {
  const x = c01((f - C_SPLIT[0]) / (C_SPLIT[1] - C_SPLIT[0]));
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** the bowls: already working at f0 (0.22), rising f48 -> 140 (in view from the pan's landing, "growth ... innovation is good"), still stacking to the end */
export const cutCStack = (f: number) => 0.22 + 0.6 * ease((f - 48) / 92) + 0.12 * c01((f - 120) / 90);

/** cut C's last frame (f210), exactly: cut D's frame 0 */
export const C_END = {
  frame: C_LAST,
  cam: cutCCamAt(C_LAST),
  split: cutCSplit(C_LAST),
  seam: cutCSeam(C_LAST),
  stack: cutCStack(C_LAST),
  /** the figures' poses on that frame (local positions above: MAIN_SLAVE, WAITING, DEALER, BUYER, BACK_STATIONS) */
  poses: {
    main: mainSlavePose(C_LAST),
    waiting: WAITING.map((_, i) => waitingPose(i, C_LAST)),
    dealer: dealerPose(C_LAST),
    buyer: buyerPose(C_LAST),
    potterPhases: BACK_STATIONS.map((_, i) => potterPhase(i, C_LAST)),
  },
};
