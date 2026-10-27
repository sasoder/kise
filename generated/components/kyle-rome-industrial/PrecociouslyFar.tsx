// ---------------------------------------------------------------------------
// PrecociouslyFar (kyle-rome-industrial, cut 77). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 220 frames. REV 2 (the user's notes, Oct 27): a new picture, standalone set.
// One stage inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective, from the
// kit kits/dwarkesh-3d/dwarkesh3d (its header is the API).
//
// CHECK LINE: "A Roman grinding grain by hand got as far as skill alone could take him; the steam mill that does the
// same job many times over needed the research and engineering Rome never had — the bridge between them was never
// built."
//
// THE LINE: "[They] don't have research and engineering that drives continuous productivity gain. So I think they go
// like precociously far in a pre-industrial setting [where you take trade really far]."
// WORD -> FRAME (REV2 table): don't have research and engineering 8-37 · drives 76 · continuous 89 · productivity 112 ·
//   gain 124 · they go 147-156 · precociously 174 · far 199
// DURATION: the slot 77.144 -> 84.484 s = 7.340 s x 29.97 = 220 frames (f0..f219).
//
// THE MOTION (Rev 2c): one continuous world, one camera. f0-62 "don't have research and engineering": a Roman freeman
// kneels on a stone terrace at a rotary hand quern and turns it (his fist on the handle every frame), flour trickling
// into a small basket; a plaster house behind. f60-136 "that drives continuous productivity gain": an eased pan right
// across a short gap. From the terrace's ledge one moving tip draws a single DASHED ORANGE line (even dashes along one
// smooth rising curve) climbing toward the mill's higher floor; it fades to nothing after a third of the way, well
// short of the mill. Beyond the gap, on a raised brick plinth, an 1800s steam flour mill: a brick chimney smoking
// without a break over the boiler; a small engine in front (iron cylinder, orange piston rod and connecting rod
// turning a crank on a small orange flywheel); a belt up to the line shaft and belts down to two millstone pairs with
// orange crown gears; the mill house behind with dim, warm windows. A worker in a cap stands at the front, hands at a
// stack of full sacks that grows down a chute from the stones (one every 14 f, then one every 20 f after f174, so it
// never looks finished). f136-196 "So they go precociously far": the camera eases back left and out to a two-shot:
// one man and his basket on his terrace, the faded dashed climb, one man and his growing stack; a living hold to f219.
// CAUSE BEFORE EFFECT: the quern turns only with the Roman's fist on its handle (romeFolk grip); flour leaves the
// quern into the basket; the engine's rods drive the flywheel's crank, the flywheel's belt the shaft, the shaft's belts
// the stones; sacks leave the chute's mouth before they land on the stack.
// Orange = technology: the engine's rods and flywheel, the shaft's pulleys, the crown gears, the boiler's fire door,
// and the dashed climb (the technology Rome never built). People, flour, sacks, stone, brick and timber in muted
// local colours; the windows a dim warm brown, darker than the machinery.
//
// DEPTH: cast units (a man 312 = 1.75 m; U 178 / m), eye 2 m up (eyeY -356), dRef 1800 at kRef 2, dolly 0.5, fog by
// the eye's distance. Roman terrace X -620..380, top Y -90, Z -320..900; quern X 120, Z -150 (near the lens, so he stays
// ~254 px tall in the two-shot). The gap X 380..520; the mill's plinth X 520..1700, top Y -180. Engine X 530..700, Z 110;
// boiler X 540..690, Z 470; chimney X 585, Z 560 (top -960); shaft Y -700, Z 430; stones X 860 / 1110, Z 430; worker
// X 708, Z 40; stack X 745.., Z 140. The dashed line: from (380, -90) along y ~ t^1.45 toward (560, -800) at Z -60,
// drawn to 31 % of that run and faded out from 12 % to 29 %. Camera keys in CAM_KEYS (end zoom 1.037).
//
// SOURCES (illustrative, no figures on screen): Roman rotary hand querns (Pompeii, Saalburg finds): two stones, the
// upper turned by an upright handle; flour collected round the base. Steam flour mills: Albion Mills, Southwark (1786),
// Boulton & Watt rotative engines driving pairs of millstones through line shafting (Wikipedia "Albion Mills").
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  AirBox,
  AirCyl,
  AirFloor,
  AirHorizonHazeW,
  AirShadow,
  AirStage,
  MAT,
  PandemicFolk,
  RomeFolk,
  WorldSvg,
  airWorldOf,
  c01,
  lerp,
  lineOf,
  makeCamera,
  mixHex,
  smoothstep,
  swayCam,
  workerScale,
  type AirWorld,
  type DepthOpts,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { solveArm } from "../kyle-rome-slavery/muscleOrMachineAir";

export const FPS = 30000 / 1001;
export const DURATION = 220;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

type V3 = [number, number, number];
type WorkerPose = PandemicFolk.WorkerPose;
type FolkArm = PandemicFolk.ArmPose;
const fx = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "0");
const pts = (q: P2[]) => q.map((v) => `${fx(v[0])},${fx(v[1])}`).join("L");
const poly = (q: P2[]) => `M${pts(q)}Z`;

