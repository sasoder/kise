// ---------------------------------------------------------------------------
// BanksLendToDebtors (kyle-rome-industrial, cut 99). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 297 frames.
// One stage inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective, from the
// kit kits/dwarkesh-3d/dwarkesh3d (its header is the API). A standalone set: a Roman banker's table under the arcade of
// a forum basilica, and the street beyond it.
//
// CHECK LINE: "A Roman bank worked like a bank: depositors' coins go in, the banker keeps the balances, and he lends the
// money on to someone who uses it to start a business."
//
// THE LINE: "[There] are banks that take money from depositors and, you know, keep balances and then lend out to
// debtors who want to go and do entrepreneurial things. [So they have like so much potential…]"
// WORD -> FRAME (Whisper, ~6 frames early): are 1 · banks 5 · that 15 · take 41 · money 54 · from 61 · depositors 71 ·
// and 95 · you 109 · know 121 · keep 125 · balances 131 · and 144 · then 162 · lend 166 · out 173 · to 178 ·
// debtors 185 · who 202 · want 212 · to 219 · go 223 · and 231 · do 236 · entrepreneurial 258 · things 270 ·
// (So 287, the speaker on camera next)
// DURATION: the slot 99.600 -> 109.509 s = 9.909 s x 29.97 = 297 frames (f0..f296).
//
// THE MOTION (Revision 1: the stage turned into depth): one lateral glide, left to right at ONE even speed (1.75 units
// = ~4.2 screen px per frame, constant from
// f0 to f296, only the house hand-sway on top) and one zoom: a truck, the vanishing point travels with the eye, so the
// arcade behind parallaxes against the people. The stations are laid out along the glide so it never has to slow or
// re-accelerate: the money travels left to right and the camera follows it. f0-62 ("banks that take money from
// depositors"): the banker's timber table runs into the picture under the arcade of a forum basilica, the eye 3.9 m up
// looking down into it; at its left side a freeman tips his purse and silver
// coins pour onto the table (f24-62, the first lands ~f31), a freewoman with her purse and a slave carrying his master's
// pouch wait behind him, each a step further back (no head over another); the banker (a Dominus in a white toga with the stripe) rests a hand on his table.
// f64-100: he puts his hand to the heap and sweeps it across the table (contact f74, the coins ride ahead of his hand)
// and off its edge into the open iron-bound strongbox (arca) standing beside it (coins over the edge ~f92-102, each
// one vanishing below the box's front rim). f100-160 ("keep balances"): he lifts his wax-tablet codex off the table
// (contact f110), holds it up and writes, the stylus adding three rows of tally strokes to the right leaf (f124-150),
// then lays it down. f148-200 ("lend out to debtors"): he steps to the box, takes the full coin bag out by its neck
// (contact f172, it rises from f172) and holds it out across the box to the merchant waiting at the arcade's end (his
// hands on it at f190, the banker lets go at f198). f198-296 ("who want to go and
// do entrepreneurial things"): the merchant holds the bag to his chest, turns (f200-210) and walks out of the arcade's
// shade into the sunlit street (f208-252), past his new shop stocked with amphorae, to his carter waiting at a loaded
// handcart; the carter looks back at him (f238-250), the merchant opens his free hand toward the street ("go",
// f248-262), the carter nods (f254-264) and pushes off: the cart begins to roll at f270, its wheel turning by its
// travel. The resolved frame: the merchant with the bag, the carter and the rolling cart in the middle and right, the
// bank's arcade in shade on the left. No labels; the only marks are the ledger's tally strokes (artefact text).
// CAUSE BEFORE EFFECT: coins come out of the purse's mouth and land before they are swept; the sweeping hand touches
// the heap on the frame it moves (f74); the bag moves only while a hand holds it (banker f172-198, merchant from f190);
// the cart moves only with the carter's fists on its handles (from f270).
// DEVIATIONS FROM THE STORYBOARD (for the director): the strongbox stands BESIDE the table's end (so the sweep drops
// the coins straight in), not behind the banker; only the first depositor pours (a second pour behind him was hidden
// by his body); the merchant's payment of a coin to a worker became an open-hand "go" to his carter (two figures
// exchanging a coin merged into one blob at phone size).
// Orange: none (the clip's rule: orange = technology and ideas; money and business are not technology). Coins are
// silver / pale pewter, the bag leather, people in the folk cast's muted colours.
//
// DEPTH: eye 3.9 m up (eyeY -700), Dc 1000 units at the one zoom K 2.4 (no zoom: kRef = K), fog by the eye's distance.
// The table X 0-90 runs Z -80..240; the queue at Z 30 / 150 / 270; the banker Z 72 at its right side; the strongbox
// X 92-202, Z -60..20 against its near end (lid up, ~280 px wide); the arcade face Z 400; the shop row Z 520; the
// merchant Z 0; the carter Z 100, the cart Z 75-125.
//
// FACTS (header only; nothing on screen): Roman argentarii kept their banking tables (mensae) in the tabernae of the
// Forum (the Basilica Aemilia's tabernae argentariae); they took deposits, kept accounts (codex accepti et expensi),
// paid on clients' orders and lent at interest (J. Andreau, Banking and Business in the Roman World, 1999). Coins:
// silver denarii, drawn silver / pale pewter, never gold-orange.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AirBox,
  AirCyl,
  AirFloor,
  AirShadow,
  AirStage,
  MAT,
  RomeFolk,
  WorldSvg,
  airWorldOf,
  c01,
  lerp,
  lineOf,
  mixHex,
  smoothstep,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 30000 / 1001;
export const DURATION = 297;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type FigPose = RomeFolk.FigPose;
type V3 = [number, number, number];

// ===================================================================================================================
// CAMERA: one even lateral glide at one zoom (a truck; the VP travels with cx)
// ===================================================================================================================
const K = 2.4;
/** the eye 3.9 m up looking down into the stage (the table recedes, the queue's heads step up the frame), Dc 1000 */
const DEPTH: DepthOpts = { eyeY: -700, dRef: 1000, kRef: K, dolly: 0.5 };
/** world units per frame (at the front plane): ~4 screen px per frame */
const GLIDE_V = 1.75;
const GLIDE_X0 = -49;
const CAM_Y = -150;
const camAt = (f: number): Cam => ({ k: K, cx: GLIDE_X0 + GLIDE_V * f, cy: CAM_Y });
const REST = swayCam(camAt(0), 0);

