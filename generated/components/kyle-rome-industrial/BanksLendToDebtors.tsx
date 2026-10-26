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
// THE MOTION (Revision 3, the user's Rev 1 notes): one lateral glide, left to right at ONE even speed (2.0 units =
// ~4.8 screen px per frame, constant f0-f296; only the house hand-sway on top) and one zoom, the eye 3.9 m up looking
// down into the stage (a truck: the arcade parallaxes behind). The money travels left to right and the camera follows.
// f0-62 ("banks that take money from depositors"): at the left end of a solid timber counter under the shaded arcade
// of a forum basilica a freeman tips his purse and silver coins pour onto the counter top (f24-62); a freewoman and a
// slave with his master's pouch queue behind him, each a step further back. The banker (a Dominus, white toga with the
// stripe) stands BEHIND the counter the whole time: its top and panelled front (and the strongbox) cut his body at the
// hips, his feet are never seen. f74-100: his hand meets the heap (f74) and sweeps it along the counter and off its
// right end into the open iron-bound strongbox standing there (lid lifted off, leaning on its side). f100-160 ("keep
// balances"): he lifts his wax-tablet codex (contact f110), writes three rows of tally strokes (f124-150), lays it
// down. f158-206 ("lend out to debtors"): his right hand arcs over the box's rim to an open leather bag heaped with
// silver (contact f172), lifts it and holds it out, arm extended, across the gap to the merchant waiting right of the
// box (f182-198); the merchant's hands close on it at f198, the banker lets go at f206. f206-242: the merchant holds
// it to his chest, turns and walks out of the shade into the sunlit street to his carter at a two-wheeled handcart
// loaded with amphorae. f240-280 ("entrepreneurial things"): the carter turns and holds out his palm (f242-250); the
// merchant tips the bag and six silver coins drop into it (f250-260); the carter closes his fist on them (f262-266),
// turns back, takes up the poles and pushes off; the cart rolls from f280, its wheels turning by its travel.
// CAUSE BEFORE EFFECT: coins come out of the purse's mouth and land before they are swept; the sweeping hand touches
// the heap on the frame it moves (f74); the bag moves only while a hand holds it (banker f172-206, merchant from f198);
// the paid coins leave the bag's mouth while it is tipped; the cart moves only with the carter's fists on its poles.
// DEVIATIONS FROM THE STORYBOARD: the strongbox stands at the counter's right end (the sweep drops the coins straight in),
// not behind the banker; only the first depositor pours.
// Orange: none (the clip's rule: orange = technology and ideas; money and business are not technology). Coins are
// silver / pale pewter, the bag leather, people in the folk cast's muted colours.
//
// DEPTH: eye 3.9 m up (eyeY -700), Dc 1000 units at the one zoom K 2.4 (no zoom: kRef = K), fog by the eye's distance.
// The counter X 0-190, Z 20-95; the strongbox X 192-296, Z 24-98; the banker Z 132 behind them; the queue at Z 46 /
// 160 / 280; the merchant Z 10 (X 422 -> 452); the carter Z 60, his cart Z 40-84; the arcade face Z 400; shops Z 520.
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
const GLIDE_V = 2.0;
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
// Revision 2: the banker stands BEHIND a solid timber counter (its top and panelled front hide his lower body
// cleanly; his toga never crosses the counter's front edge). The depositors queue at the counter's left end, each a
// step further back; the open strongbox stands at its right end (its lid lifted off and leaning against its side), the
// banker moves along behind counter and box (his feet always hidden); the merchant waits right of the box.
// ===================================================================================================================
const TABLE = { x0: 0, x1: 190, z0: 20, z1: 95, top: -151, th: 14 };
const BOX = { x0: 192, x1: 296, z0: 24, z1: 98, top: -140 };
const ARC = { z0: 400, z1: 470, spring: -380, ent0: -560, ent1: -650 };
/** pier centres (half width 30) and the arcade's end pier (the street opens to its right) */
const PIERS = [-580, -300, -20];
const END_PIER = { x0: 280, x1: 360 };
const SHOPS_Z = 520;
const STREET_X = 360;
/** the shade under the arcade: 1 left of SHADE_X0, 0 right of SHADE_X1 */
const SHADE_X0 = 300;
const SHADE_X1 = 420;

const COIN = { top: "#B7BDBA", edge: "#5C6362", glint: "#F4F2EA", r: 6.4, line: "#4A504F" };
const LEATHER = { lit: "#C4A57C", mid: "#9E7E58", dark: "#5E4632", tie: "#4A3527" };
const WOOD: Mat = { lit: "#9C7A55", mid: "#6F5539", dark: "#3A2B1D" };
const CARTWOOD: Mat = { lit: "#A88A62", mid: "#7E6244", dark: "#45331F" };
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
  sweep: [74, 100] as const,
  codexReach: [100, 110] as const,
  codexLift: [110, 122] as const,
  write: [124, 150] as const,
  codexDown: [150, 158] as const,
  /** the banker moves along behind the counter to the box */
  toBox: [150, 168] as const,
  boxReach: [158, 172] as const,
  bagLift: [172, 182] as const,
  bagOut: [182, 192] as const,
  /** he holds it out; the merchant reaches and takes hold at f198 */
  reach: [184, 198] as const,
  bagHand: [198, 206] as const,
  hug: [206, 214] as const,
  turn: [208, 218] as const,
  walk: [216, 242] as const,
  /** the pay: the bag comes over the carter's palm and tips; six coins drop; it comes back upright */
  tipIn: [240, 250] as const,
  pour: [250, 260] as const,
  tipOut: [262, 270] as const,
  /** the carter turns to him, palm out; closes his fist on the coins; turns back to his cart */
  cFaceL: [232, 244] as const,
  palm: [242, 250] as const,
  close: [262, 266] as const,
  cFaceR: [268, 278] as const,
  roll: [280, 297] as const,
};