// ===================================================================================================================
// CAMERA
// ===================================================================================================================
const U = 178;
const DEPTH: DepthOpts = { eyeY: -2 * U, dRef: 1800, kRef: 2, dolly: 0.5 };
/** hold on the Roman, an eased pan right to the mill, then ease back left and out so both stand in one frame */
export const CAM_KEYS = [
  { f: 0, k: 2.0, wx: 150, wy: -155 },
  { f: 60, k: 1.94, wx: 180, wy: -160 },
  { f: 136, k: 1.45, wx: 740, wy: -335 },
  { f: 196, k: 1.045, wx: 418, wy: -280 },
  { f: 219, k: 1.037, wx: 416, wy: -282 },
];
export const camAt = makeCamera(CAM_KEYS, true);
const REST = swayCam(camAt(0), 0);

// ===================================================================================================================
// THE SET
// ===================================================================================================================
const STONE: Mat = { lit: "#A39582", mid: "#857766", dark: "#4A4137" };
const PLASTER: Mat = { lit: "#C9B898", mid: "#A89878", dark: "#6E614E" };
const TILE: Mat = { lit: "#A2654B", mid: "#8E4F36", dark: "#4E2C20" };
const BRICK: Mat = { lit: "#9C6650", mid: "#7C4B3A", dark: "#42271E" };
const SLATE: Mat = { lit: "#7D8285", mid: "#5D6366", dark: "#33383B" };
const IRON: Mat = { lit: "#7A8382", mid: "#515A5B", dark: "#282E2F" };
const TIMBER = MAT.timber;
const LEATHER = "#5A3F2C";
const FLOUR = "#F1E9DA";
/** the Roman terrace */
export const TERR = { X0: -620, X1: 380, top: -90, Z0: -320, Z1: 900 };
export const QUERN = { X: 120, Z: -150 };
export const BASKET = { X: 215, Z: -175 };
/** the mill stands on a raised brick plinth across a short gap: floor level PL (higher than the Roman terrace) */
export const PLINTH = { X0: 520, X1: 1700, top: -180, Z0: -120, Z1: 1000 };
const PL = PLINTH.top;
/** the engine at the mill's left: a horizontal cylinder, its piston rod and connecting rod driving a crank on a small
 *  flywheel; the boiler and its chimney behind */
export const ENG = { cylX0: 530, cylX1: 590, Y: PL - 75, Z: 110, R: 24, flyX: 645, flyR: 54, crank: 18 };
export const BOILER = { X0: 530, X1: 690, Z: 470, R: 72 };
export const CHIMNEY = { X: 585, Z: 560, R: 38, top: -960 };
/** the line shaft overhead and the two millstone pairs it drives */
export const SHAFT = { X0: 620, X1: 1500, Y: PL - 520, Z: 430, R: 11 };
export const STONES = [860, 1110];
const STONE_Z = 430;
export const WORKER = { X: 708, Z: 40 };
/** the stack of full sacks at the plinth's front left, beside the gap (the Roman's basket faces it across the gap) */
export const STACK = { X0: 745, Z: 140, sw: 48, sh: 35 };
export const SACK_EVERY = 14;
export const SACK_LATE = 20;
/** the climb Rome never made: a dashed walkway rising from the terrace's ledge toward the mill, fading out halfway */
export const BRIDGE = { X0: TERR.X1, X1: 560, Y0: TERR.top, Y1: -800, Z0: -60, Z1: 120 };
export const DRAW = { a: 72, b: 124 };

/** the quern's turn (the Roman's own pace) */
const quernPhase = (f: number) => f / 46 + 0.2;
/** the engine's crank angle (rad) and the shaft's */
const crankAng = (f: number) => f * 0.12;
const shaftAng = (f: number) => f * 0.16;

// ===================================================================================================================
// HELPERS
// ===================================================================================================================
const at3 = (A: AirWorld, X: number, Y: number, Z: number) => ({ at: A.P.p(X, Y, Z), scale: A.P.r(Z) });
/** a disc facing the camera (a pulley, a wheel) */
const disc = (A: AirWorld, X: number, Y: number, Z: number, R: number) => {
  const c = A.P.p(X, Y, Z);
  return { c, r: R * A.P.r(Z) };
};