// ===================================================================================================================
// HELPERS
// ===================================================================================================================
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
/** eased 0..1 over [a, b] */
const ez = (f: number, a: number, b: number) => smoothstep(a, b, f);
const lin = (f: number, a: number, b: number) => c01((f - a) / (b - a));
const mix2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** a point inside a quad [a, b, c, d] at (u along a->b, v along a->d) */
const bil = (q: P2[], u: number, v: number): P2 => mix2(mix2(q[0], q[1], u), mix2(q[3], q[2], u), v);
const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const rot2 = (v: P2, deg: number): P2 => {
  const a = (deg * Math.PI) / 180;
  return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
};
/** a track of 3D keys [f, point] (eased between keys) */
const track3 = (keys: [number, V3][]) => (f: number): V3 => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return mix3(keys[i - 1][1], keys[i][1], ez(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
/** a pose track: eased blends between keyed poses */
const poseTrack = (keys: [number, FigPose][]) => (f: number): FigPose => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return RomeFolk.lerpFig(keys[i - 1][1], keys[i][1], ez(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
/** a walk's travel (units) after `f`: the feet advance 2 * stride * amount / cycle per frame (planted feet never slide) */
const walkTravel = (f: number, f0: number, f1: number, ramp: number, stride: number, cycle: number) => {
  let s = 0;
  const end = Math.min(f, f1);
  for (let g = f0; g < end; g += 1) s += (2 * stride * walkAmt(g + 0.5, f0, f1, ramp)) / cycle;
  if (f > f0 && f < f1) {
    const g = Math.floor(f - f0) + f0;
    s -= (2 * stride * walkAmt(g + 0.5, f0, f1, ramp)) / cycle * (1 - (f - g));
  }
  return s;
};
const walkAmt = (f: number, f0: number, f1: number, ramp: number) => Math.min(ez(f, f0, f0 + ramp), 1 - ez(f, f1 - ramp, f1));

// ===================================================================================================================
// THE SET (units: the cast's, 178 per metre; Y up is -, floor Y 0; Z depth behind the front plane)
// The banker's table runs INTO the picture (its long sides receding to the VP); the depositors queue along its left side,
// each a step further back and to the left; the banker stands at its right side with the open strongbox in front of
// him against the table's near end; the merchant waits right of the box, at the arcade's end.
// ===================================================================================================================
const TABLE = { x0: 0, x1: 90, z0: -80, z1: 240, top: -151, th: 13 };
const BOX = { x0: 92, x1: 202, z0: -60, z1: 20, top: -140 };
const ARC = { z0: 400, z1: 470, spring: -380, ent0: -560, ent1: -650 };
/** pier centres (half width 30) and the arcade's end pier (the street opens to its right) */
const PIERS = [-580, -300, -20];
const END_PIER = { x0: 210, x1: 290 };
const SHOPS_Z = 520;
const STREET_X = 290;
/** the shade under the arcade: 1 left of SHADE_X0, 0 right of SHADE_X1 */
const SHADE_X0 = 220;
const SHADE_X1 = 350;

const COIN = { top: "#B7BDBA", edge: "#5C6362", glint: "#F4F2EA", r: 6.4, line: "#4A504F" };
const LEATHER = { lit: "#C4A57C", mid: "#9E7E58", dark: "#5E4632", tie: "#4A3527" };
const WOOD: Mat = { lit: "#9C7A55", mid: "#6F5539", dark: "#3A2B1D" };
const BOXWOOD: Mat = { lit: "#7E6247", mid: "#5C4632", dark: "#2F2219" };
const PLASTER: Mat = { lit: "#C8B898", mid: "#A89878", dark: "#6E614E" };
const TRAVERTINE: Mat = { lit: "#B8A88A", mid: "#988769", dark: "#625544" };
const FLOOR: Mat = { lit: "#9C8B72", mid: "#86765E", dark: "#4F4536" };
const HALL: Mat = { lit: "#857763", mid: "#6A5D4B", dark: "#3A3128" };
const ROOF: Mat = { lit: "#9A6650", mid: "#7A4E3C", dark: "#43291F" };

// ===================================================================================================================
// THE TIMELINE (frames)
// ===================================================================================================================
const T = {
  pour1: [24, 62] as const,
  sweep: [74, 98] as const,
  codexReach: [100, 110] as const,
  codexLift: [110, 122] as const,
  write: [124, 150] as const,
  codexDown: [150, 160] as const,
  boxReach: [160, 172] as const,
  bagLift: [172, 182] as const,
  bagOut: [182, 190] as const,
  bagHand: [190, 198] as const,
  hug: [198, 206] as const,
  turn: [200, 210] as const,
  walk: [208, 252] as const,
  coin: [248, 262] as const,
  carterFace: [236, 248] as const,
  carterTurn: [262, 272] as const,
  roll: [270, 297] as const,
};

// ---- the coins ----------------------------------------------------------------------------------------------------
type Coin = { te: number; rest: V3; g: number; tilt: number };
const N1 = 56;
const HEAP1 = { x: 45, z: 52 };
const COINS: Coin[] = (() => {
  const out: Coin[] = [];
  for (let i = 0; i < N1; i++) {
    const u = i / (N1 - 1);
    const a = hash(i, 11) * Math.PI * 2;
    const rad = Math.sqrt(hash(i, 12)) * (9 + 17 * u);
    const x = HEAP1.x + Math.cos(a) * rad;
    const zz = HEAP1.z + Math.sin(a) * rad * 0.8;
    const h = 1.8 + 24 * u * Math.max(0, 1 - rad / 30);
    out.push({ te: lerp(T.pour1[0] + 6, T.pour1[1] - 9, (i + hash(i, 15) * 0.8) / N1), rest: [x, TABLE.top - h, zz], g: 6 + 30 * hash(i, 13), tilt: (hash(i, 14) - 0.5) * 30 });
  }
  return out;
})();
const FALL_T = 9;
/** the sweep: the banker's hand travels a straight path across the table top, from left of the heap to the table's right
 *  edge by the box (S0 -> S1, in X/Z); each coin rides ahead of the hand by its packing gap once the hand reaches it */
const S0: P2 = [22, 60];
const S1: P2 = [TABLE.x1 - 2, -14];
const SL = Math.hypot(S1[0] - S0[0], S1[1] - S0[1]);
const SD: P2 = [(S1[0] - S0[0]) / SL, (S1[1] - S0[1]) / SL];
const sweepH = (f: number) => SL * ez(f, T.sweep[0], T.sweep[1]);
const sweepAt = (h: number): P2 => [S0[0] + SD[0] * h, S0[1] + SD[1] * h];
/** a coin's pushed X/Z (it rides ahead of the hand by its packing gap g) */
const pushedXZ = (c: Coin, f: number): P2 => {
  if (f < T.sweep[0]) return [c.rest[0], c.rest[2]];
  const u = (c.rest[0] - S0[0]) * SD[0] + (c.rest[2] - S0[1]) * SD[1];
  const off = Math.max(0, sweepH(f) + c.g * 0.5 + 4 - u);
  return [c.rest[0] + SD[0] * off, c.rest[2] + SD[1] * off];
};
/** the frame a pushed coin goes over the table's right edge (Infinity if never) */
const edgeFrame = (c: Coin): number => {
  for (let g = T.sweep[0]; g <= T.sweep[1] + 1; g += 0.25) if (pushedXZ(c, g)[0] >= TABLE.x1) return g;
  return Infinity;
};
const EDGE = COINS.map(edgeFrame);
/** coins in the box by frame f (raises the fill) */
const BOX_FILL0 = -104;
const coinsIn = (f: number) => EDGE.filter((e) => f >= e + 7).length;

// ---- the codex (wax-tablet ledger): its centre, tilt (90 = lying flat, ~15 = held up facing us) -------------------
const CODEX_W = 31;
const CODEX_H = 38;
const CODEX_TABLE: V3 = [56, TABLE.top - 1.5, 132];
const CODEX_HELD: V3 = [122, -244, 42];
const codexC = track3([
  [T.codexLift[0], CODEX_TABLE],
  [T.codexLift[1], CODEX_HELD],
  [T.codexDown[0], CODEX_HELD],
  [T.codexDown[1], CODEX_TABLE],
]);
const codexTilt = (f: number) => (f < T.codexDown[0] ? lerp(90, 14, ez(f, T.codexLift[0], T.codexLift[1])) : lerp(14, 90, ez(f, T.codexDown[0], T.codexDown[1])));
/** codex local (u across, v down the leaf) -> 3D */
const codexPt = (f: number, u: number, v: number): V3 => {
  const c = codexC(f);
  const t = (codexTilt(f) * Math.PI) / 180;
  return [c[0] + u, c[1] + v * Math.cos(t), c[2] + v * Math.sin(t)];
};
/** the new entries: rows of tally strokes on the right leaf, written f124-150 */
const ROWS = [
  { v: -11, n: 7 },
  { v: -2, n: 5 },
  { v: 7, n: 8 },
];
const STROKES = ROWS.flatMap((r, j) => Array.from({ length: r.n }, (_, i) => ({ u: 6 + i * 3.1 + (i % 5 === 4 ? 1.5 : 0), v: r.v, j, x: i % 5 === 4 })));
const strokesDone = (f: number) => STROKES.length * lin(f, T.write[0], T.write[1] - 2);

// ---- the bag (a tied leather coin bag, ~150 px tall at the hand-over) ---------------------------------------------
const BAG_K = 1.25;
const BAG_IN_BOX: V3 = [150, -142, -20];
const BAG_UP: V3 = [156, -226, -20];
const BAG_OUT: V3 = [214, -222, -12];
const BAG_GIVEN: V3 = [228, -216, -8];

// ---- the banker, the queue, the merchant, the carter, the cart ------------------------------------------------------
const BANKER = { x: 136, z: 72 };
const MER = { x0: 302, z: 0, x1: 372 };
/** the merchant's stride (units), solved so his walk lands at MER.x1 */
const MER_STRIDE = 29;
const CARTER = { x: 504, z: 100 };
const CART = { z0: 75, z1: 125, hx: 38, len: 96 };

// ===================================================================================================================
// DRAWN PROPS
// ===================================================================================================================
/** a silver coin lying (or tumbling) at a projected point; s = world px per unit */
const CoinShape: React.FC<{ c: P2; s: number; tilt: number; fog: (h: string) => string; flat?: number }> = ({ c, s, tilt, fog, flat = 0.36 }) => {
  const rx = COIN.r * s;
  const ry = COIN.r * s * flat;
  return (
    <g transform={`translate(${Pt(c)}) rotate(${tilt.toFixed(2)})`}>
      <ellipse cx={0} cy={1.3 * s} rx={rx} ry={ry} fill={fog(COIN.edge)} stroke={fog(COIN.line)} strokeWidth={0.5 * s} />
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={fog(COIN.top)} stroke={fog(COIN.line)} strokeWidth={0.45 * s} />
      <ellipse cx={-rx * 0.28} cy={-ry * 0.25} rx={rx * 0.42} ry={ry * 0.35} fill={fog(COIN.glint)} opacity={0.55} />
    </g>
  );
};

/** a leather money bag: centre (body), size in units, s = world px per unit; tilt in deg; coins glint at its mouth */
const Bag: React.FC<{ c: P2; s: number; size?: number; tilt?: number; fog: (h: string) => string; uid: string }> = ({ c, s, size = 1, tilt = 0, fog, uid }) => {
  const k = s * size;
  const body = "M-24,-6 C-27,12 -16,25 0,25 C16,25 27,12 24,-6 C21,-17 11,-21 6,-23 L-6,-23 C-11,-21 -21,-17 -24,-6Z";
  const neck = "M-7,-22 L7,-22 L9,-31 C4,-34 -4,-34 -9,-31Z";
  const ruff = "M-11,-31 C-7,-38 7,-38 11,-31 C6,-29 -6,-29 -11,-31Z";
  return (
    <g transform={`translate(${Pt(c)}) rotate(${tilt.toFixed(2)}) scale(${k.toFixed(4)})`}>
      <defs>
        <radialGradient id={`${uid}g`} cx="0.36" cy="0.32" r="0.8">
          <stop offset="0" stopColor={fog(LEATHER.lit)} />
          <stop offset="0.6" stopColor={fog(LEATHER.mid)} />
          <stop offset="1" stopColor={fog(LEATHER.dark)} />
        </radialGradient>
      </defs>
      <path d={body} fill={`url(#${uid}g)`} />
      <path d="M-12,4 C-8,14 4,16 12,9" fill="none" stroke={fog(LEATHER.dark)} strokeWidth={1.4} strokeOpacity={0.35} strokeLinecap="round" />
      <path d={neck} fill={fog(LEATHER.mid)} />
      <path d={ruff} fill={fog(LEATHER.lit)} />
      <ellipse cx={0} cy={-33.2} rx={5.5} ry={1.6} fill={fog(COIN.top)} />
      <path d="M-9,-24 C-3,-21 3,-21 9,-24" fill="none" stroke={fog(LEATHER.tie)} strokeWidth={2.6} strokeLinecap="round" />
      <path d="M6,-23 C9,-17 8,-12 10,-8" fill="none" stroke={fog(LEATHER.tie)} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M-20,-9 C-17,-16 -10,-19 -5,-20" fill="none" stroke={fog("#F3EBDD")} strokeWidth={1.6} strokeOpacity={0.35} strokeLinecap="round" />
    </g>
  );
};

/** a depositor's purse: held at its body, rotated by `tip` deg (0 = mouth up) */
const PURSE_K = 1.5;
const Purse: React.FC<{ c: P2; s: number; tip: number; fog: (h: string) => string; uid: string; col?: string }> = ({ c, s, tip, fog, uid, col = "#8A6A4C" }) => (
  <g transform={`translate(${Pt(c)}) rotate(${tip.toFixed(2)}) scale(${(s * PURSE_K).toFixed(4)})`}>
    <defs>
      <radialGradient id={`${uid}g`} cx="0.35" cy="0.3" r="0.85">
        <stop offset="0" stopColor={fog(mixHex(col, "#F3EBDD", 0.18))} />
        <stop offset="1" stopColor={fog(mixHex(col, "#22180F", 0.4))} />
      </radialGradient>
    </defs>
    <path d="M-12,-2 C-14,9 -7,14 0,14 C7,14 14,9 12,-2 C10,-8 5,-10 3,-11 L-3,-11 C-5,-10 -10,-8 -12,-2Z" fill={`url(#${uid}g)`} />
    <path d="M-4,-11 L4,-11 L6,-17 C2,-19 -2,-19 -6,-17Z" fill={fog(mixHex(col, "#22180F", 0.15))} />
    <path d="M-5,-12 C-2,-10 2,-10 5,-12" fill="none" stroke={fog("#4A3527")} strokeWidth={1.6} strokeLinecap="round" />
  </g>
);

// ===================================================================================================================
// THE ARCADE, THE STREET, THE BACKDROP
// ===================================================================================================================
/** the arcade of the basilica: a wall of arches on piers with engaged columns and an entablature; tabernae dim behind */
const Arcade: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const z0 = ARC.z0;
  const xa = -900;
  const xb = END_PIER.x1;
  // behind the arches: the basilica's hall, deep and dim, its far wall and a row of columns sinking into the air
  const zf = 1700;
  const hallCols = [-700, -420, -140, 140].map((X, i) => <AirCyl key={i} A={A} X={X} Z={1050} R={30} Y0={-900} Y1={0} mat={HALL} uid={`bk-hc${i}`} />);
  const inner = (
    <g>
      <path d={poly([P.p(xa, 0, zf), P.p(xb, 0, zf), P.p(xb, -1100, zf), P.p(xa, -1100, zf)])} fill={A.tone("#5E5244", zf, 300)} />
      <path d={poly([P.p(xa, 0, z0), P.p(xb, 0, z0), P.p(xb, 0, zf), P.p(xa, 0, zf)])} fill={A.tone("#5A4E40", (z0 + zf) / 2, 0)} />
      {hallCols}
      <defs>
        <linearGradient id="bk-in" gradientUnits="userSpaceOnUse" x1="0" y1={P.p(0, -520, z0)[1].toFixed(2)} x2="0" y2={P.p(0, 0, z0)[1].toFixed(2)}>
          <stop offset="0" stopColor="#2A2620" stopOpacity={0.55} />
          <stop offset="0.6" stopColor="#2A2620" stopOpacity={0.25} />
          <stop offset="1" stopColor="#2A2620" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <path d={poly([P.p(xa, 0, z0 + 1), P.p(xb, 0, z0 + 1), P.p(xb, -700, z0 + 1), P.p(xa, -700, z0 + 1)])} fill="url(#bk-in)" />
    </g>
  );
  // the wall face with the arch openings (evenodd holes)
  const opens: [number, number][] = [];
  const allP = [...PIERS, (END_PIER.x0 + END_PIER.x1) / 2];
  for (let i = 0; i < allP.length - 1; i++) {
    const a = allP[i] + 30;
    const b = i === allP.length - 2 ? END_PIER.x0 : allP[i + 1] - 30;
    opens.push([a, b]);
  }
  let wall = poly([P.p(xa, 0, z0), P.p(xb, 0, z0), P.p(xb, ARC.ent0, z0), P.p(xa, ARC.ent0, z0)]);
  for (const [a, b] of opens) {
    const cx = (a + b) / 2;
    const r = (b - a) / 2;
    const pts: P2[] = [P.p(a, 0, z0), P.p(a, ARC.spring, z0)];
    for (let i = 1; i < 16; i++) {
      const t = Math.PI - (Math.PI * i) / 16;
      pts.push(P.p(cx + r * Math.cos(t), ARC.spring - r * Math.sin(t), z0));
    }
    pts.push(P.p(b, ARC.spring, z0), P.p(b, 0, z0));
    wall += poly(pts);
  }
  const wallT = A.tone(TRAVERTINE.mid, z0, 300);
  // the archivolts: a lighter ring round each arch, the reveal (soffit) as a darker band inside
  const rings = opens.map(([a, b], i) => {
    const cx = (a + b) / 2;
    const r = (b - a) / 2;
    const ring = (rr: number, Z: number) => Array.from({ length: 17 }, (_, j) => P.p(cx + rr * Math.cos(Math.PI - (Math.PI * j) / 16), ARC.spring - rr * Math.sin(Math.PI - (Math.PI * j) / 16), Z));
    const outer = ring(r + 16, z0 - 1);
    const innerR = ring(r, z0 - 1);
    const d = `M${outer.map(Pt).join("L")}L${[...innerR].reverse().map(Pt).join("L")}Z`;
    // the soffit: the arch's inner surface from the face back to z1 (seen from below: only below the eye)
    const back = ring(r, ARC.z1);
    const sof = `M${innerR.map(Pt).join("L")}L${[...back].reverse().map(Pt).join("L")}Z`;
    return (
      <g key={i}>
        <path d={sof} fill={A.tone(mixHex(TRAVERTINE.dark, "#22180F", 0.2), z0 + 30, 380)} />
        <path d={d} fill={A.tone(TRAVERTINE.lit, z0, 400)} stroke={A.tone(lineOf(TRAVERTINE), z0, 400)} strokeWidth={A.lw()} />
      </g>
    );
  });
  // the reveals of the openings' jambs (the pier sides facing the VP), from the face back to z1
  const vx = P.vp[0];
  const jambs = opens.flatMap(([a, b], i) => {
    const out: React.ReactNode[] = [];
    if (a < vx) out.push(<path key={`ja${i}`} d={poly([P.p(a, 0, z0), P.p(a, 0, ARC.z1), P.p(a, ARC.spring, ARC.z1), P.p(a, ARC.spring, z0)])} fill={A.tone(mixHex(TRAVERTINE.mid, TRAVERTINE.dark, 0.3), z0 + 30, 200)} />);
    if (b > vx) out.push(<path key={`jb${i}`} d={poly([P.p(b, 0, z0), P.p(b, 0, ARC.z1), P.p(b, ARC.spring, ARC.z1), P.p(b, ARC.spring, z0)])} fill={A.tone(mixHex(TRAVERTINE.dark, "#22180F", 0.25), z0 + 30, 200)} />);
    return out;
  });
  const columns = allP.map((X, i) => {
    const Xc = i === allP.length - 1 ? END_PIER.x0 + 28 : X;
    return (
      <g key={i}>
        <AirBox A={A} X0={Xc - 26} X1={Xc + 26} Y0={-34} Y1={0} Z0={z0 - 30} Z1={z0} mat={TRAVERTINE} uid={`bk-pl${i}`} />
        <AirCyl A={A} X={Xc} Z={z0 - 12} R={19} Y0={ARC.ent0 + 22} Y1={-34} mat={MAT.marble} uid={`bk-cl${i}`} flutes={7} />
        <AirBox A={A} X0={Xc - 25} X1={Xc + 25} Y0={ARC.ent0 + 4} Y1={ARC.ent0 + 22} Z0={z0 - 32} Z1={z0} mat={MAT.marble} uid={`bk-cp${i}`} />
      </g>
    );
  });
  return (
    <g>
      {inner}
      {jambs}
      <path d={wall} fill={wallT} fillRule="evenodd" stroke={A.tone(lineOf(TRAVERTINE), z0, 300)} strokeWidth={A.lw()} />
      {rings}
      {/* the end pier: a deep block where the arcade stops and the street opens */}
      <AirBox A={A} X0={END_PIER.x0} X1={END_PIER.x1} Y0={ARC.ent0} Y1={0} Z0={z0} Z1={ARC.z1 + 40} mat={TRAVERTINE} uid="bk-ep" />
      {columns}
      <AirBox A={A} X0={xa} X1={END_PIER.x1 + 10} Y0={ARC.ent1} Y1={ARC.ent0} Z0={z0 - 36} Z1={ARC.z1} mat={TRAVERTINE} uid="bk-ent" />
    </g>
  );
};

/** the street's low shop row (single storey, tiled pent roofs) and the merchant's new shop stocked with amphorae */
const Street: React.FC<{ A: AirWorld; frame: number }> = ({ A }) => {
  const P = A.P;
  const Z = SHOPS_Z;
  const xa = STREET_X - 40;
  const xb = 1500;
  const top = -430;
  const doors: [number, number][] = [
    [400, 590],
    [690, 830],
    [940, 1090],
  ];
  let face = poly([P.p(xa, 0, Z), P.p(xb, 0, Z), P.p(xb, top, Z), P.p(xa, top, Z)]);
  for (const [a, b] of doors) face += poly([P.p(a, 0, Z), P.p(b, 0, Z), P.p(b, -300, Z), P.p(a, -300, Z)]);
  const insides = doors.map(([a, b], i) => (
    <g key={i}>
      <path d={poly([P.p(a, 0, Z + 160), P.p(b, 0, Z + 160), P.p(b, -300, Z + 160), P.p(a, -300, Z + 160)])} fill={A.tone("#4A3D30", Z + 120, 150)} />
      <path d={poly([P.p(a, 0, Z), P.p(b, 0, Z), P.p(b, 0, Z + 160), P.p(a, 0, Z + 160)])} fill={A.tone("#5A4C3C", Z + 80, 0)} />
    </g>
  ));
  // shelves of amphorae inside the merchant's shop (the first door)
  const shelf = (
    <g>
      {[-120, -230].map((Y, i) => (
        <path key={i} d={poly([P.p(415, Y, Z + 150), P.p(575, Y, Z + 150), P.p(575, Y + 8, Z + 150), P.p(415, Y + 8, Z + 150)])} fill={A.tone(WOOD.mid, Z + 150, 100)} />
      ))}
    </g>
  );
  const shelfAmph = [430, 460, 490, 520, 550].flatMap((X, i) =>
    [-120, -230].map((Y, j) => {
      const { at, scale } = P.at(X, Z + 140);
      return <RomeFolk.Amphora key={`${i}-${j}`} at={[at[0], at[1] + (Y + 0) * scale * 1]} scale={scale * 0.62} uid={`bk-sa${i}${j}`} fog={amphFog(A, Z + 260)} unitPx={A.k} angle={(i % 2 ? 4 : -3)} texture={false} />;
    }),
  );
  return (
    <g>
      {insides}
      {shelf}
      {shelfAmph}
      <path d={face} fill={A.tone(PLASTER.lit, Z, 150)} fillRule="evenodd" stroke={A.tone(lineOf(PLASTER), Z, 150)} strokeWidth={A.lw()} />
      {/* a red-brown socle along the shop row */}
      {[
        [xa, doors[0][0]],
        [doors[0][1], doors[1][0]],
        [doors[1][1], doors[2][0]],
        [doors[2][1], xb],
      ].map(([a, b], i) => (
        <path key={i} d={poly([P.p(a, 0, Z - 1), P.p(b, 0, Z - 1), P.p(b, -70, Z - 1), P.p(a, -70, Z - 1)])} fill={A.tone("#8E5E4C", Z, 30)} />
      ))}
      {/* timber lintels */}
      {doors.map(([a, b], i) => (
        <AirBox key={i} A={A} X0={a - 14} X1={b + 14} Y0={-322} Y1={-300} Z0={Z - 10} Z1={Z} mat={WOOD} uid={`bk-ln${i}`} />
      ))}
      {/* the pent roof: a tiled slope from the wall top out over the street */}
      <path d={poly([P.p(xa - 10, top, Z), P.p(xb, top, Z), P.p(xb, top + 46, Z - 120), P.p(xa - 10, top + 46, Z - 120)])} fill={A.tone(ROOF.mid, Z - 60, 420)} stroke={A.tone(lineOf(ROOF), Z - 60, 420)} strokeWidth={A.lw()} />
      {/* the imbrex ridges running down the slope, and the round tile ends along the eave */}
      <path
        d={Array.from({ length: Math.floor((xb - xa) / 26) }, (_, i) => {
          const X = xa + 6 + i * 26;
          return `M${Pt(P.p(X, top, Z))}L${Pt(P.p(X, top + 46, Z - 120))}`;
        }).join("")}
        stroke={A.tone(ROOF.lit, Z - 60, 420)}
        strokeWidth={5 * P.r(Z - 60)}
        strokeLinecap="round"
        strokeOpacity={0.7}
      />
      {Array.from({ length: Math.floor((xb - xa) / 26) }, (_, i) => {
        const c = P.p(xa + 6 + i * 26, top + 50, Z - 120);
        return <circle key={i} cx={c[0]} cy={c[1]} r={6 * P.r(Z - 120)} fill={A.tone(ROOF.mid, Z - 120, 400)} stroke={A.tone(ROOF.dark, Z - 120, 400)} strokeWidth={A.lw(0.8)} />;
      })}
    </g>
  );
};

/** the strongbox without its top: the visible outer faces (front, the side toward the VP), a rim round the opening */
const OpenBox: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const p = P.p;
  const { x0, x1, z0, z1, top } = BOX;
  const t = (h: string, Z = (z0 + z1) / 2) => A.tone(h, Z, 50);
  const ln = t(lineOf(BOXWOOD));
  const w = A.lw();
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  if (x0 > vx) els.push(<path key="l" d={poly([p(x0, top, z0), p(x0, top, z1), p(x0, 0, z1), p(x0, 0, z0)])} fill={t(mixHex(BOXWOOD.lit, BOXWOOD.mid, 0.4))} stroke={ln} strokeWidth={w} strokeLinejoin="round" />);
  if (x1 < vx) els.push(<path key="r" d={poly([p(x1, top, z0), p(x1, top, z1), p(x1, 0, z1), p(x1, 0, z0)])} fill={t(BOXWOOD.dark)} stroke={ln} strokeWidth={w} strokeLinejoin="round" />);
  const fr: P2[] = [p(x0, top, z0), p(x1, top, z0), p(x1, 0, z0), p(x0, 0, z0)];
  return (
    <g>
      {els}
      <defs>
        <linearGradient id="bk-boxg" gradientUnits="userSpaceOnUse" x1="0" y1={fr[0][1].toFixed(2)} x2="0" y2={fr[2][1].toFixed(2)}>
          <stop offset="0" stopColor={t(BOXWOOD.lit, z0)} />
          <stop offset="0.45" stopColor={t(BOXWOOD.mid, z0)} />
          <stop offset="1" stopColor={t(mixHex(BOXWOOD.mid, BOXWOOD.dark, 0.5), z0)} />
        </linearGradient>
      </defs>
      <path d={poly(fr)} fill="url(#bk-boxg)" stroke={ln} strokeWidth={w} strokeLinejoin="round" />
      {/* the rim of the opening: the walls' top edges, the front one catching the light */}
      <path d={`M${Pt(p(x0, top, z1))}L${Pt(p(x1, top, z1))}L${Pt(p(x1, top, z0))}`} fill="none" stroke={t(BOXWOOD.mid)} strokeWidth={4 * P.r(z1)} strokeLinejoin="round" />
      <path d={`M${Pt(p(x0, top, z0))}L${Pt(p(x1, top, z0))}M${Pt(p(x0, top, z0))}L${Pt(p(x0, top, z1))}`} fill="none" stroke={t(mixHex(BOXWOOD.lit, "#F3EBDD", 0.25))} strokeWidth={4 * P.r(z0)} strokeLinecap="round" />
    </g>
  );
};

/** amphora paint: terracotta muted toward red-brown (never near the orange), then the air by depth */
const amphFog = (A: AirWorld, Z: number) => {
  const f = A.folkFog(Z);
  const m = 0.32;
  const a = m + (1 - m) * f.amount;
  return { rgb: mixHex("#7A4A38", typeof f.rgb === "string" ? f.rgb : "#6E7A70", a > 0 ? ((1 - m) * f.amount) / a : 0), amount: a };
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const BanksLendToDebtors: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = swayCam(camAt(f), f);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame: f });
  const P = A.P;
  const p3 = (v: V3) => P.p(v[0], v[1], v[2]);
  const shadeAt = (X: number) => 1 - smoothstep(SHADE_X0, SHADE_X1, X);
  /** a figure's fog: the medium by depth, plus the arcade's shade where it stands */
  const figD = (X: number, Z: number) => {
    const base = A.folkFog(Z);
    const sh = 0.12 * shadeAt(X);
    return { rgb: base.amount > 0.001 ? base.rgb : "#3A3A33", amount: Math.max(base.amount, sh) };
  };
  const fogNear = (Z: number) => (h: string) => A.tone(h, Z, 100);
  const merX = (g: number) => MER.x0 + walkTravel(g, T.walk[0], T.walk[1], 8, MER_STRIDE, 30);
  const merFacing = (g: number) => ez(g, T.turn[0], T.turn[1]); // 0 = facing left, 1 = facing right

  // ---------------------------------------------------------------- the bag's path (banker, then merchant)
  const bagAt = (g: number): V3 => {
    if (g < T.bagLift[0]) return BAG_IN_BOX;
    if (g < T.bagLift[1]) return mix3(BAG_IN_BOX, BAG_UP, ez(g, T.bagLift[0], T.bagLift[1]));
    if (g < T.bagOut[1]) return mix3(BAG_UP, BAG_OUT, ez(g, T.bagOut[0], T.bagOut[1]));
    if (g < T.bagHand[1]) return mix3(BAG_OUT, BAG_GIVEN, ez(g, T.bagHand[0], T.bagHand[1]));
    const X = merX(g);
    const hugged: V3 = [X + lerp(-26, 26, merFacing(g)), -214, MER.z - 22];
    if (g < T.hug[1]) return mix3(BAG_GIVEN, hugged, ez(g, T.bagHand[1], T.hug[1]));
    const bob = g > T.walk[0] && g < T.walk[1] ? 2.2 * Math.sin((4 * Math.PI * (g - T.walk[0])) / 30) : 0;
    return [hugged[0], hugged[1] + bob, hugged[2]];
  };
  const bag3 = bagAt(f);
  const bag2 = p3(bag3);
  const bagS = P.r(bag3[2]);
  const bagSide = (dx: number, dy: number): P2 => [bag2[0] + dx * BAG_K * bagS, bag2[1] + dy * BAG_K * bagS];
  const neck3: V3 = [bag3[0] - 2, bag3[1] - 30 * BAG_K, bag3[2]];

  // ---------------------------------------------------------------- the banker (stands at the table's right side)
  const bFeet = P.at(BANKER.x, BANKER.z);
  const bankerBase = poseTrack([
    [0, RomeFolk.headTurn(RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(-1), 0.6), -0.6)],
    [T.sweep[0] - 6, { ...RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(-1), 0.6), lean: -10, pitch: 10 }],
    [T.sweep[1], { ...RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(-1), 0.3), lean: -4, pitch: 8 }],
    [T.codexReach[1], { ...RomeFolk.POSES.front(), pitch: 6 }],
    [T.codexLift[1], RomeFolk.POSES.front()],
    [T.codexDown[1], { ...RomeFolk.POSES.front(), pitch: 6 }],
    [T.boxReach[1], { ...RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(1), 0.4), crouch: 18, pitch: 16 }],
    [T.bagLift[1], { ...RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(1), 0.6), crouch: 4, pitch: 4 }],
    [T.bagHand[1], { ...RomeFolk.POSES.stand(1), lean: 8, pitch: 2 }],
    [T.bagHand[1] + 14, RomeFolk.headTurn(RomeFolk.POSES.stand(1), 0.7)],
    [250, RomeFolk.headTurn(RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(1), 0.5), 0.5)],
  ]);
  const bPose0 = RomeFolk.idle(bankerBase(f), f, 1);
  const free0 = RomeFolk.romeAnchors("dominus", bPose0, bFeet.at, bFeet.scale, { variant: 0 });
  const sweepY = TABLE.top - 6;
  const restL3: V3 = [TABLE.x1 - 8, TABLE.top - 4, 76];
  const codexL = codexPt(f, -CODEX_W - 2, 4);
  const codexR = codexPt(f, CODEX_W + 2, 4);
  const sIdx = Math.min(STROKES.length - 1, Math.floor(strokesDone(f)));
  const sFrac = strokesDone(f) - Math.floor(strokesDone(f));
  const stroke = STROKES[sIdx];
  const tipUV: [number, number] = [stroke.u + (stroke.x ? -3 + 6 * sFrac : 0.5), stroke.v + (stroke.x ? 2.5 : -2.5 + 5 * sFrac)];
  const tip3 = codexPt(f, tipUV[0], tipUV[1]);
  const handAt = (h: number): V3 => {
    const q = sweepAt(h - 5);
    return [q[0], sweepY, q[1]];
  };
  let bGrip: { L?: P2; R?: P2 } = {};
  if (f < T.sweep[0] - 10) {
    bGrip = { L: p3(restL3) };
  } else if (f < T.sweep[0]) {
    bGrip = { L: p3(mix3(restL3, handAt(0), ez(f, T.sweep[0] - 10, T.sweep[0]))) };
  } else if (f < T.sweep[1] + 2) {
    bGrip = { L: p3(handAt(sweepH(f))) };
  } else if (f < T.codexLift[0]) {
    const u = ez(f, T.sweep[1] + 2, T.codexLift[0]);
    const c0L = codexPt(T.codexLift[0], -CODEX_W - 2, 4);
    const c0R = codexPt(T.codexLift[0], CODEX_W + 2, 4);
    bGrip = { L: p3(mix3(handAt(SL), c0L, u)), R: mix2(free0.handR, p3(c0R), ez(f, T.codexReach[0], T.codexLift[0])) };
  } else if (f < T.write[0] || (f >= T.codexDown[0] && f < T.codexDown[1] + 2)) {
    bGrip = { L: p3(codexL), R: p3(codexR) };
  } else if (f < T.codexDown[0]) {
    const tp = p3(tip3);
    bGrip = { L: p3(codexL), R: [tp[0] + 7 * bFeet.scale, tp[1] + 5 * bFeet.scale] };
  } else if (f < T.boxReach[1]) {
    const u = ez(f, T.codexDown[1] + 2, T.boxReach[1]);
    const lu = ez(f, T.codexDown[1] + 2, T.codexDown[1] + 14);
    bGrip = { L: mix2(p3(codexPt(T.codexDown[1], -CODEX_W - 2, 4)), free0.handL, lu), R: p3(mix3(codexPt(T.codexDown[1], CODEX_W + 2, 4), neck3, u)) };
  } else if (f < T.bagHand[1]) {
    bGrip = { R: p3(neck3) };
  } else if (f < T.bagHand[1] + 14) {
    bGrip = { R: mix2(p3(neck3), free0.handR, ez(f, T.bagHand[1], T.bagHand[1] + 14)) };
  }
  const bPose = RomeFolk.gripTo("dominus", 0, bPose0, bGrip, bFeet.at, bFeet.scale);
  const banker = (uid: string, onlyArm?: "L" | "R") => <RomeFolk.Dominus key={uid} pose={bPose} at={bFeet.at} scale={bFeet.scale} uid={uid} variant={0} stripe ring fog={figD(BANKER.x, BANKER.z)} unitPx={A.k} onlyArm={onlyArm} />;

  // ---------------------------------------------------------------- the merchant
  const mX = merX(f);
  const mFeet = P.at(mX, MER.z);
  const mStandL = RomeFolk.POSES.stand(-1);
  const mStandR = { ...RomeFolk.POSES.stand(1), lean: 5, pitch: 3 };
  const walking = f > T.walk[0] && f < T.walk[1];
  const mAmt = walkAmt(f, T.walk[0], T.walk[1], 8);
  const mPoseBase = walking ? { ...RomeFolk.walkPose(mStandR, (f - T.walk[0]) / 30, mAmt, MER_STRIDE), lean: 12 * mAmt + 5 * (1 - mAmt) } : RomeFolk.lerpFig(mStandL, mStandR, merFacing(f));
  const gesture3: V3 = [MER.x1 + 80, -214, MER.z + 22];
  let mGrip: { L?: P2; R?: P2 } = {};
  if (f >= T.bagOut[0] && f < T.bagHand[0]) {
    const u = ez(f, T.bagOut[0], T.bagHand[0]);
    const n0 = RomeFolk.romeAnchors("freeman", RomeFolk.idle(mStandL, f, 2), mFeet.at, mFeet.scale, { variant: 2 });
    mGrip = { L: mix2(n0.handL, bagSide(24, 8), u), R: mix2(n0.handR, bagSide(-24, 10), u) };
  } else if (f >= T.bagHand[0] && f < T.coin[0]) {
    mGrip = { L: bagSide(lerp(24, -24, merFacing(f)), 8), R: bagSide(lerp(-24, 24, merFacing(f)), 10) };
  } else if (f >= T.coin[0]) {
    // the free hand leaves the bag and opens toward the cart and the street: "go" (the other arm keeps the bag)
    mGrip = { L: mix2(bagSide(-24, 8), p3(gesture3), ez(f, T.coin[0], T.coin[1])), R: bagSide(24, 10) };
  }
  const mOpen = ez(f, T.coin[0] + 4, T.coin[1]);
  const mPoseB = RomeFolk.idle(mPoseBase, f, 2);
  const mPose = RomeFolk.gripTo(
    "freeman",
    2,
    { ...mPoseB, armL: { ...mPoseB.armL, fist: lerp(mPoseB.armL.fist, 0, mOpen), hand: lerp(mPoseB.armL.hand, -48, mOpen) }, brow: lerp(mPoseB.brow, -0.3, mOpen), mouth: lerp(mPoseB.mouth, 0.3, mOpen) },
    mGrip,
    mFeet.at,
    mFeet.scale,
  );

  // ---------------------------------------------------------------- the carter and the cart
  const rollStart = T.roll[0];
  let cDx = 0;
  for (let h = rollStart; h < f; h++) cDx += 1.05 * ez(h + 0.5, rollStart, rollStart + 12);
  const cX = CARTER.x + cDx;
  const cFeet = P.at(cX, CARTER.z);
  const handle3: V3 = [CARTER.x + CART.hx + cDx, -178, CARTER.z - 14];
  const handle3b: V3 = [CARTER.x + CART.hx + cDx, -178, CARTER.z + 14];
  let cPose: FigPose;
  if (f < rollStart) {
    const look = ez(f, T.carterFace[0], T.carterFace[1]) * (1 - ez(f, T.carterTurn[0], T.carterTurn[1]));
    const nod = Math.sin(Math.PI * lin(f, 254, 264)) * 9;
    const q = RomeFolk.POSES.push(1, 0, 0);
    cPose = RomeFolk.idle({ ...q, headYaw: lerp(q.headYaw, -0.55, look), pitch: q.pitch + nod, brow: lerp(q.brow, -0.2, look), mouth: lerp(q.mouth, 0.2, look) }, f, 3);
  } else {
    cPose = RomeFolk.POSES.push(1, (f - rollStart) / 40, ez(f, rollStart, rollStart + 12));
  }
  const cPoseG = RomeFolk.gripTo("freeman", 1, cPose, { L: p3(handle3), R: p3(handle3b) }, cFeet.at, cFeet.scale);

  // ---------------------------------------------------------------- the queue
  const d1 = { X: -50, Z: 30 };
  const d2 = { X: -118, Z: 150 };
  const sl = { X: -186, Z: 270 };
  const d1Feet = P.at(d1.X, d1.Z);
  const d2Feet = P.at(d2.X, d2.Z);
  const slFeet = P.at(sl.X, sl.Z);
  const raise = ez(f, T.pour1[0] - 14, T.pour1[0]) * (1 - ez(f, T.pour1[1] + 2, T.pour1[1] + 16));
  const tip = lerp(0, 128, ez(f, T.pour1[0], T.pour1[0] + 7)) * (1 - ez(f, T.pour1[1] - 4, T.pour1[1] + 6));
  const d1Hold3: V3 = mix3([d1.X + 30, -150, d1.Z - 16], [HEAP1.x - 6, -222, HEAP1.z - 4], raise);
  const d2Hold3: V3 = [d2.X + 26, -196, d2.Z - 26];
  const slPouch3: V3 = [sl.X + 26, -196, sl.Z - 24];
  const d1Pose = RomeFolk.gripTo("freeman", 0, RomeFolk.idle(RomeFolk.headTurn(RomeFolk.POSES.stand(1), 0.75, 8 * raise), f, 4), { L: p3(d1Hold3) }, d1Feet.at, d1Feet.scale);
  const d2Pose = RomeFolk.gripTo("freeman", 3, RomeFolk.idle(RomeFolk.headTurn(RomeFolk.POSES.stand(1), 0.7), f, 5), { L: p3(d2Hold3) }, d2Feet.at, d2Feet.scale);
  const slPose = RomeFolk.gripTo("slave", 2, RomeFolk.idle(RomeFolk.headTurn(RomeFolk.POSES.stand(1), 0.7), f, 6), { L: p3(slPouch3) }, slFeet.at, slFeet.scale);
  const purseMouth = (hold: V3, tp: number): V3 => {
    const m = rot2([0, -16 * PURSE_K], tp);
    return [hold[0] + m[0], hold[1] + m[1], hold[2]];
  };

  // ---------------------------------------------------------------- the coins
  const coinFog = fogNear(40);
  const tableCoins: { c: P2; s: number; tilt: number; key: string; zz: number; yy: number }[] = [];
  const pourCoins: { c: P2; s: number; tilt: number; key: string }[] = [];
  const boxFalling: { c: P2; s: number; tilt: number; key: string }[] = [];
  const fillY = BOX_FILL0 - 0.22 * coinsIn(f);
  COINS.forEach((c, i) => {
    if (f < c.te) return;
    const tipAng = lerp(0, 128, ez(c.te, T.pour1[0], T.pour1[0] + 7));
    const m0 = purseMouth(mix3([d1.X + 30, -150, d1.Z - 16], [HEAP1.x - 6, -222, HEAP1.z - 4], ez(c.te, T.pour1[0] - 14, T.pour1[0])), tipAng);
    if (f < c.te + FALL_T) {
      const s = (f - c.te) / FALL_T;
      const pos: V3 = [lerp(m0[0], c.rest[0], s), m0[1] + (c.rest[1] - m0[1]) * s * s, lerp(m0[2], c.rest[2], s)];
      pourCoins.push({ c: p3(pos), s: P.r(pos[2]), tilt: c.tilt + (1 - s) * 70 * (i % 2 ? 1 : -1), key: `fc${i}` });
      return;
    }
    const e = EDGE[i];
    if (f < e) {
      const xz = pushedXZ(c, f);
      const pushed = xz[0] > c.rest[0] + 0.01 || xz[1] < c.rest[2] - 0.01;
      const moved = Math.hypot(xz[0] - c.rest[0], xz[1] - c.rest[2]);
      const yy = pushed ? TABLE.top - 1.6 - 7 * hash(i, 41) * c01(moved / 30) : c.rest[1];
      tableCoins.push({ c: p3([xz[0], yy, xz[1]]), s: P.r(xz[1]), tilt: c.tilt + (pushed ? 14 * Math.sin(moved * 0.09 + i) : 0), key: `tc${i}`, zz: xz[1], yy });
      return;
    }
    // over the edge: it drops into the box
    const t = f - e;
    const ez0 = pushedXZ(c, e);
    const y = TABLE.top - 1.6 + 0.6 * t * t;
    if (y > fillY) return;
    const zz = ez0[1] + SD[1] * 1.6 * t;
    boxFalling.push({ c: p3([TABLE.x1 + 2 + SD[0] * 2.4 * t, y, zz]), s: P.r(zz), tilt: c.tilt + t * 18, key: `bc${i}` });
  });
  tableCoins.sort((a, b) => b.zz - a.zz || b.yy - a.yy);
  const boxCoins: React.ReactNode[] = [];
  for (let i = 0; i < 34; i++) {
    const x = lerp(BOX.x0 + 10, BOX.x1 - 10, hash(i, 51));
    const zz = lerp(BOX.z0 + 8, BOX.z1 - 8, hash(i, 52));
    if (Math.abs(x - BAG_IN_BOX[0]) < 26 && Math.abs(zz - BAG_IN_BOX[2]) < 22 && f < T.bagLift[0]) continue;
    boxCoins.push(<CoinShape key={i} c={p3([x, fillY - 1.5 * hash(i, 53), zz])} s={P.r(zz)} tilt={(hash(i, 54) - 0.5) * 40} fog={fogNear(zz)} />);
  }

  // ---------------------------------------------------------------- the light: the arcade's shade, the street's sun
  const vw = (() => {
    const yTop = cam.cy - 1200 / cam.k;
    const yBot = cam.cy + 1200 / cam.k;
    const xl = cam.cx - 1400 / cam.k;
    const xr = cam.cx + 1400 / cam.k;
    const x0 = P.p(SHADE_X0, 0, 150)[0];
    const x1 = P.p(SHADE_X1, 0, 150)[0];
    return { yTop, yBot, xl, xr, x0, x1 };
  })();
  const shadeVeil = (
    <g>
      <defs>
        <linearGradient id="bk-sv" gradientUnits="userSpaceOnUse" x1={vw.x0.toFixed(2)} y1="0" x2={vw.x1.toFixed(2)} y2="0">
          <stop offset="0" stopColor="#241F1A" stopOpacity={0.42} />
          <stop offset="1" stopColor="#241F1A" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="bk-sun" gradientUnits="userSpaceOnUse" x1={vw.x0.toFixed(2)} y1="0" x2={vw.x1.toFixed(2)} y2="0">
          <stop offset="0" stopColor="#F3E6C8" stopOpacity={0} />
          <stop offset="1" stopColor="#F3E6C8" stopOpacity={0.13} />
        </linearGradient>
      </defs>
      <rect x={vw.xl.toFixed(2)} y={vw.yTop.toFixed(2)} width={(vw.x1 - vw.xl).toFixed(2)} height={(vw.yBot - vw.yTop).toFixed(2)} fill="url(#bk-sv)" />
      <rect x={vw.x0.toFixed(2)} y={vw.yTop.toFixed(2)} width={(vw.xr - vw.x0).toFixed(2)} height={(vw.yBot - vw.yTop).toFixed(2)} fill="url(#bk-sun)" />
    </g>
  );
  // the lower frame sinks into the dense low air (a soft gradient in camera space, over the floor's near rows)
  const lowAir = (() => {
    const y0 = cam.cy + (1480 - 960) / cam.k;
    const y1 = cam.cy + (1920 - 960) / cam.k;
    const xl = cam.cx - 600 / cam.k;
    const c = A.v.airAtScreen(1900);
    const hex = `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v * 0.8))).toString(16).padStart(2, "0")).join("")}`;
    return (
      <g>
        <defs>
          <linearGradient id="bk-low" gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={y1.toFixed(2)}>
            <stop offset="0" stopColor={hex} stopOpacity={0} />
            <stop offset="0.55" stopColor={hex} stopOpacity={0.3} />
            <stop offset="1" stopColor={hex} stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <rect x={xl.toFixed(2)} y={y0.toFixed(2)} width={(1200 / cam.k).toFixed(2)} height={(y1 - y0 + 4).toFixed(2)} fill="url(#bk-low)" />
      </g>
    );
  })();

  // ---------------------------------------------------------------- the props
  const Table = (() => {
    const { x0, x1, z0, z1, top, th } = TABLE;
    const legs: [number, number][] = [
      [x0 + 5, z1 - 17],
      [x1 - 17, z1 - 17],
      [x0 + 5, z0 + 5],
      [x1 - 17, z0 + 5],
    ];
    return (
      <g>
        {legs.map(([x, zz], i) => (
          <AirBox key={i} A={A} X0={x} X1={x + 12} Y0={top + th} Y1={0} Z0={zz} Z1={zz + 12} mat={WOOD} uid={`bk-tl${i}`} rim={0.3} />
        ))}
        <AirBox A={A} X0={x0 + 4} X1={x1 - 4} Y0={top + th} Y1={top + th + 18} Z0={z0 + 3} Z1={z1 - 3} mat={WOOD} uid="bk-ap" rim={0.2} />
        <AirBox A={A} X0={x0} X1={x1} Y0={top} Y1={top + th} Z0={z0} Z1={z1} mat={WOOD} uid="bk-tp" />
      </g>
    );
  })();
  const BoxBack = (
    <g>
      <path d={poly([p3([BOX.x0, BOX.top, BOX.z1]), p3([BOX.x1, BOX.top, BOX.z1]), p3([BOX.x1, BOX.top, BOX.z0]), p3([BOX.x0, BOX.top, BOX.z0])])} fill={A.tone("#2C2119", -20, 40)} />
      <path d={poly([p3([BOX.x0 + 4, fillY, BOX.z1 - 4]), p3([BOX.x1 - 4, fillY, BOX.z1 - 4]), p3([BOX.x1 - 4, fillY, BOX.z0 + 4]), p3([BOX.x0 + 4, fillY, BOX.z0 + 4])])} fill={A.tone("#868B89", -20, 40)} />
      {boxCoins}
    </g>
  );
  const lid = (() => {
    const a = (112 * Math.PI) / 180;
    const L = BOX.z1 - BOX.z0;
    const tipY = BOX.top - L * Math.sin(a);
    const tipZ = BOX.z1 - L * Math.cos(a);
    const q: P2[] = [p3([BOX.x0, BOX.top, BOX.z1]), p3([BOX.x1, BOX.top, BOX.z1]), p3([BOX.x1, tipY, tipZ]), p3([BOX.x0, tipY, tipZ])];
    return (
      <g>
        <path d={poly(q)} fill={A.tone(mixHex(BOXWOOD.lit, BOXWOOD.mid, 0.3), BOX.z1, 120)} stroke={A.tone(MAT.iron.mid, BOX.z1, 120)} strokeWidth={4 * P.r(BOX.z1)} strokeLinejoin="round" />
        {[0.14, 0.86].map((u) => (
          <path key={u} d={`M${Pt(bil(q, u, 0))}L${Pt(bil(q, u, 1))}`} stroke={A.tone(MAT.iron.mid, BOX.z1, 120)} strokeWidth={6 * P.r(BOX.z1)} />
        ))}
        <path d={poly([bil(q, 0.1, 0.12), bil(q, 0.9, 0.12), bil(q, 0.9, 0.88), bil(q, 0.1, 0.88)])} fill="none" stroke={A.tone(BOXWOOD.mid, BOX.z1, 120)} strokeWidth={1.2 * P.r(BOX.z1)} strokeOpacity={0.6} />
      </g>
    );
  })();
  const BoxFront = (
    <g>
      <OpenBox A={A} />
      {[0.14, 0.86].map((u) => (
        <path key={u} d={`M${Pt(p3([lerp(BOX.x0, BOX.x1, u), BOX.top, BOX.z0 - 0.5]))}L${Pt(p3([lerp(BOX.x0, BOX.x1, u), 0, BOX.z0 - 0.5]))}`} stroke={A.tone(MAT.iron.mid, BOX.z0, 50)} strokeWidth={7 * P.r(BOX.z0)} />
      ))}
      {[0.1, 0.9].map((u) => (
        <path key={`h${u}`} d={`M${Pt(p3([BOX.x0, lerp(BOX.top, 0, u), BOX.z0 - 0.5]))}L${Pt(p3([BOX.x1, lerp(BOX.top, 0, u), BOX.z0 - 0.5]))}`} stroke={A.tone(MAT.iron.mid, BOX.z0, 50)} strokeWidth={6 * P.r(BOX.z0)} />
      ))}
      {(() => {
        const xm = (BOX.x0 + BOX.x1) / 2;
        const c = p3([xm, BOX.top + 51, BOX.z0 - 2]);
        return (
          <g>
            <path d={poly([p3([xm - 12, BOX.top + 34, BOX.z0 - 1]), p3([xm + 12, BOX.top + 34, BOX.z0 - 1]), p3([xm + 12, BOX.top + 68, BOX.z0 - 1]), p3([xm - 12, BOX.top + 68, BOX.z0 - 1])])} fill={A.tone(MAT.iron.lit, BOX.z0, 50)} />
            <circle cx={c[0]} cy={c[1]} r={2.6 * P.r(BOX.z0)} fill={A.tone("#2B241D", BOX.z0, 50)} />
          </g>
        );
      })()}
    </g>
  );
  const Codex = (() => {
    const q = (u0: number, v0: number, u1: number, v1: number) => poly([p3(codexPt(f, u0, v0)), p3(codexPt(f, u1, v0)), p3(codexPt(f, u1, v1)), p3(codexPt(f, u0, v1))]);
    const Zc = codexC(f)[2];
    const tn = (h: string) => A.tone(h, Zc, 120);
    const strokeW = 1.1 * P.r(Zc);
    const old: string[] = [];
    for (let j = 0; j < 4; j++) {
      const v = -12 + j * 7.5;
      const n = 4 + ((j * 3) % 5);
      for (let i = 0; i < n; i++) {
        const u = -27 + i * 3.1;
        old.push(`M${Pt(p3(codexPt(f, u, v - 2.4)))}L${Pt(p3(codexPt(f, u, v + 2.4)))}`);
      }
    }
    const done = strokesDone(f);
    const neu: string[] = [];
    STROKES.forEach((st, i) => {
      const fr = c01(done - i);
      if (fr <= 0) return;
      if (st.x) neu.push(`M${Pt(p3(codexPt(f, st.u - 3, st.v + 2.5)))}L${Pt(p3(codexPt(f, st.u - 3 + 6 * fr, st.v + 2.5 - 5 * fr)))}`);
      else neu.push(`M${Pt(p3(codexPt(f, st.u, st.v - 2.5)))}L${Pt(p3(codexPt(f, st.u, st.v - 2.5 + 5 * fr)))}`);
    });
    return (
      <g>
        <path d={q(-CODEX_W, -CODEX_H / 2, CODEX_W, CODEX_H / 2)} fill={tn(WOOD.lit)} stroke={tn(lineOf(WOOD))} strokeWidth={A.lw()} />
        <path d={q(-CODEX_W + 3.5, -CODEX_H / 2 + 3.5, -2, CODEX_H / 2 - 3.5)} fill={tn("#4C3B2A")} />
        <path d={q(2, -CODEX_H / 2 + 3.5, CODEX_W - 3.5, CODEX_H / 2 - 3.5)} fill={tn("#4C3B2A")} />
        <path d={`M${Pt(p3(codexPt(f, 0, -CODEX_H / 2)))}L${Pt(p3(codexPt(f, 0, CODEX_H / 2)))}`} stroke={tn(WOOD.dark)} strokeWidth={1.4 * P.r(Zc)} />
        <path d={old.join("")} stroke={tn("#D9CDB4")} strokeWidth={strokeW} strokeOpacity={0.8} strokeLinecap="round" />
        <path d={neu.join("")} stroke={tn("#F3EBDD")} strokeWidth={strokeW * 1.15} strokeLinecap="round" />
      </g>
    );
  })();
  const writing = f >= T.write[0] && f < T.codexDown[0];
  const stylus = writing
    ? (() => {
        const tp = p3(tip3);
        const s = P.r(codexC(f)[2]);
        return <path d={`M${Pt(tp)}L${Pt([tp[0] + 15 * s, tp[1] + 11 * s])}`} stroke={A.tone("#5A4636", 20, 100)} strokeWidth={2.2 * s} strokeLinecap="round" />;
      })()
    : null;
  const codexHeld = f >= T.codexLift[0] && f < T.codexDown[1];
  const Cart = (() => {
    const x0 = CARTER.x + CART.hx + 16 + cDx;
    const x1 = x0 + CART.len;
    const { z0, z1 } = CART;
    const R = 42;
    const wheelX = x0 + 46;
    const ang = (cDx / R) * (180 / Math.PI);
    const wc = p3([wheelX, -R, z0 - 4]);
    const ws = P.r(z0 - 4);
    const spokes = Array.from({ length: 6 }, (_, i) => {
      const a = ((ang + i * 60) * Math.PI) / 180;
      return `M${Pt(wc)}L${Pt([wc[0] + Math.cos(a) * R * 0.86 * ws, wc[1] + Math.sin(a) * R * 0.86 * ws])}`;
    }).join("");
    const amph = [0, 1, 2].map((i) => {
      const X = x0 + 18 + i * 30;
      const Zm = lerp(z0 + 14, z1 - 14, i % 2 ? 0.8 : 0.2);
      const { at, scale } = P.at(X, Zm);
      return <RomeFolk.Amphora key={i} at={[at[0], at[1] - 108 * scale]} scale={scale * 0.82} uid={`bk-ca${i}`} fog={amphFog(A, Zm)} unitPx={A.k} angle={i % 2 ? 5 : -4} />;
    });
    return (
      <g>
        <AirShadow A={A} X={(x0 + x1) / 2} Z={(z0 + z1) / 2} w={70} d={36} uid="bk-cs" amt={0.6} />
        <circle cx={p3([wheelX, -R, z1 + 2])[0]} cy={p3([wheelX, -R, z1 + 2])[1]} r={R * P.r(z1 + 2)} fill="none" stroke={A.tone(WOOD.dark, z1, 30)} strokeWidth={7 * P.r(z1)} />
        {[
          [z0 + 6, CARTER.z - 14],
          [z1 - 6, CARTER.z + 14],
        ].map(([zb, zh], i) => (
          <path key={i} d={`M${Pt(p3([x0 + 8, -112, zb]))}L${Pt(p3([CARTER.x + CART.hx + cDx - 4, -178, zh]))}`} stroke={A.tone(WOOD.mid, (zb + zh) / 2, 80)} strokeWidth={6 * P.r((zb + zh) / 2)} strokeLinecap="round" />
        ))}
        {amph}
        <AirBox A={A} X0={x0} X1={x1} Y0={-128} Y1={-92} Z0={z0} Z1={z1} mat={WOOD} uid="bk-cb" />
        <circle cx={wc[0]} cy={wc[1]} r={R * ws} fill="none" stroke={A.tone(WOOD.mid, z0, 30)} strokeWidth={8 * ws} />
        <circle cx={wc[0]} cy={wc[1]} r={R * ws} fill="none" stroke={A.tone(MAT.iron.mid, z0, 30)} strokeWidth={2.4 * ws} />
        <path d={spokes} stroke={A.tone(WOOD.mid, z0, 30)} strokeWidth={4.2 * ws} strokeLinecap="round" />
        <circle cx={wc[0]} cy={wc[1]} r={8 * ws} fill={A.tone(WOOD.dark, z0, 30)} />
      </g>
    );
  })();
  const stack = [0, 1, 2].map((i) => {
    const X = 600 + i * 34;
    const Zs = SHOPS_Z - 40;
    const { at, scale } = P.at(X, Zs);
    return <RomeFolk.Amphora key={i} at={at} scale={scale} uid={`bk-st${i}`} fog={amphFog(A, Zs)} unitPx={A.k} angle={i === 2 ? 8 : 0} />;
  });
  // a few things on the floor: dropped coins
  const dropped = (
    [
      [18, -170, 20],
      [236, -150, -15],
      [-96, -40, 50],
      [300, 90, 10],
    ] as [number, number, number][]
  ).map(([x, zz, t], i) => <CoinShape key={i} c={p3([x, -1, zz])} s={P.r(zz)} tilt={t} fog={fogNear(zz)} />);

  const bagEl = <Bag c={bag2} s={bagS} size={BAG_K} fog={fogNear(bag3[2])} uid="bk-bag" tilt={f > T.bagLift[0] && f < T.bagHand[1] ? -6 : 0} />;
  const bagInBox = f < T.bagLift[0] + 3;
  const bagOverBox = !bagInBox && f < T.bagOut[0];
  const merchant = <RomeFolk.Freeman pose={mPose} at={mFeet.at} scale={mFeet.scale} uid="bk-mer" variant={2} pilleus={false} apron={false} fog={figD(mX, MER.z)} unitPx={A.k} />;
  const armIntoBox = f >= T.boxReach[0] && f < T.bagHand[1] + 14;
  return (
    <AirStage v={A.v} bloom={0}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-1400} x1={2400} z0={-700} z1={4200} mat={FLOOR} course={150} plank={150} />
        <Street A={A} frame={f} />
        <Arcade A={A} />
        {stack}
        {dropped}
        {shadeVeil}
        <AirShadow A={A} X={sl.X} Z={sl.Z} w={60} d={28} uid="bk-sh-sl" amt={0.7} />
        <AirShadow A={A} X={d2.X} Z={d2.Z} w={60} d={28} uid="bk-sh-d2" amt={0.75} />
        <AirShadow A={A} X={(TABLE.x0 + TABLE.x1) / 2} Z={(TABLE.z0 + TABLE.z1) / 2} w={60} d={170} uid="bk-sh-t" amt={0.55} />
        <AirShadow A={A} X={BANKER.x} Z={BANKER.z} w={70} d={30} uid="bk-sh-b" amt={0.75} />
        <AirShadow A={A} X={(BOX.x0 + BOX.x1) / 2} Z={(BOX.z0 + BOX.z1) / 2} w={70} d={50} uid="bk-sh-bx" amt={0.75} />
        <AirShadow A={A} X={d1.X} Z={d1.Z} w={62} d={28} uid="bk-sh-d1" amt={0.75} />
        <AirShadow A={A} X={cX} Z={CARTER.z} w={60} d={28} uid="bk-sh-c" amt={0.7} />
        <AirShadow A={A} X={mX} Z={MER.z} w={62} d={28} uid="bk-sh-m" amt={0.75} />
        {/* the queue, far to near */}
        <RomeFolk.Slave pose={slPose} at={slFeet.at} scale={slFeet.scale} uid="bk-slave" variant={2} fog={figD(sl.X, sl.Z)} unitPx={A.k} />
        <Purse c={p3(slPouch3)} s={P.r(slPouch3[2])} tip={0} fog={fogNear(slPouch3[2])} uid="bk-sp" col="#7C6450" />
        <RomeFolk.Freeman pose={d2Pose} at={d2Feet.at} scale={d2Feet.scale} uid="bk-d2" variant={3} apron={false} fog={figD(d2.X, d2.Z)} unitPx={A.k} />
        <Purse c={p3(d2Hold3)} s={P.r(d2Hold3[2])} tip={0} fog={fogNear(d2Hold3[2])} uid="bk-p2" col="#7E6A58" />
        {/* the street: the carter and his cart */}
        {Cart}
        <RomeFolk.Freeman pose={cPoseG} at={cFeet.at} scale={cFeet.scale} uid="bk-carter" variant={1} pilleus={false} apron={false} inks={{ tunic: "#9A9070" }} fog={figD(cX, CARTER.z)} unitPx={A.k} />
        {/* the table (receding), its coins and the codex */}
        {Table}
        {codexHeld ? null : Codex}
        {tableCoins.map((c) => (
          <CoinShape key={c.key} c={c.c} s={c.s} tilt={c.tilt} fog={coinFog} />
        ))}
        {/* the banker beside his table, the open strongbox in front of him */}
        {banker("bk-banker")}
        {codexHeld ? (
          <g>
            {Codex}
            {stylus}
            {banker("bk-banker-L2", "L")}
            {banker("bk-banker-R2", "R")}
          </g>
        ) : null}
        {BoxBack}
        {bagInBox ? bagEl : null}
        {lid}
        {boxFalling.map((c) => (
          <CoinShape key={c.key} c={c.c} s={c.s} tilt={c.tilt} fog={coinFog} />
        ))}
        {armIntoBox && bagInBox ? banker("bk-banker-R3", "R") : null}
        {BoxFront}
        {armIntoBox && !bagInBox ? banker("bk-banker-R3", "R") : null}
        {bagOverBox ? bagEl : null}
        {/* the first depositor pouring */}
        <RomeFolk.Freeman pose={d1Pose} at={d1Feet.at} scale={d1Feet.scale} uid="bk-d1" variant={0} pilleus={false} apron={false} fog={figD(d1.X, d1.Z)} unitPx={A.k} />
        <Purse c={p3(d1Hold3)} s={P.r(d1Hold3[2])} tip={tip} fog={fogNear(d1Hold3[2])} uid="bk-p1" />
        {pourCoins.map((c) => (
          <CoinShape key={c.key} c={c.c} s={c.s} tilt={c.tilt} fog={coinFog} flat={0.6} />
        ))}
        {/* the merchant and the bag */}
        {f >= T.bagOut[0] && f < T.bagHand[1] + 14 ? banker("bk-banker-R4", "R") : null}
        {merchant}
        {!bagInBox && !bagOverBox ? bagEl : null}
        {lowAir}
      </WorldSvg>
    </AirStage>
  );
};

export default BanksLendToDebtors;