// ---- the coins ----------------------------------------------------------------------------------------------------
type Coin = { te: number; rest: V3; g: number; tilt: number };
const N1 = 56;
const HEAP1 = { x: 42, z: 50 };
const COINS: Coin[] = (() => {
  const out: Coin[] = [];
  for (let i = 0; i < N1; i++) {
    const u = i / (N1 - 1);
    const a = hash(i, 11) * Math.PI * 2;
    const rad = Math.sqrt(hash(i, 12)) * (9 + 17 * u);
    const x = HEAP1.x + Math.cos(a) * rad;
    const zz = HEAP1.z + Math.sin(a) * rad * 0.7;
    const h = 1.8 + 24 * u * Math.max(0, 1 - rad / 30);
    out.push({ te: lerp(T.pour1[0] + 6, T.pour1[1] - 9, (i + hash(i, 15) * 0.8) / N1), rest: [x, TABLE.top - h, zz], g: 6 + 30 * hash(i, 13), tilt: (hash(i, 14) - 0.5) * 30 });
  }
  return out;
})();
const FALL_T = 9;
/** the sweep: the banker's hand travels along the counter top from left of the heap to its right end by the box */
const S0: P2 = [16, 50];
const S1: P2 = [TABLE.x1 - 2, 54];
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
/** the frame a pushed coin goes over the counter's right end (Infinity if never) */
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
const CODEX_TABLE: V3 = [150, TABLE.top - 1.5, 70];
const CODEX_HELD: V3 = [146, -250, 104];
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

// ---- the loan: an open leather bag heaped with silver (~150 px) -----------------------------------------------------
const BAG_K = 1.25;
const BAG_IN_BOX: V3 = [244, -118, 62];
const BAG_UP: V3 = [252, -222, 62];
/** held out across the box toward the merchant (the arm extended), f192-198 */
const BAG_OUT: V3 = [300, -206, 40];
const BAG_GIVEN: V3 = [304, -204, 36];