// ===================================================================================================================
// THE ROMAN SIDE
// ===================================================================================================================
const romanItems = (A: AirWorld, f: number): { z: number; el: React.ReactNode }[] => {
  const out: { z: number; el: React.ReactNode }[] = [];
  const T = TERR;
  // the terrace: a stone platform with a cream rim, the ledge at its right end
  out.push({ z: T.Z1 + 1, el: <AirBox key="terr" A={A} X0={T.X0} X1={T.X1} Y0={T.top} Y1={0} Z0={T.Z0} Z1={T.Z1} mat={STONE} uid="terr" /> });
  // the house behind: a plaster wall, a dark doorway, a tiled eave
  const WZ = 640;
  out.push({
    z: WZ + 60,
    el: (
      <g key="house">
        <AirBox A={A} X0={-600} X1={300} Y0={-640} Y1={T.top} Z0={WZ} Z1={WZ + 60} mat={PLASTER} uid="hw" />
        <path d={poly([A.P.p(-260, T.top, WZ - 1), A.P.p(-120, T.top, WZ - 1), A.P.p(-120, -400, WZ - 1), A.P.p(-260, -400, WZ - 1)])} fill={A.tone("#3E3226", WZ, 200)} />
        <path d={poly([A.P.p(60, -300, WZ - 1), A.P.p(140, -300, WZ - 1), A.P.p(140, -400, WZ - 1), A.P.p(60, -400, WZ - 1)])} fill={A.tone("#3E3226", WZ, 300)} />
        <path d={poly([A.P.p(-600, T.top - 0, WZ - 1), A.P.p(300, T.top, WZ - 1), A.P.p(300, T.top - 60, WZ - 1), A.P.p(-600, T.top - 60, WZ - 1)])} fill={A.tone("#7E5040", WZ, 120)} />
        <AirBox A={A} X0={-630} X1={330} Y0={-690} Y1={-640} Z0={WZ - 90} Z1={WZ + 60} mat={TILE} uid="eave" />
      </g>
    ),
  });
  // a grain sack and an amphora by the wall
  {
    const s = at3(A, -40, T.top, 470);
    const a = at3(A, 10, T.top, 520);
    out.push({
      z: 470,
      el: (
        <g key="rprops">
          <AirShadow A={A} X={-40} Z={470} w={50} d={26} Y={T.top} uid="rsk" amt={0.7} />
          <RomeFolk.Sack at={s.at} scale={s.scale} uid="rsack" fog={A.folkFog(470)} />
          <RomeFolk.Amphora at={a.at} scale={a.scale} uid="ramph" fog={A.folkFog(520)} />
        </g>
      ),
    });
  }
  // the quern and the grinder (his fist on the handle every frame)
  const ph = quernPhase(f);
  const q = at3(A, QUERN.X, T.top, QUERN.Z);
  const g = at3(A, QUERN.X - RomeFolk.GRIND.quernDX, T.top, QUERN.Z);
  const hand = RomeFolk.quernHandle(q.at, q.scale, ph, 1);
  const pose = RomeFolk.POSES.grind(1, ph);
  // the basket fills a little (flour falls from the quern's rim)
  const full = 0.18 + 0.32 * c01(f / 219);
  const bk = at3(A, BASKET.X, T.top, BASKET.Z);
  const rim = A.P.p(QUERN.X + 32, T.top - 40, QUERN.Z - 10);
  const into = A.P.p(BASKET.X - 6, T.top - 50, BASKET.Z);
  const r = A.P.r(QUERN.Z);
  const trickle: React.ReactNode[] = [];
  for (let k = 0; k < 5; k++) {
    const t = ((f * 0.09 + k / 5) % 1 + 1) % 1;
    const x = lerp(rim[0], into[0], t);
    const y = lerp(rim[1], into[1], t) - 14 * r * Math.sin(Math.PI * t);
    trickle.push(<circle key={k} cx={fx(x)} cy={fx(y)} r={fx(2.4 * r)} fill={FLOUR} opacity={0.75} />);
  }
  out.push({
    z: QUERN.Z,
    el: (
      <g key="grind">
        <AirShadow A={A} X={QUERN.X - 30} Z={QUERN.Z} w={110} d={40} Y={T.top} uid="gsh" amt={0.75} />
        <AirShadow A={A} X={BASKET.X} Z={BASKET.Z} w={34} d={20} Y={T.top} uid="bsh" amt={0.6} />
        <RomeFolk.RotaryQuern at={q.at} scale={q.scale} turn={ph} dir={1} uid="quern" fog={A.folkFog(QUERN.Z)} />
        <RomeFolk.Basket at={bk.at} scale={bk.scale} full={full} uid="basket" fog={A.folkFog(BASKET.Z)} />
        <g>{trickle}</g>
        <RomeFolk.Freeman pose={pose} at={g.at} scale={g.scale} uid="grinder" variant={2} apron={false} pilleus={false} grip={{ L: hand }} fog={A.folkFog(QUERN.Z)} unitPx={A.k} />
      </g>
    ),
  });
  return out;
};

// ===================================================================================================================
// THE CLIMB ROME NEVER MADE: one smooth dashed orange line drawn by one tip from the ledge, rising
// toward the mill's higher floor, fading to nothing halfway
// ===================================================================================================================
const Bridge: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const B = BRIDGE;
  const uDraw = c01((f - DRAW.a) / (DRAW.b - DRAW.a));
  if (uDraw <= 0) return null;
  const L = B.X1 - B.X0;
  /** one smooth rising curve (concave up: it steepens as it climbs) */
  const yAt = (x: number) => lerp(B.Y0, B.Y1, Math.pow(c01((x - B.X0) / L), 1.45));
  const fade = (x: number) => 1 - smoothstep(0.12, 0.29, (x - B.X0) / L);
  const tipX = B.X0 + uDraw * L * 0.31;
  const z = B.Z0;
  const col = A.toneO(ACCENT, z, 100);
  // even dashes along the curve's world arc length, all one width
  const NS = 240;
  const xs: number[] = [];
  const arc: number[] = [0];
  for (let i = 0; i <= NS; i++) {
    const x = B.X0 + (L * 0.31 * i) / NS;
    xs.push(x);
    if (i) arc.push(arc[i - 1] + Math.hypot(x - xs[i - 1], yAt(x) - yAt(xs[i - 1])));
  }
  const xAtArc = (s0: number) => {
    for (let i = 1; i < arc.length; i++) if (arc[i] >= s0) return lerp(xs[i - 1], xs[i], (s0 - arc[i - 1]) / Math.max(1e-6, arc[i] - arc[i - 1]));
    return xs[xs.length - 1];
  };
  const DASH = 34;
  const GAP = 24;
  const els: React.ReactNode[] = [];
  const r = A.P.r(z);
  for (let s0 = 0; s0 < arc[arc.length - 1]; s0 += DASH + GAP) {
    const xa = xAtArc(s0);
    if (xa >= tipX) break;
    const xb = Math.min(tipX, xAtArc(s0 + DASH));
    const op = fade((xa + xb) / 2);
    if (op < 0.02) continue;
    const q: P2[] = [];
    for (let k = 0; k <= 6; k++) {
      const x = lerp(xa, xb, k / 6);
      q.push(A.P.p(x, yAt(x), z));
    }
    els.push(<path key={s0} d={`M${pts(q)}`} stroke={col} strokeWidth={fx(15 * r)} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={op} />);
  }
  const tp = A.P.p(tipX, yAt(tipX), B.Z0);
  const tipOp = fade(tipX) * (1 - smoothstep(DRAW.b, DRAW.b + 10, f));
  return (
    <g>
      <defs>
        <radialGradient id="pf-tip">
          <stop offset="0" stopColor="#FFEBC0" stopOpacity={0.95} />
          <stop offset="0.3" stopColor={ACCENT} stopOpacity={0.55} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
        <filter id="pf-bglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      <g filter="url(#pf-bglow)" opacity={0.5}>
        {els}
      </g>
      {els}
      {tipOp > 0.02 ? <circle cx={fx(tp[0])} cy={fx(tp[1])} r={fx(30 * A.P.r(B.Z0))} fill="url(#pf-tip)" opacity={tipOp} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE STEAM MILL
// ===================================================================================================================
type It = { z: number; el: React.ReactNode };
/** soft smoke puffs from a chimney's mouth, rising and drifting left with the wind, swelling and thinning */
const Smoke: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; f: number; uid: string }> = ({ A, X, Y, Z, f, uid }) => {
  const P = 5;
  const N = 34;
  const els: React.ReactNode[] = [];
  const base = Math.floor(f / P);
  for (let k = N - 1; k >= 0; k--) {
    const born = (base - k) * P;
    const age = f - born;
    if (age < 0) continue;
    const t = age / (N * P);
    const x = X - (1.1 * age + 0.004 * age * age) + Math.sin(age / 15 + born) * 8;
    const y = Y - (1.9 * age - 0.004 * age * age);
    const rad = 22 + 0.75 * age;
    const a = Math.pow(1 - c01(t), 1.6) * 0.6 * Math.min(1, age / 5);
    if (a < 0.01) continue;
    const p = A.P.p(x, y, Z);
    els.push(<circle key={k} cx={fx(p[0])} cy={fx(p[1])} r={fx(rad * A.P.r(Z))} fill={`url(#${uid}g)`} opacity={a} />);
  }
  const col = A.tone("#6F675B", Z, 400);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor={col} stopOpacity={0.8} />
          <stop offset="0.5" stopColor={col} stopOpacity={0.4} />
          <stop offset="1" stopColor={col} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els}
    </g>
  );
};
const millItems = (A: AirWorld, f: number): It[] => {
  const out: It[] = [];
  const Pz = PLINTH;
  // the plinth: a raised brick floor, its face toward us
  out.push({ z: Pz.Z1 + 2, el: <AirBox key="plinth" A={A} X0={Pz.X0} X1={Pz.X1} Y0={PL} Y1={0} Z0={Pz.Z0} Z1={Pz.Z1} mat={BRICK} uid="plinth" /> });
  // the mill house behind: a brick wall with tall windows in a warm, muted glow (darker than the machinery)
  const BZ = 960;
  const wins: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const X0 = 760 + i * 190;
    const glow = 0.5 + 0.5 * Math.sin(f / 13 + i * 1.7) * Math.sin(f / 29 + i);
    const top = PL - 620;
    const bot = PL - 330;
    const q = [A.P.p(X0, bot, BZ - 1), A.P.p(X0 + 100, bot, BZ - 1), A.P.p(X0 + 100, top, BZ - 1), A.P.p(X0, top, BZ - 1)];
    const arc = A.P.p(X0 + 50, top - 50, BZ - 1);
    wins.push(<path key={i} d={`M${pts([q[0], q[1], q[2]])}Q${fx(arc[0])},${fx(arc[1] - 25 * A.P.r(BZ))} ${fx(q[3][0])},${fx(q[3][1])}Z`} fill={A.tone(mixHex("#5E4632", "#9A6A3A", glow * 0.6), BZ, 700)} />);
  }
  out.push({
    z: BZ + 60,
    el: (
      <g key="mhouse">
        <AirBox A={A} X0={720} X1={1900} Y0={PL - 760} Y1={PL} Z0={BZ} Z1={BZ + 60} mat={BRICK} uid="mh" />
        <AirBox A={A} X0={700} X1={1920} Y0={PL - 800} Y1={PL - 760} Z0={BZ - 40} Z1={BZ + 80} mat={SLATE} uid="mhr" />
        {wins}
      </g>
    ),
  });
  // the boiler house: a horizontal boiler with its glowing fire door, and the tall chimney smoking without a break
  {
    const B = BOILER;
    const C = CHIMNEY;
    const yAx = PL - B.R - 10;
    const a = A.P.p(B.X0, yAx, B.Z - B.R);
    const r = A.P.r(B.Z);
    const fd = A.P.p(B.X0 + 30, yAx + 12, B.Z - B.R - 2);
    const flick = 0.75 + 0.25 * Math.sin(f / 3.1) * Math.sin(f / 7.3);
    out.push({
      z: C.Z + 10,
      el: (
        <g key="chim">
          <AirCyl A={A} X={C.X} Z={C.Z} R={C.R} Y0={C.top} Y1={PL} mat={BRICK} uid="chim" joints={[C.top + 40]} />
          <Smoke A={A} X={C.X} Y={C.top - 10} Z={C.Z} f={f} uid="csm" />
        </g>
      ),
    });
    out.push({
      z: B.Z,
      el: (
        <g key="boiler">
          <AirBox A={A} X0={B.X0} X1={B.X1} Y0={yAx - B.R} Y1={PL} Z0={B.Z - B.R} Z1={B.Z + B.R} mat={IRON} uid="boil" />
          <path d={`M${pts([a, A.P.p(B.X1, yAx, B.Z - B.R)])}`} stroke={A.tone(IRON.lit, B.Z, 300)} strokeWidth={fx(3 * r)} />
          <rect x={fx(fd[0])} y={fx(fd[1])} width={fx(46 * r)} height={fx(34 * r)} fill={A.toneO(mixHex(ACCENT_DEEP, ACCENT, flick), B.Z, 200)} />
        </g>
      ),
    });
    // the steam pipe from the boiler to the engine's cylinder
    const p0 = A.P.p(B.X1 - 30, yAx - B.R, B.Z - 20);
    const p1 = A.P.p(B.X1 - 30, ENG.Y - ENG.R - 60, ENG.Z + 60);
    const p2 = A.P.p(ENG.cylX0 + 40, ENG.Y - ENG.R - 60, ENG.Z);
    out.push({ z: ENG.Z + 70, el: <path key="pipe" d={`M${pts([p0, p1, p2])}`} fill="none" stroke={A.tone(IRON.mid, ENG.Z, 300)} strokeWidth={fx(14 * A.P.r(ENG.Z))} strokeLinejoin="round" /> });
  }
  // the engine: cylinder, piston rod, connecting rod, crank on a small flywheel (orange: the machine)
  {
    const E = ENG;
    const ang = crankAng(f);
    const crankP: V3 = [E.flyX + Math.cos(ang) * E.crank, E.Y + Math.sin(ang) * E.crank, E.Z - 20];
    const rodL = 150;
    const xh = crankP[0] - Math.sqrt(Math.max(1, rodL * rodL - (crankP[1] - E.Y) ** 2));
    const head: V3 = [xh, E.Y, E.Z - 20];
    const o = A.toneO(ACCENT, E.Z, 200);
    const od = A.toneO(ACCENT_DEEP, E.Z, 200);
    const r = A.P.r(E.Z);
    const fw = disc(A, E.flyX, E.Y, E.Z - 10, E.flyR);
    const spokes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const t = ang + (i * Math.PI) / 3;
      spokes.push(`M${fx(fw.c[0])},${fx(fw.c[1])}L${fx(fw.c[0] + Math.cos(t) * fw.r * 0.88)},${fx(fw.c[1] + Math.sin(t) * fw.r * 0.88)}`);
    }
    const P3 = (v: V3) => A.P.p(v[0], v[1], v[2]);
    out.push({
      z: E.Z,
      el: (
        <g key="engine">
          <AirBox A={A} X0={E.cylX0 - 20} X1={E.flyX + 40} Y0={E.Y + E.R + 6} Y1={PL} Z0={E.Z - 40} Z1={E.Z + 40} mat={STONE} uid="ebed" />
          <AirBox A={A} X0={E.flyX - 18} X1={E.flyX + 18} Y0={E.Y} Y1={E.Y + E.R + 6} Z0={E.Z - 30} Z1={E.Z + 30} mat={IRON} uid="ebear" />
          <AirBox A={A} X0={E.cylX0} X1={E.cylX1} Y0={E.Y - E.R} Y1={E.Y + E.R} Z0={E.Z - E.R} Z1={E.Z + E.R} mat={IRON} uid="ecyl" />
          <path d={`M${pts([P3([E.cylX1, E.Y, E.Z - 20]), P3(head)])}`} stroke={o} strokeWidth={fx(8 * r)} strokeLinecap="round" />
          <path d={`M${pts([P3(head), P3(crankP)])}`} stroke={od} strokeWidth={fx(10 * r)} strokeLinecap="round" />
          <circle cx={fx(fw.c[0])} cy={fx(fw.c[1])} r={fx(fw.r)} fill="none" stroke={o} strokeWidth={fx(fw.r * 0.14)} />
          <path d={spokes.join("")} stroke={od} strokeWidth={fx(fw.r * 0.07)} strokeLinecap="round" />
          <circle cx={fx(fw.c[0])} cy={fx(fw.c[1])} r={fx(fw.r * 0.16)} fill={o} />
          <circle cx={fx(P3(crankP)[0])} cy={fx(P3(crankP)[1])} r={fx(7 * r)} fill={od} />
        </g>
      ),
    });
  }
  // belts (leather, running): from the flywheel's rim up to the shaft's drive pulley, and from the shaft to each stone
  const pulleyR = 30;
  const belt = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, R0: number, R1: number, key: string, z: number, speed: number): It => {
    const a0 = A.P.p(x0 - R0, y0, z0);
    const a1 = A.P.p(x1 - R1, y1, z1);
    const b0 = A.P.p(x0 + R0, y0, z0);
    const b1 = A.P.p(x1 + R1, y1, z1);
    const r = A.P.r((z0 + z1) / 2);
    const col = A.tone(LEATHER, (z0 + z1) / 2, 300);
    const hi = A.tone("#8A6A50", z, 300);
    return {
      z,
      el: (
        <g key={key}>
          <path d={`M${pts([a0, a1])}M${pts([b0, b1])}`} stroke={col} strokeWidth={fx(7 * r)} />
          <path d={`M${pts([a0, a1])}`} stroke={hi} strokeWidth={fx(3 * r)} strokeDasharray={`${fx(10 * r)} ${fx(26 * r)}`} strokeDashoffset={fx(-speed * f * r)} />
          <path d={`M${pts([b1, b0])}`} stroke={hi} strokeWidth={fx(3 * r)} strokeDasharray={`${fx(10 * r)} ${fx(26 * r)}`} strokeDashoffset={fx(-speed * f * r)} />
        </g>
      ),
    };
  };
  out.push(belt(ENG.flyX, ENG.Y, ENG.Z - 30, ENG.flyX, SHAFT.Y, SHAFT.Z, ENG.flyR * 0.6, pulleyR + 6, "dbelt", (ENG.Z + SHAFT.Z) / 2 - 30, 5));
  {
    const a = A.P.p(SHAFT.X0, SHAFT.Y, SHAFT.Z);
    const b = A.P.p(SHAFT.X1, SHAFT.Y, SHAFT.Z);
    const r = A.P.r(SHAFT.Z);
    const pulleys = [ENG.flyX, ...STONES].map((X, i) => {
      const { c, r: pr } = disc(A, X, SHAFT.Y, SHAFT.Z - 1, pulleyR + (i ? 0 : 6));
      const t = shaftAng(f) + i;
      return (
        <g key={i}>
          <ellipse cx={fx(c[0])} cy={fx(c[1])} rx={fx(pr * 0.38)} ry={fx(pr)} fill={A.toneO(ACCENT, SHAFT.Z, 600)} stroke={A.toneO(ACCENT_DEEP, SHAFT.Z, 600)} strokeWidth={fx(2 * r)} />
          <path d={`M${fx(c[0])},${fx(c[1] + Math.cos(t) * pr * 0.8)}L${fx(c[0])},${fx(c[1] - Math.cos(t) * pr * 0.8)}`} stroke={A.toneO(ACCENT_DEEP, SHAFT.Z, 600)} strokeWidth={fx(3 * r)} />
        </g>
      );
    });
    const hang = [700, 990, 1300].map((X) => {
      const h0 = A.P.p(X, PL - 760, SHAFT.Z);
      const h1 = A.P.p(X, SHAFT.Y, SHAFT.Z);
      return <path key={X} d={`M${pts([h0, h1])}`} stroke={A.tone(IRON.dark, SHAFT.Z, 900)} strokeWidth={fx(6 * r)} />;
    });
    out.push({
      z: SHAFT.Z + 5,
      el: (
        <g key="shaft">
          {hang}
          <path d={`M${pts([a, b])}`} stroke={A.tone(IRON.mid, SHAFT.Z, 600)} strokeWidth={fx(SHAFT.R * 2 * r)} strokeLinecap="round" />
          {pulleys}
        </g>
      ),
    });
  }
  // the millstone pairs: a timber hurst, the stone tun, the orange crown gear on its spindle, a belt from the shaft
  STONES.forEach((X, i) => {
    const Z = STONE_Z;
    const hY = PL - 150;
    const tunTop = hY - 70;
    const gearY = tunTop - 55;
    out.push(belt(X, gearY, Z, X, SHAFT.Y, SHAFT.Z, 24, pulleyR, `sb${i}`, Z + 1, 4.2));
    const g = disc(A, X, gearY, Z, 32);
    const tt = shaftAng(f) * 1.3 + i;
    const teeth: string[] = [];
    for (let k = 0; k < 10; k++) {
      const t = tt + (k * Math.PI) / 5;
      teeth.push(`M${fx(g.c[0] + Math.cos(t) * g.r * 0.7)},${fx(g.c[1] + Math.sin(t) * g.r * 0.35)}L${fx(g.c[0] + Math.cos(t) * g.r)},${fx(g.c[1] + Math.sin(t) * g.r * 0.5)}`);
    }
    out.push({
      z: Z,
      el: (
        <g key={`stone${i}`}>
          <AirShadow A={A} X={X} Z={Z} w={150} d={80} Y={PL} uid={`ss${i}`} amt={0.7} />
          <AirBox A={A} X0={X - 105} X1={X + 105} Y0={hY} Y1={PL} Z0={Z - 80} Z1={Z + 80} mat={TIMBER} uid={`hu${i}`} />
          <AirCyl A={A} X={X} Z={Z} R={82} Y0={tunTop} Y1={hY} mat={STONE} uid={`tun${i}`} />
          <AirCyl A={A} X={X} Z={Z} R={7} Y0={gearY} Y1={tunTop} mat={IRON} uid={`sp${i}`} />
          <ellipse cx={fx(g.c[0])} cy={fx(g.c[1])} rx={fx(g.r)} ry={fx(g.r * 0.45)} fill={A.toneO(ACCENT, Z, 300)} stroke={A.toneO(ACCENT_DEEP, Z, 300)} strokeWidth={fx(2 * A.P.r(Z))} />
          <path d={teeth.join("")} stroke={A.toneO(ACCENT_DEEP, Z, 300)} strokeWidth={fx(4 * A.P.r(Z))} strokeLinecap="round" />
        </g>
      ),
    });
  });
  return out;
};