// ---- the banker, the merchant, the carter, the cart -----------------------------------------------------------------
const BANKER_Z = 132;
/** behind the counter (feet hidden): under the heap, along with the sweep, at the ledger, behind the box */
const bankerX = (f: number) => lerp(lerp(lerp(92, 138, ez(f, T.sweep[0] - 4, T.sweep[1])), 214, ez(f, T.toBox[0], T.toBox[1])), 196, ez(f, 214, 240));
const MER = { x0: 422, z: 10, x1: 452 };
/** the merchant's stride (units), solved so his walk lands at MER.x1 */
const MER_STRIDE = 23;
const CARTER = { x: 595, z: 60 };
const CART = { z0: 40, z1: 84, hx: 36, gap: 10, len: 84 };
/** the carter's open palm, held out to the merchant */
const PALM: V3 = [522, -178, 38];

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
  const neck = "M-9,-21 L9,-21 L13,-29 C6,-31 -6,-31 -13,-29Z";
  // the open mouth, heaped with silver (the loan is money, plainly)
  const heap: [number, number, number][] = [
    [-7, -30, -12],
    [6, -30.5, 10],
    [-1, -31, 4],
    [-4, -33.5, -20],
    [4, -34, 16],
    [0, -36.5, 2],
  ];
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
      <ellipse cx={0} cy={-29.5} rx={13.5} ry={3.6} fill={fog("#3A2B1F")} />
      {heap.map(([x, y, t], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${t})`}>
          <ellipse cx={0} cy={1.1} rx={5.2} ry={2.1} fill={fog(COIN.edge)} stroke={fog(COIN.line)} strokeWidth={0.4} />
          <ellipse cx={0} cy={0} rx={5.2} ry={2.1} fill={fog(COIN.top)} stroke={fog(COIN.line)} strokeWidth={0.35} />
          <ellipse cx={-1.4} cy={-0.5} rx={2.1} ry={0.8} fill={fog(COIN.glint)} opacity={0.6} />
        </g>
      ))}
      <path d="M-13,-29 C-6,-26.6 6,-26.6 13,-29" fill="none" stroke={fog(LEATHER.lit)} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-9,-21 C-3,-19 3,-19 9,-21" fill="none" stroke={fog(LEATHER.tie)} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M8,-20 C11,-14 9,-10 12,-6" fill="none" stroke={fog(LEATHER.tie)} strokeWidth={1.5} strokeLinecap="round" />
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
const Arcade: React.FC<{ A: AirWorld; people?: React.ReactNode }> = ({ A, people }) => {
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
      {people}
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
  const merX = (g: number) => MER.x0 + walkTravel(g, T.walk[0], T.walk[1], 6, MER_STRIDE, 30);
  const merFacing = (g: number) => ez(g, T.turn[0], T.turn[1]); // 0 = facing left, 1 = facing right
  const payingAt = (g: number) => ez(g, T.tipIn[0], T.tipIn[1]) * (1 - ez(g, T.tipOut[0], T.tipOut[1]));
  /** the tipped bag's centre: its mouth just above the carter's palm */
  const TIP_C: V3 = (() => {
    const m = rot2([0, -31 * BAG_K], 100);
    return [PALM[0] - m[0], PALM[1] - 30 - m[1], PALM[2] - 4];
  })();

  // ---------------------------------------------------------------- the bag's path (banker, then merchant)
  const bagAt = (g: number): V3 => {
    if (g < T.bagLift[0]) return BAG_IN_BOX;
    if (g < T.bagLift[1]) return mix3(BAG_IN_BOX, BAG_UP, ez(g, T.bagLift[0], T.bagLift[1]));
    if (g < T.bagOut[1]) return mix3(BAG_UP, BAG_OUT, ez(g, T.bagOut[0], T.bagOut[1]));
    if (g < T.bagHand[0]) return BAG_OUT;
    if (g < T.bagHand[1]) return mix3(BAG_OUT, BAG_GIVEN, ez(g, T.bagHand[0], T.bagHand[1]));
    const X = merX(g);
    const hugged: V3 = [X + lerp(-26, 26, merFacing(g)), -214, MER.z - 22];
    if (g < T.hug[1]) return mix3(BAG_GIVEN, hugged, ez(g, T.bagHand[1], T.hug[1]));
    const bob = g > T.walk[0] && g < T.walk[1] ? 2.2 * Math.sin((4 * Math.PI * (g - T.walk[0])) / 30) : 0;
    return mix3([hugged[0], hugged[1] + bob, hugged[2]], TIP_C, payingAt(g));
  };
  /** the bag's tilt (deg, + = its mouth swings toward screen right): a little on the lift, 100 when he tips it to pay */
  const bagTilt = (g: number) => (g > T.bagLift[0] && g < T.bagHand[0] ? -5 : 0) + 100 * payingAt(g);
  /** the bag's open mouth in 3D (where the paid coins leave it) */
  const bagMouth3 = (g: number): V3 => {
    const b = bagAt(g);
    const m = rot2([0, -31 * BAG_K], bagTilt(g));
    return [b[0] + m[0], b[1] + m[1], b[2]];
  };
  const bag3 = bagAt(f);
  const bag2 = p3(bag3);
  const bagS = P.r(bag3[2]);
  const bagSide = (dx: number, dy: number): P2 => {
    const v = rot2([dx * BAG_K * bagS, dy * BAG_K * bagS], bagTilt(f));
    return [bag2[0] + v[0], bag2[1] + v[1]];
  };
  /** the banker's fist round the bag's neck (just under its open mouth) */
  const neck3: V3 = [bag3[0] - 1, bag3[1] - 24 * BAG_K, bag3[2]];

  // ---------------------------------------------------------------- the banker (behind the counter: feet never seen)
  const BX = bankerX(f);
  const bFeet = P.at(BX, BANKER_Z);
  const bankerBase = poseTrack([
    [0, RomeFolk.headTurn(RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(-1), 0.55), -0.6)],
    [T.sweep[0] - 6, { ...RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(-1), 0.4), pitch: 10 }],
    [T.sweep[1], { ...RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(1), 0.3), pitch: 8 }],
    [T.codexLift[1], RomeFolk.POSES.front()],
    [T.codexDown[1], { ...RomeFolk.POSES.front(), pitch: 6 }],
    [T.boxReach[1], { ...RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(1), 0.5), lean: 6, pitch: 14 }],
    [T.bagLift[1], { ...RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(1), 0.7), pitch: 4 }],
    [T.bagOut[1], RomeFolk.headTurn({ ...RomeFolk.POSES.stand(1), lean: 8, brow: -0.3, mouth: 0.3 }, 0.75)],
    [T.bagHand[1], RomeFolk.headTurn({ ...RomeFolk.POSES.stand(1), lean: 8, brow: -0.3, mouth: 0.3 }, 0.75)],
    [T.bagHand[1] + 18, RomeFolk.headTurn(RomeFolk.POSES.stand(1), 0.7)],
    [260, RomeFolk.headTurn(RomeFolk.lerpFig(RomeFolk.POSES.front(), RomeFolk.POSES.stand(1), 0.5), 0.5)],
  ]);
  const bPose0 = RomeFolk.idle(bankerBase(f), f, 1);
  const free0 = RomeFolk.romeAnchors("dominus", bPose0, bFeet.at, bFeet.scale, { variant: 0 });
  const sweepY = TABLE.top - 6;
  // the left hand rests on the counter's back edge beside him whenever it has nothing to do
  const restL3: V3 = [Math.min(TABLE.x1 - 10, BX - 34), TABLE.top - 4, TABLE.z1 - 12];
  const restR3: V3 = [Math.min(TABLE.x1 - 6, BX + 30), TABLE.top - 4, TABLE.z1 - 10];
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
  /** a smooth arc (quadratic) between two 3D points over a waypoint */
  const arc3 = (a: V3, m: V3, b: V3, t: number): V3 => mix3(mix3(a, m, t), mix3(m, b, t), t);
  let gL: V3 = restL3;
  let gR: V3 = restR3;
  const c0L = codexPt(T.codexLift[0], -CODEX_W - 2, 4);
  const c0R = codexPt(T.codexLift[0], CODEX_W + 2, 4);
  const cdR = codexPt(T.codexDown[1], CODEX_W + 2, 4);
  const cdL = codexPt(T.codexDown[1], -CODEX_W - 2, 4);
  if (f < T.sweep[0] - 10) {
    gL = handAt(0);
    gL = mix3(restL3, gL, 0);
  } else if (f < T.sweep[0]) {
    gL = mix3(restL3, handAt(0), ez(f, T.sweep[0] - 10, T.sweep[0]));
  } else if (f < T.sweep[1] + 2) {
    gL = handAt(sweepH(f));
  } else if (f < T.codexLift[0]) {
    gL = mix3(handAt(SL), c0L, ez(f, T.sweep[1] + 2, T.codexLift[0]));
    gR = mix3(restR3, c0R, ez(f, T.codexReach[0], T.codexLift[0]));
  } else if (f < T.write[0] || (f >= T.codexDown[0] && f < T.codexDown[1])) {
    gL = codexL;
    gR = codexR;
  } else if (f < T.codexDown[0]) {
    gL = codexL;
    gR = tip3;
  } else {
    // the left hand lets go of the codex and comes to rest on the counter; the right hand arcs over the box's rim
    // to the bag's neck (contact f172), lifts it, holds it out to the merchant, lets go at f206 and comes back
    gL = mix3(cdL, restL3, ez(f, T.codexDown[1], T.codexDown[1] + 12));
    if (f < T.boxReach[1]) {
      const over: V3 = [BAG_IN_BOX[0] - 6, BOX.top - 64, BAG_IN_BOX[2] + 6];
      gR = arc3(cdR, over, neck3, ez(f, T.codexDown[1], T.boxReach[1]));
    } else if (f < T.bagHand[1]) {
      gR = neck3;
    } else {
      gR = mix3(neck3, [BX + 40, -170, BANKER_Z - 40], ez(f, T.bagHand[1], T.bagHand[1] + 16));
      if (f >= T.bagHand[1] + 16) gR = mix3([BX + 40, -170, BANKER_Z - 40], restR3, ez(f, T.bagHand[1] + 16, T.bagHand[1] + 30));
    }
  }
  const writingNow = f >= T.write[0] && f < T.codexDown[0];
  const bGrip: { L?: P2; R?: P2 } = { L: p3(gL), R: writingNow ? [p3(gR)[0] + 7 * bFeet.scale, p3(gR)[1] + 5 * bFeet.scale] : p3(gR) };
  void free0;
  const bPose = RomeFolk.gripTo("dominus", 0, bPose0, bGrip, bFeet.at, bFeet.scale);
  const banker = (uid: string, onlyArm?: "L" | "R") => <RomeFolk.Dominus key={uid} pose={bPose} at={bFeet.at} scale={bFeet.scale} uid={uid} variant={0} stripe ring fog={figD(BX, BANKER_Z)} unitPx={A.k} onlyArm={onlyArm} />;

  // ---------------------------------------------------------------- the merchant
  const mX = merX(f);
  const mFeet = P.at(mX, MER.z);
  const mStandL = RomeFolk.headTurn(RomeFolk.POSES.stand(-1), -0.8);
  const mStandR = { ...RomeFolk.POSES.stand(1), lean: 5, pitch: 3 };
  const walking = f > T.walk[0] && f < T.walk[1];
  const mAmt = walkAmt(f, T.walk[0], T.walk[1], 6);
  const eager = ez(f, T.reach[0], T.reach[1]) * (1 - ez(f, T.hug[0], T.hug[1]));
  const paying = payingAt(f);
  const mPoseBase = walking
    ? { ...RomeFolk.walkPose(mStandR, (f - T.walk[0]) / 30, mAmt, MER_STRIDE), lean: 12 * mAmt + 5 * (1 - mAmt) }
    : {
        ...RomeFolk.lerpFig(mStandL, mStandR, merFacing(f)),
        lean: lerp(0, -4, eager) * (1 - merFacing(f)) + 6 * paying * merFacing(f),
        pitch: 3 + 10 * paying,
        brow: lerp(0, -0.4, Math.max(eager, paying)),
        mouth: lerp(0, 0.35, Math.max(eager, paying)),
      };
  let mGrip: { L?: P2; R?: P2 } = {};
  if (f >= T.reach[0] && f < T.bagHand[0]) {
    // both hands come up and out, open, and close on the bag's near half at f198
    const u = ez(f, T.reach[0], T.reach[1]);
    const n0 = RomeFolk.romeAnchors("freeman", RomeFolk.idle(mStandL, f, 2), mFeet.at, mFeet.scale, { variant: 2 });
    mGrip = { L: mix2(n0.handL, bagSide(26, 4), u), R: mix2(n0.handR, bagSide(10, 22), u) };
  } else if (f >= T.bagHand[0] && f < T.turn[0]) {
    mGrip = { L: bagSide(26, 4), R: bagSide(10, 22) };
  } else if (f >= T.turn[0]) {
    // holding the bag at his chest; when paying, one hand at its neck and one under its base, tipping it
    const u = merFacing(f);
    const hold: { L: P2; R: P2 } = { L: bagSide(lerp(26, -26, u), 4), R: bagSide(lerp(10, 26, u), lerp(22, 6, u)) };
    const tipG: { L: P2; R: P2 } = { L: bagSide(-4, -22), R: bagSide(4, 24) };
    mGrip = { L: mix2(hold.L, tipG.L, paying), R: mix2(hold.R, tipG.R, paying) };
  }
  const mOpen = ez(f, T.reach[0], T.reach[0] + 8) * (1 - ez(f, T.reach[1] - 3, T.reach[1]));
  const mPoseB = RomeFolk.idle(mPoseBase, f, 2);
  const mPose = RomeFolk.gripTo(
    "freeman",
    2,
    { ...mPoseB, armL: { ...mPoseB.armL, fist: lerp(mPoseB.armL.fist, 0, mOpen) }, armR: { ...mPoseB.armR, fist: lerp(mPoseB.armR.fist, 0, mOpen) } },
    mGrip,
    mFeet.at,
    mFeet.scale,
  );

  // ---------------------------------------------------------------- the carter and the cart
  // he waits at his handcart, fists on its poles; turns to the merchant and holds out his open palm; the coins land in
  // it; he closes his fist on them and tucks it at his belt, turns back, takes up the poles and pushes off
  const rollStart = T.roll[0];
  let cDx = 0;
  for (let h = rollStart; h < f; h++) cDx += 1.0 * ez(h + 0.5, rollStart, rollStart + 12);
  const cX = CARTER.x + cDx;
  const cFeet = P.at(cX, CARTER.z);
  const handle3: V3 = [CARTER.x + CART.hx + cDx, -178, CARTER.z - 18];
  const handle3b: V3 = [CARTER.x + CART.hx + cDx, -178, CARTER.z + 18];
  const cFace = ez(f, T.cFaceL[0], T.cFaceL[1]) * (1 - ez(f, T.cFaceR[0], T.cFaceR[1]));
  const cHold = RomeFolk.POSES.push(1, 0, 0);
  const cTurned = { ...RomeFolk.headTurn(RomeFolk.POSES.stand(-1), -0.75, 10), brow: -0.2, mouth: 0.25 };
  const palmOut = ez(f, T.palm[0], T.palm[1]) * (1 - ez(f, T.close[1], T.close[1] + 8));
  const fistC = ez(f, T.close[0], T.close[1]);
  let cPose: FigPose;
  let cGrip: { L?: P2; R?: P2 };
  if (f < rollStart) {
    const look = ez(f, T.cFaceL[0] - 10, T.cFaceL[0]) * (1 - cFace);
    const q = RomeFolk.lerpFig({ ...cHold, headYaw: lerp(cHold.headYaw, -0.55, look) }, cTurned, cFace);
    cPose = RomeFolk.idle({ ...q, armR: { ...q.armR, fist: lerp(lerp(q.armR.fist, 0, palmOut), 1, fistC), hand: lerp(q.armR.hand, -36, palmOut) } }, f, 3);
    const a0 = RomeFolk.romeAnchors("freeman", cPose, cFeet.at, cFeet.scale, { variant: 1 });
    // off the poles as he turns to the merchant, back on as he turns away (fists on them by f280)
    const onH = 1 - ez(f, T.cFaceL[0], T.cFaceL[0] + 8) + ez(f, T.cFaceR[0] + 2, T.roll[0] - 2);
    const belt: P2 = p3([CARTER.x - 14, -150, CARTER.z - 30]);
    let r: P2 = mix2(a0.handR, p3(handle3b), c01(onH));
    r = mix2(r, p3(PALM), palmOut);
    r = mix2(r, belt, ez(f, T.close[1], T.close[1] + 8) * (1 - ez(f, T.cFaceR[0] + 2, T.roll[0] - 2)));
    cGrip = { L: mix2(a0.handL, p3(handle3), c01(onH)), R: r };
  } else {
    cPose = RomeFolk.POSES.push(1, (f - rollStart) / 40, ez(f, rollStart, rollStart + 12));
    cGrip = { L: p3(handle3), R: p3(handle3b) };
  }
  const cPoseG = RomeFolk.gripTo("freeman", 1, cPose, cGrip, cFeet.at, cFeet.scale);
  // the pay: silver tipped from the bag's mouth into his palm (visible until his fist closes)
  const payCoins: { c: P2; s: number; tilt: number; key: string }[] = [];
  if (f >= T.pour[0] && f < T.close[0] + 3) {
    const mouth = bagMouth3(f);
    for (let i = 0; i < 6; i++) {
      const te = T.pour[0] + i * 1.6;
      if (f < te) continue;
      const land: V3 = [PALM[0] - 4 + 7 * hash(i, 71), PALM[1] - 6 - 3 * (i % 3), PALM[2] - 4 + 8 * hash(i, 72)];
      const s = c01((f - te) / 7);
      const m0 = bagMouth3(te);
      const pos: V3 = s < 1 ? [lerp(m0[0], land[0], s), m0[1] + (land[1] - m0[1]) * s * s, lerp(m0[2], land[2], s)] : land;
      void mouth;
      payCoins.push({ c: p3(pos), s: P.r(pos[2]), tilt: (hash(i, 73) - 0.5) * 40 + (1 - s) * 60, key: `pc${i}` });
    }
  }

  // ---------------------------------------------------------------- the queue
  const d1 = { X: -40, Z: 46 };
  const d2 = { X: -112, Z: 160 };
  const sl = { X: -182, Z: 280 };
  const d1Feet = P.at(d1.X, d1.Z);
  const d2Feet = P.at(d2.X, d2.Z);
  const slFeet = P.at(sl.X, sl.Z);
  const raise = ez(f, T.pour1[0] - 14, T.pour1[0]) * (1 - ez(f, T.pour1[1] + 2, T.pour1[1] + 16));
  const tip = lerp(0, 128, ez(f, T.pour1[0], T.pour1[0] + 7)) * (1 - ez(f, T.pour1[1] - 4, T.pour1[1] + 6));
  const d1Rest3: V3 = [d1.X + 30, -150, d1.Z - 16];
  const d1Up3: V3 = [HEAP1.x - 8, -224, HEAP1.z - 6];
  const d1Hold3: V3 = mix3(d1Rest3, d1Up3, raise);
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
  const coinFog = fogNear(50);
  const tableCoins: { c: P2; s: number; tilt: number; key: string; zz: number; yy: number }[] = [];
  const pourCoins: { c: P2; s: number; tilt: number; key: string }[] = [];
  const boxFalling: { c: P2; s: number; tilt: number; key: string }[] = [];
  const fillY = BOX_FILL0 - 0.22 * coinsIn(f);
  COINS.forEach((c, i) => {
    if (f < c.te) return;
    const tipAng = lerp(0, 128, ez(c.te, T.pour1[0], T.pour1[0] + 7));
    const m0 = purseMouth(mix3(d1Rest3, d1Up3, ez(c.te, T.pour1[0] - 14, T.pour1[0])), tipAng);
    if (f < c.te + FALL_T) {
      const s = (f - c.te) / FALL_T;
      const pos: V3 = [lerp(m0[0], c.rest[0], s), m0[1] + (c.rest[1] - m0[1]) * s * s, lerp(m0[2], c.rest[2], s)];
      pourCoins.push({ c: p3(pos), s: P.r(pos[2]), tilt: c.tilt + (1 - s) * 70 * (i % 2 ? 1 : -1), key: `fc${i}` });
      return;
    }
    const e = EDGE[i];
    if (f < e) {
      const xz = pushedXZ(c, f);
      const moved = Math.hypot(xz[0] - c.rest[0], xz[1] - c.rest[2]);
      const pushed = moved > 0.01;
      const yy = pushed ? TABLE.top - 1.6 - 7 * hash(i, 41) * c01(moved / 30) : c.rest[1];
      tableCoins.push({ c: p3([xz[0], yy, xz[1]]), s: P.r(xz[1]), tilt: c.tilt + (pushed ? 14 * Math.sin(moved * 0.09 + i) : 0), key: `tc${i}`, zz: xz[1], yy });
      return;
    }
    // over the end: it drops into the box
    const t = f - e;
    const ez0 = pushedXZ(c, e);
    const y = TABLE.top - 1.6 + 0.6 * t * t;
    if (y > fillY) return;
    boxFalling.push({ c: p3([TABLE.x1 + 3 + 2.2 * t, y, ez0[1]]), s: P.r(ez0[1]), tilt: c.tilt + t * 18, key: `bc${i}` });
  });
  tableCoins.sort((a, b) => b.zz - a.zz || b.yy - a.yy);
  const boxCoins: React.ReactNode[] = [];
  for (let i = 0; i < 34; i++) {
    const x = lerp(BOX.x0 + 10, BOX.x1 - 10, hash(i, 51));
    const zz = lerp(BOX.z0 + 8, BOX.z1 - 8, hash(i, 52));
    if (Math.abs(x - BAG_IN_BOX[0]) < 26 && Math.abs(zz - BAG_IN_BOX[2]) < 22 && f < T.bagLift[0]) continue;
    boxCoins.push(<CoinShape key={i} c={p3([x, fillY - 1.5 * hash(i, 53), zz])} s={P.r(zz)} tilt={(hash(i, 54) - 0.5) * 40} fog={fogNear(zz)} />);
  }

  // ---------------------------------------------------------------- the light: the arcade's shade (and its roof's), the street's sun
  const vw = (() => {
    const yTop = cam.cy - 1200 / cam.k;
    const yBot = cam.cy + 1200 / cam.k;
    const xl = cam.cx - 1400 / cam.k;
    const xr = cam.cx + 1400 / cam.k;
    const x0 = P.p(SHADE_X0, 0, 150)[0];
    const x1 = P.p(SHADE_X1, 0, 150)[0];
    return { yTop, yBot, xl, xr, x0, x1 };
  })();
  const roofY0 = cam.cy - 960 / cam.k;
  const roofY1 = cam.cy - 260 / cam.k;
  const shadeVeil = (
    <g>
      <defs>
        <linearGradient id="bk-sv" gradientUnits="userSpaceOnUse" x1={vw.x0.toFixed(2)} y1="0" x2={vw.x1.toFixed(2)} y2="0">
          <stop offset="0" stopColor="#241F1A" stopOpacity={0.42} />
          <stop offset="1" stopColor="#241F1A" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="bk-svm" gradientUnits="userSpaceOnUse" x1={vw.x0.toFixed(2)} y1="0" x2={vw.x1.toFixed(2)} y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <linearGradient id="bk-roof" gradientUnits="userSpaceOnUse" x1="0" y1={roofY0.toFixed(2)} x2="0" y2={roofY1.toFixed(2)}>
          <stop offset="0" stopColor="#1E1A16" stopOpacity={0.55} />
          <stop offset="1" stopColor="#1E1A16" stopOpacity={0} />
        </linearGradient>
        <mask id="bk-roofm" maskUnits="userSpaceOnUse" x={vw.xl.toFixed(2)} y={vw.yTop.toFixed(2)} width={(vw.xr - vw.xl).toFixed(2)} height={(vw.yBot - vw.yTop).toFixed(2)}>
          <rect x={vw.xl.toFixed(2)} y={vw.yTop.toFixed(2)} width={(vw.xr - vw.xl).toFixed(2)} height={(vw.yBot - vw.yTop).toFixed(2)} fill="url(#bk-svm)" />
        </mask>
        <linearGradient id="bk-sun" gradientUnits="userSpaceOnUse" x1={vw.x0.toFixed(2)} y1="0" x2={vw.x1.toFixed(2)} y2="0">
          <stop offset="0" stopColor="#F3E6C8" stopOpacity={0} />
          <stop offset="1" stopColor="#F3E6C8" stopOpacity={0.13} />
        </linearGradient>
      </defs>
      <rect x={vw.xl.toFixed(2)} y={vw.yTop.toFixed(2)} width={(vw.x1 - vw.xl).toFixed(2)} height={(vw.yBot - vw.yTop).toFixed(2)} fill="url(#bk-sv)" />
      {/* the portico's roof: its shadow darkens the top of the frame on the arcade side */}
      <rect x={vw.xl.toFixed(2)} y={roofY0.toFixed(2)} width={(vw.xr - vw.xl).toFixed(2)} height={(roofY1 - roofY0).toFixed(2)} fill="url(#bk-roof)" mask="url(#bk-roofm)" />
      <rect x={vw.x0.toFixed(2)} y={vw.yTop.toFixed(2)} width={(vw.xr - vw.x0).toFixed(2)} height={(vw.yBot - vw.yTop).toFixed(2)} fill="url(#bk-sun)" />
    </g>
  );
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

  // ---------------------------------------------------------------- the counter: a solid timber mensa, panelled front
  const Counter = (() => {
    const { x0, x1, z0, z1, top, th } = TABLE;
    const t = (h: string) => A.tone(h, z0, 60);
    const panels: React.ReactNode[] = [];
    const n = 3;
    for (let i = 0; i < n; i++) {
      const a = lerp(x0 + 12, x1 - 12, i / n) + 6;
      const b = lerp(x0 + 12, x1 - 12, (i + 1) / n) - 6;
      const q = [p3([a, top + th + 22, z0 - 0.6]), p3([b, top + th + 22, z0 - 0.6]), p3([b, -26, z0 - 0.6]), p3([a, -26, z0 - 0.6])];
      panels.push(
        <g key={i}>
          <path d={poly(q)} fill={t(mixHex(WOOD.mid, WOOD.dark, 0.18))} stroke={t(lineOf(WOOD))} strokeWidth={A.lw(0.9)} />
          <path d={`M${Pt(q[0])}L${Pt(q[1])}M${Pt(q[0])}L${Pt(q[3])}`} stroke={t(WOOD.dark)} strokeWidth={2.4 * P.r(z0)} strokeOpacity={0.6} />
          <path d={`M${Pt(q[3])}L${Pt(q[2])}M${Pt(q[1])}L${Pt(q[2])}`} stroke={t(mixHex(WOOD.lit, "#F3EBDD", 0.2))} strokeWidth={1.6 * P.r(z0)} strokeOpacity={0.5} />
        </g>,
      );
    }
    return (
      <g>
        {/* a plinth along its foot */}
        <AirBox A={A} X0={x0 + 1} X1={x1 - 1} Y0={-14} Y1={0} Z0={z0 - 2} Z1={z1 - 2} mat={WOOD} uid="bk-cpl" rim={0.2} />
        <AirBox A={A} X0={x0 + 4} X1={x1 - 4} Y0={top + th} Y1={0} Z0={z0 + 2} Z1={z1 - 4} mat={WOOD} uid="bk-cbody" rim={0.2} />
        {panels}
        <AirBox A={A} X0={x0} X1={x1} Y0={top} Y1={top + th} Z0={z0 - 4} Z1={z1} mat={WOOD} uid="bk-ctop" />
      </g>
    );
  })();
  const BoxBack = (
    <g>
      <path d={poly([p3([BOX.x0, BOX.top, BOX.z1]), p3([BOX.x1, BOX.top, BOX.z1]), p3([BOX.x1, BOX.top, BOX.z0]), p3([BOX.x0, BOX.top, BOX.z0])])} fill={A.tone("#2C2119", 60, 40)} />
      <path d={poly([p3([BOX.x0 + 4, fillY, BOX.z1 - 4]), p3([BOX.x1 - 4, fillY, BOX.z1 - 4]), p3([BOX.x1 - 4, fillY, BOX.z0 + 4]), p3([BOX.x0 + 4, fillY, BOX.z0 + 4])])} fill={A.tone("#868B89", 60, 40)} />
      {boxCoins}
    </g>
  );
  // the lid, lifted off and leaning against the box's right side (inner face toward us, iron straps)
  const lid = (() => {
    const xb = BOX.x1 + 2;
    const xt = BOX.x1 + 26;
    const q: P2[] = [p3([xb, 0, BOX.z0 + 4]), p3([xb, 0, BOX.z1 - 4]), p3([xt, BOX.top + 6, BOX.z1 - 4]), p3([xt, BOX.top + 6, BOX.z0 + 4])];
    const q2: P2[] = [p3([xb, 0, BOX.z0 + 4]), p3([xt, BOX.top + 6, BOX.z0 + 4]), p3([xt + 4, BOX.top + 8, BOX.z0 + 4]), p3([xb + 4, 0, BOX.z0 + 4])];
    return (
      <g>
        <path d={poly(q)} fill={A.tone(mixHex(BOXWOOD.lit, BOXWOOD.mid, 0.3), BOX.z0, 60)} stroke={A.tone(MAT.iron.mid, BOX.z0, 60)} strokeWidth={4 * P.r(BOX.z0)} strokeLinejoin="round" />
        {[0.18, 0.82].map((u) => (
          <path key={u} d={`M${Pt(bil(q, u, 0))}L${Pt(bil(q, u, 1))}`} stroke={A.tone(MAT.iron.mid, BOX.z0, 60)} strokeWidth={6 * P.r(BOX.z0)} />
        ))}
        <path d={poly(q2)} fill={A.tone(BOXWOOD.dark, BOX.z0, 60)} />
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
  const stylus = writingNow
    ? (() => {
        const tp = p3(tip3);
        const s = P.r(codexC(f)[2]);
        return <path d={`M${Pt(tp)}L${Pt([tp[0] + 15 * s, tp[1] + 11 * s])}`} stroke={A.tone("#5A4636", 100, 100)} strokeWidth={2.2 * s} strokeLinecap="round" />;
      })()
    : null;
  const codexHeld = f >= T.codexLift[0] && f < T.codexDown[1];

  // ---------------------------------------------------------------- the handcart: a finished two-wheeled cart
  const Cart = (() => {
    const x0 = CARTER.x + CART.hx + CART.gap + cDx;
    const x1 = x0 + CART.len;
    const { z0, z1 } = CART;
    const R = 44;
    const axX = (x0 + x1) / 2 - 6;
    const ang = (cDx / R) * (180 / Math.PI);
    const bedY = -96;
    const sideY = -136;
    const wheel = (zz: number, key: string, far: boolean) => {
      const c = p3([axX, -R, zz]);
      const s = P.r(zz);
      const sp = Array.from({ length: 8 }, (_, i) => {
        const a = ((ang + i * 45) * Math.PI) / 180;
        return `M${Pt([c[0] + Math.cos(a) * 9 * s, c[1] + Math.sin(a) * 9 * s])}L${Pt([c[0] + Math.cos(a) * R * 0.88 * s, c[1] + Math.sin(a) * R * 0.88 * s])}`;
      }).join("");
      const tn = (h: string) => A.tone(far ? mixHex(h, "#22180F", 0.25) : h, zz, 30);
      return (
        <g key={key}>
          <circle cx={c[0]} cy={c[1]} r={R * 0.93 * s} fill="none" stroke={tn(CARTWOOD.mid)} strokeWidth={8 * s} />
          <circle cx={c[0]} cy={c[1]} r={R * s} fill="none" stroke={tn(MAT.iron.mid)} strokeWidth={3.2 * s} />
          <circle cx={c[0]} cy={c[1]} r={R * 0.86 * s} fill="none" stroke={tn(CARTWOOD.dark)} strokeWidth={1.2 * s} strokeOpacity={0.6} />
          <path d={sp} stroke={tn(CARTWOOD.mid)} strokeWidth={3.6 * s} strokeLinecap="round" />
          <circle cx={c[0]} cy={c[1]} r={10 * s} fill={tn(CARTWOOD.dark)} />
          <circle cx={c[0]} cy={c[1]} r={4.5 * s} fill={tn(MAT.iron.mid)} />
        </g>
      );
    };
    const slats = (zz: number, key: string) => (
      <path
        key={key}
        d={[0.25, 0.5, 0.75].map((u) => `M${Pt(p3([lerp(x0, x1, u), sideY + 3, zz - 0.6]))}L${Pt(p3([lerp(x0, x1, u), bedY - 3, zz - 0.6]))}`).join("")}
        stroke={A.tone(CARTWOOD.dark, zz, 60)}
        strokeWidth={2.2 * P.r(zz)}
        strokeOpacity={0.7}
      />
    );
    const amph = (
      [
        [0.22, 0.72, -5],
        [0.52, 0.7, 4],
        [0.8, 0.74, -3],
        [0.32, 0.3, 6],
        [0.66, 0.28, -6],
      ] as [number, number, number][]
    ).map(([u, w, a], i) => {
      const X = lerp(x0, x1, u);
      const Zm = lerp(z0, z1, w);
      const { at, scale } = P.at(X, Zm);
      return <RomeFolk.Amphora key={i} at={[at[0], at[1] + (bedY + 4) * scale]} scale={scale * 0.74} uid={`bk-ca${i}`} fog={amphFog(A, Zm)} unitPx={A.k} angle={a} />;
    });
    const pole = (zb: number, zh: number, key: string) => (
      <g key={key}>
        <path d={`M${Pt(p3([x0 + 10, bedY - 10, zb]))}L${Pt(p3([CARTER.x + CART.hx + cDx - 4, -178, zh]))}`} stroke={A.tone(CARTWOOD.mid, (zb + zh) / 2, 80)} strokeWidth={7 * P.r((zb + zh) / 2)} strokeLinecap="round" />
        <path d={`M${Pt(p3([x0 + 10, bedY - 12, zb]))}L${Pt(p3([CARTER.x + CART.hx + cDx - 4, -180, zh]))}`} stroke={A.tone(CARTWOOD.lit, (zb + zh) / 2, 80)} strokeWidth={2 * P.r((zb + zh) / 2)} strokeOpacity={0.6} strokeLinecap="round" />
      </g>
    );
    return (
      <g>
        <AirShadow A={A} X={(x0 + x1) / 2} Z={(z0 + z1) / 2} w={72} d={40} uid="bk-cs" amt={0.65} />
        {wheel(z1 + 7, "wf", true)}
        {pole(z1 - 4, CARTER.z + 18, "pf")}
        {/* the bed: the far side, the two ends, the floor; then the load sitting in it; then the near side over it */}
        <AirBox A={A} X0={x0} X1={x1} Y0={sideY} Y1={bedY} Z0={z1 - 4} Z1={z1} mat={CARTWOOD} uid="bk-cfs" rim={0.5} />
        <AirBox A={A} X0={x0} X1={x1} Y0={bedY - 4} Y1={bedY + 6} Z0={z0} Z1={z1} mat={CARTWOOD} uid="bk-cfl" rim={0.3} />
        <AirBox A={A} X0={x0} X1={x0 + 4} Y0={sideY} Y1={bedY} Z0={z0} Z1={z1} mat={CARTWOOD} uid="bk-cel" rim={0.5} />
        <AirBox A={A} X0={x1 - 4} X1={x1} Y0={sideY} Y1={bedY} Z0={z0} Z1={z1} mat={CARTWOOD} uid="bk-cer" rim={0.5} />
        {amph}
        {/* the axle under the bed */}
        <path d={`M${Pt(p3([axX, -R, z0 - 7]))}L${Pt(p3([axX, -R, z1 + 7]))}`} stroke={A.tone(MAT.iron.dark, (z0 + z1) / 2, 30)} strokeWidth={5 * P.r(z0)} />
        <AirBox A={A} X0={x0} X1={x1} Y0={sideY} Y1={bedY} Z0={z0} Z1={z0 + 4} mat={CARTWOOD} uid="bk-cns" rim={0.7} />
        {slats(z0, "sl")}
        {wheel(z0 - 7, "wn", false)}
        {pole(z0 + 4, CARTER.z - 18, "pn")}
      </g>
    );
  })();
  const stack = [0, 1, 2].map((i) => {
    const X = 600 + i * 34;
    const Zs = SHOPS_Z - 40;
    const { at, scale } = P.at(X, Zs);
    return <RomeFolk.Amphora key={i} at={at} scale={scale} uid={`bk-st${i}`} fog={amphFog(A, Zs)} unitPx={A.k} angle={i === 2 ? 8 : 0} />;
  });
  // life in the basilica's hall behind the arches: a few people far back in the dim air
  const hall = (
    [
      [-420, 900, 0, -1, 0.3],
      [-360, 940, 1, 1, 0.3],
      [-60, 1000, 2, 1, 0.2],
      [180, 880, 0, -1, 0.25],
    ] as [number, number, number, 1 | -1, number][]
  ).map(([X, Zh, v, dir], i) => {
    const { at, scale } = P.at(X, Zh);
    return <RomeFolk.Freeman key={i} pose={RomeFolk.idle(RomeFolk.POSES.stand(dir), f, 10 + i)} at={at} scale={scale} uid={`bk-hf${i}`} variant={v} pilleus={false} apron={false} fog={{ rgb: A.airHex(Zh, 120), amount: 0.62 }} unitPx={A.k} texture={false} />;
  });
  // a few things on the floor: dropped coins
  const dropped = (
    [
      [-10, -130, 20],
      [330, -110, -15],
      [-96, -10, 50],
      [380, 150, 10],
    ] as [number, number, number][]
  ).map(([x, zz, t], i) => <CoinShape key={i} c={p3([x, -1, zz])} s={P.r(zz)} tilt={t} fog={fogNear(zz)} />);

  const bagEl = <Bag c={bag2} s={bagS} size={BAG_K} fog={fogNear(bag3[2])} uid="bk-bag" tilt={bagTilt(f)} />;
  const bagInBox = f < T.bagLift[0] + 3;
  const merchant = <RomeFolk.Freeman pose={mPose} at={mFeet.at} scale={mFeet.scale} uid="bk-mer" variant={2} pilleus={false} apron={false} fog={figD(mX, MER.z)} unitPx={A.k} />;
  const armToBox = f >= T.codexDown[1] && f < T.bagHand[1] + 30;
  return (
    <AirStage v={A.v} bloom={0}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-1400} x1={2400} z0={-700} z1={4200} mat={FLOOR} course={150} plank={150} />
        <Street A={A} frame={f} />
        <Arcade A={A} people={hall} />
        {stack}
        {dropped}
        {shadeVeil}
        <AirShadow A={A} X={sl.X} Z={sl.Z} w={60} d={28} uid="bk-sh-sl" amt={0.7} />
        <AirShadow A={A} X={d2.X} Z={d2.Z} w={60} d={28} uid="bk-sh-d2" amt={0.75} />
        <AirShadow A={A} X={(TABLE.x0 + TABLE.x1) / 2} Z={(TABLE.z0 + TABLE.z1) / 2} w={120} d={60} uid="bk-sh-t" amt={0.7} />
        <AirShadow A={A} X={(BOX.x0 + BOX.x1) / 2} Z={(BOX.z0 + BOX.z1) / 2} w={64} d={50} uid="bk-sh-bx" amt={0.75} />
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
        {/* the banker behind his counter and the strongbox (his body first, then everything in front of it) */}
        {banker("bk-banker")}
        {BoxBack}
        {bagInBox ? bagEl : null}
        {boxFalling.map((c) => (
          <CoinShape key={c.key} c={c.c} s={c.s} tilt={c.tilt} fog={coinFog} />
        ))}
        {armToBox && bagInBox ? banker("bk-banker-Rb", "R") : null}
        {BoxFront}
        {lid}
        {Counter}
        {codexHeld ? null : Codex}
        {tableCoins.map((c) => (
          <CoinShape key={c.key} c={c.c} s={c.s} tilt={c.tilt} fog={coinFog} />
        ))}
        {/* his hands always work on top of the counter: his arms are drawn over it */}
        {banker("bk-banker-L", "L")}
        {codexHeld ? Codex : null}
        {stylus}
        {!armToBox || !bagInBox ? banker("bk-banker-R", "R") : null}
        {/* the first depositor pouring */}
        <RomeFolk.Freeman pose={d1Pose} at={d1Feet.at} scale={d1Feet.scale} uid="bk-d1" variant={0} pilleus={false} apron={false} fog={figD(d1.X, d1.Z)} unitPx={A.k} />
        <Purse c={p3(d1Hold3)} s={P.r(d1Hold3[2])} tip={tip} fog={fogNear(d1Hold3[2])} uid="bk-p1" />
        {pourCoins.map((c) => (
          <CoinShape key={c.key} c={c.c} s={c.s} tilt={c.tilt} fog={coinFog} flat={0.6} />
        ))}
        {/* the merchant and the bag */}
        {merchant}
        {!bagInBox ? bagEl : null}
        {payCoins.map((c) => (
          <CoinShape key={c.key} c={c.c} s={c.s} tilt={c.tilt} fog={coinFog} flat={0.55} />
        ))}
        {f >= T.bagLift[0] && f < T.bagHand[1] + 2 ? banker("bk-banker-Rh", "R") : null}
        {lowAir}
      </WorldSvg>
    </AirStage>
  );
};

export default BanksLendToDebtors;