/** the spout of the first stone and the sack under it, the worker tending it */
const SPOUT = { X: STONES[0] + 36, Z: STONE_Z - 84 };
const SACKP = { X: STONES[0] + 64, Z: 340 };
const REST_HIGH: FolkArm = { abd: 6, flex: 40, abd2: -4, flex2: 78, droop: 8, thumb: 0.55 };
const REST_LOW: FolkArm = { abd: 8, flex: 22, abd2: -8, flex2: 62, droop: 10, thumb: 0.5 };
const workerItems = (A: AirWorld, f: number): It[] => {
  const pl = at3(A, WORKER.X, PL, WORKER.Z);
  const scale = workerScale(pl.scale);
  const sp0 = A.P.p(SPOUT.X, PL - 160, SPOUT.Z);
  const sp1 = A.P.p(SACKP.X, PL - 105, SACKP.Z);
  const sk = at3(A, SACKP.X, PL, SACKP.Z);
  // his mittens on the stack's nearest sack (he squares the pile), standing in front of its left end
  const neck = A.P.p(STACK.X0 + 4, PL - STACK.sh * 0.9, STACK.Z - 30);
  const onSpout = A.P.p(STACK.X0 - 14, PL - STACK.sh * 1.5, STACK.Z - 30);
  const base: WorkerPose = { ...PandemicFolk.STAND, yaw: 62, headYaw: 6, headPitch: 12, headRoll: 3, bodyPitch: 8, bodyRoll: -1.6 + 0.8 * Math.sin(f / 37), breath: Math.sin(f / 21) };
  const loc = (t: P2): P2 => [(t[0] - pl.at[0]) / scale, (t[1] - pl.at[1]) / scale];
  const pose: WorkerPose = { ...base, armL: solveArm(base, 1, loc(onSpout), REST_HIGH), armR: solveArm(base, -1, loc(neck), REST_LOW) };
  const r = A.P.r(SPOUT.Z);
  const stream: React.ReactNode[] = [];
  for (let k = 0; k < 6; k++) {
    const t = ((f * 0.12 + k / 6) % 1 + 1) % 1;
    stream.push(<circle key={k} cx={fx(lerp(sp0[0], sp1[0], t))} cy={fx(lerp(sp0[1], sp1[1], t))} r={fx(3.2 * r)} fill={FLOUR} opacity={0.8} />);
  }
  return [
    {
      z: SPOUT.Z - 1,
      el: (
        <g key="spout">
          <path d={`M${pts([A.P.p(SPOUT.X - 14, PL - 185, SPOUT.Z + 20), A.P.p(SPOUT.X + 14, PL - 185, SPOUT.Z + 20), A.P.p(SPOUT.X + 10, PL - 152, SPOUT.Z), A.P.p(SPOUT.X - 10, PL - 152, SPOUT.Z)])}Z`} fill={A.tone(TIMBER.mid, SPOUT.Z, 200)} stroke={A.tone(lineOf(TIMBER), SPOUT.Z, 200)} strokeWidth={fx(1.2 * r)} />
          {stream}
        </g>
      ),
    },
    {
      z: SACKP.Z,
      el: (
        <g key="fsack">
          <AirShadow A={A} X={SACKP.X} Z={SACKP.Z} w={40} d={24} Y={PL} uid="fss" amt={0.7} />
          <RomeFolk.Sack at={sk.at} scale={sk.scale * 1.25} uid="fsack" fog={A.folkFog(SACKP.Z)} />
        </g>
      ),
    },
    {
      z: WORKER.Z,
      el: (
        <g key="worker">
          <AirShadow A={A} X={WORKER.X} Z={WORKER.Z} w={62} d={30} Y={PL} uid="wks" amt={0.8} />
          <PandemicFolk.FolkWorker pose={pose} x={pl.at[0]} y={pl.at[1]} scale={scale} uid="wk" unitPx={A.k} inks={A.workerInks(WORKER.Z)} />
        </g>
      ),
    },
  ];
};

/** the chute from the first stone down to the stack, and the stack growing one sack at a time (left to right, rows up) */
const STACK_SLOTS: { x: number; row: number }[] = (() => {
  const out: { x: number; row: number }[] = [];
  [3, 3, 3, 3, 2, 2, 1].forEach((n, row) => {
    for (let i = 0; i < n; i++) out.push({ x: STACK.X0 + (i + row * 0.5) * STACK.sw, row });
  });
  return out;
})();
const stackItems = (A: AirWorld, f: number): It[] => {
  // a sack every SACK_EVERY frames until f174, then every SACK_LATE (the mill never looks finished)
  const N0 = 3;
  const T0 = 6;
  const k174 = Math.floor((174 - T0) / SACK_EVERY);
  const prog = f < 174 ? Math.max(0, (f - T0) / SACK_EVERY) : k174 + (f - (T0 + k174 * SACK_EVERY)) / SACK_LATE;
  const landed = Math.min(STACK_SLOTS.length, N0 + Math.floor(prog));
  const tIn = prog % 1;
  const els: React.ReactNode[] = [];
  const Z = STACK.Z;
  const sackAt = (x: number, y: number, key: string, tilt = 0) => {
    const p = A.P.p(x, y, Z);
    const sc = A.P.r(Z) * 0.78;
    return (
      <g key={key} transform={tilt ? `rotate(${fx(tilt)} ${fx(p[0])} ${fx(p[1])})` : undefined}>
        <RomeFolk.Sack at={p} scale={sc} uid={key} fog={A.folkFog(Z)} />
      </g>
    );
  };
  for (let i = 0; i < landed; i++) els.push(sackAt(STACK_SLOTS[i].x, PL - STACK_SLOTS[i].row * STACK.sh, `st${i}`));
  // the next sack sliding down the chute toward its slot
  const chuteTop: V3 = [STONES[0] + 40, PL - 300, Z];
  if (landed < STACK_SLOTS.length) {
    const nx = STACK_SLOTS[landed];
    const t = smoothstep(0, 1, tIn);
    els.push(sackAt(lerp(chuteTop[0], nx.x, t), lerp(chuteTop[1], PL - nx.row * STACK.sh, t), `mv${landed}`, lerp(-24, 0, t)));
  }
  const c0 = A.P.p(chuteTop[0], chuteTop[1] - 20, Z + 120);
  const c1 = A.P.p(STACK.X0 + 2.2 * STACK.sw, PL - 260, Z + 40);
  const r = A.P.r(Z);
  return [
    { z: Z + 41, el: <path key="chute" d={`M${pts([c0, c1])}`} stroke={A.tone(TIMBER.mid, Z, 150)} strokeWidth={fx(20 * r)} strokeLinecap="round" /> },
    { z: Z, el: <g key="stack">{els}</g> },
  ];
};

/** the frame's foot sinks into the dense low air (the style's height ramp): no flat slab of floor in the bottom third */
const LowAir: React.FC<{ A: AirWorld }> = ({ A }) => {
  const col = mixHex(A.screenAir(1e5), "#30291F", 0.5);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="pf-low" x1={0} y1={0} x2={0} y2={1}>
          {[0, 0.3, 0.6, 1].map((t) => (
            <stop key={t} offset={t} stopColor={col} stopOpacity={fx(0.78 * t * t * (3 - 2 * t))} />
          ))}
        </linearGradient>
      </defs>
      <rect x={0} y={1150} width={1080} height={770} fill="url(#pf-low)" />
    </svg>
  );
};
// ===================================================================================================================
const PrecociouslyFar: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const cam = swayCam(camAt(cf), cf);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame });
  const items = [...romanItems(A, frame), ...millItems(A, frame), ...workerItems(A, frame), ...stackItems(A, frame), { z: BRIDGE.Z0 - 2, el: <Bridge key="bridge" A={A} f={frame} /> }];
  items.sort((a, b) => b.z - a.z);
  void random;
  return (
    <AirStage v={A.v} bloom={0.24}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-4000} x1={6000} z0={-5000} z1={6000} mat={MAT.ground} course={170} />
        <AirHorizonHazeW A={A} id="haze" />
        {items.map((it, i) => (
          <React.Fragment key={i}>{it.el}</React.Fragment>
        ))}
      </WorldSvg>
      <LowAir A={A} />
    </AirStage>
  );
};

export default PrecociouslyFar;
