// LargerForce: every moving thing as pure maths (no React), so the component and
// the scratch checks (camera scan, land, overlaps) read the same numbers.
//   the lanes      one reference curve (the band's centre): it comes in from the
//                  ENE through the Florida Straits along Cuba's north-west coast
//                  (bearing 260), bends 10 deg round the island's western end and
//                  runs due WEST across the open Gulf, north of Cabo Catoche and
//                  the Alacranes reef. Four files ride parallels of it, each by
//                  its own arclength: cream N / cream S (Narvaez, 1520), a clear
//                  lane gap, orange N / orange S (Cortes's fleet of 1519).
//   the fleets     each a two-file convoy: file A one ship per row, file B one
//                  ship in each gap (a zig-zag whose stagger wanders), row gaps
//                  varying a few per cent, small hashed offsets and a slow
//                  individual drift: loose, never a lattice. Cream 19 = 10 + 9,
//                  orange 11 = 6 + 5 copying the cream's rows 4..9, so the
//                  sterns line up and the cream runs 4 rows on.
//   the camera     its own keyed track (cortesShared makeCamera: cx, cy, ln k
//                  through pchip, C1), never chasing a ship.
import { CONTENT_Y, SCREEN_CX, SITES, hash, makeCamera, pchip, type Cam, type P2 } from "./cortesShared";

export const FPS = 24;
// In-point 25.44 s on the EDIT timeline (the SRT's). The line's last word
// "originally" ends 31.079 s: round((31.08 - 25.44) * 24) = round(135.36) = 135,
// + the 16-frame house tail = 151 frames.
export const DURATION = 151;
export const LAST = DURATION - 1;

/** word onsets, frames from the in-point: f = round((t - 25.44) * 24) */
export const W = {
  and: 0,
  sends: 9,
  us: 15,
  under: 19,
  panfilo: 28,
  de: 47,
  narvaez: 50,
  a: 70,
  larger: 72,
  force: 80,
  than: 88,
  the: 91,
  one: 93,
  cortes: 98,
  brought: 112,
  with: 118,
  him: 121,
  originally: 124,
  lineEnd: 135,
};

// ---------------------------------------------------------------------------
// SIZES. The comparison is framed at k ~2.45; every spacing is set there in
// screen px and fixed in the world. A ship is drawn at size(k) screen px (the
// Carrack's 100-unit frame: ~1.02 size wide bowsprit to stern, ~0.88 size tall
// pennant to keel), growing gently with k so the opening reads close-up.
// ---------------------------------------------------------------------------
export const K_REF = 2.45;
export const SHIP_SIZE_REF = 56;
export const shipSize = (k: number) => SHIP_SIZE_REF * Math.pow(k / K_REF, 0.5);
const PX = (screenPx: number) => screenPx / K_REF; // screen px at K_REF -> world px
/** along-track distance between rows of one file (world px) */
export const ROW = PX(80);
/** the nominal stagger of the second file (half a row; BETA below loosens it) */
export const HALF = ROW / 2;
/** the four files' offsets from the reference line (world px, + = south) */
export const OFF = {
  creamN: -PX(96),
  creamS: -PX(38),
  orangeN: PX(38),
  orangeS: PX(96),
};

// ---------------------------------------------------------------------------
// THE LANES. Each file rides its own parallel of one reference line (the
// band's centre) and is parametrised by its OWN arclength u, increasing WEST
// (the direction of travel), u = 0 at the cape's longitude on the straight
// part. So spacing along a file never compresses in the bend, and on the
// straight part equal u means level (same x) across all four files.
// ---------------------------------------------------------------------------
export const CAPE: P2 = [SITES.caboSanAntonio.x, SITES.caboSanAntonio.y];
/** the reference line's y on the straight westward part (the orange S file at 718) */
export const Y_REF = 718 - PX(96);
/** where the bend ends (the straight part starts), world x */
export const X_BEND_END = 676;
const RHO = 110; // the reference line's bend radius (inner file 71, outer 149)
const TH = (10 * Math.PI) / 180; // the bend: bearing 260 -> 270
const U_E = CAPE[0] - X_BEND_END; // u at the bend's west end (negative: east of the cape)
const BC: P2 = [X_BEND_END, Y_REF - RHO]; // the bend's centre (north of the line)
/** a point of the lane system: a file's own arclength u, its offset o (+ = south / left of travel) */
export const lanePoint = (u: number, o: number): P2 => {
  if (u >= U_E) return [CAPE[0] - u, Y_REF + o];
  const R = RHO + o; // this file's radius in the bend
  const uS = U_E - R * TH; // its bend's east end
  if (u >= uS) {
    const th = (U_E - u) / R;
    return [BC[0] + R * Math.sin(th), BC[1] + R * Math.cos(th)];
  }
  // the approach: straight, bearing 260, back toward the ENE
  const back = uS - u;
  return [BC[0] + R * Math.sin(TH) + back * Math.cos(TH), BC[1] + R * Math.cos(TH) - back * Math.sin(TH)];
};

// ---------------------------------------------------------------------------
// INTEGRATION of a speed profile (world px / frame) keyed through pchip
// ---------------------------------------------------------------------------
const F_LO = -120;
const F_HI = 300;
const DT = 0.05;
const integral = (vKeys: [number, number][]) => {
  const v = pchip(vKeys, true);
  const n = Math.round((F_HI - F_LO) / DT) + 1;
  const tab = new Float64Array(n);
  for (let i = 1; i < n; i++) tab[i] = tab[i - 1] + v(F_LO + (i - 0.5) * DT) * DT;
  const at = (f: number) => {
    const x = (Math.max(F_LO, Math.min(F_HI, f)) - F_LO) / DT;
    const i = Math.min(n - 2, Math.floor(x));
    return tab[i] + (tab[i + 1] - tab[i]) * (x - i);
  };
  return { v, at };
};

// ---------------------------------------------------------------------------
// THE CREAM FLEET (Narvaez, 1520): 19 carracks, files of 10 (north, the lead
// and the tail) and 9 (south). The formation sails at V(t): a steady pour while
// it comes out round Cuba's western end, then it settles to a slow steady sail.
// ---------------------------------------------------------------------------
export const N_CREAM_SHIPS = 19;
export const N_ORANGE_SHIPS = 11;
// a gentle surge in the pour (so ships round the corner at uneven intervals),
// then it eases to the steady sail
const V_CREAM: [number, number][] = [
  [-120, 3.55],
  [8, 3.7],
  [30, 3.3],
  [52, 3.6],
  [76, 2.5],
  [98, 1.15],
  [124, 0.82],
  [300, 0.78],
];
const CREAM_I = integral(V_CREAM);
/** frame the cream lead passes the cape's longitude ("sends" f9 .. "us") */
export const F_LEAD_AT_CAPE = 20;
/** the cream lead's u at frame f */
export const creamLeadU = (f: number) => CREAM_I.at(f) - CREAM_I.at(F_LEAD_AT_CAPE);
export const creamSpeed = (f: number) => CREAM_I.v(f);

// ---------------------------------------------------------------------------
// THE ORANGE FLEET (Cortes, 1519): 11 hollow carracks, files of 6 (south, lead
// and tail) and 5 (north). Aligned, its tail is level with the cream tail
// (orange lead = cream lead - 4 rows). It comes in round the island behind the
// cream, faster, and eases into that alignment by ~"with"; from then on it
// keeps the cream's pace exactly.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE FORMATION, shared by both fleets. File A carries one ship per row; file B
// one ship in each gap between rows, at a fraction BETA of that gap (a slow
// random walk, so the zig-zag loosens and tightens); the row gaps vary a few
// per cent. So ships come round the corner at uneven intervals, never a
// metronome. The orange fleet copies the cream's rows 4..9 exactly: every
// orange ship sails level with a cream ship, and the cream runs 4 rows on.
// ---------------------------------------------------------------------------
const N_ROWS = 10;
const GAPS: number[] = (() => {
  const raw = Array.from({ length: N_ROWS - 1 }, (_, r) => 1 + 0.06 * (2 * hash(r, 41) - 1));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((g) => (g * (N_ROWS - 1) * ROW) / sum); // total: exactly 9 rows
})();
const ROW_AT: number[] = GAPS.reduce((acc, g) => [...acc, acc[acc.length - 1] + g], [0]);
const BETA: number[] = (() => {
  const out = [0.5 + 0.08 * (2 * hash(0, 43) - 1)];
  for (let r = 1; r < N_ROWS - 1; r++) out.push(Math.max(0.46, Math.min(0.66, out[r - 1] + 0.08 * (2 * hash(r, 43) - 1))));
  return out;
})();
/** along-track offset behind its fleet's lead of ship j (cream: rows 0..9; orange: the cream's rows 4..9) */
const formationA = (fleet: "cream" | "orange", j: number) => {
  const r0 = fleet === "cream" ? 0 : 4;
  const r = r0 + (j >> 1);
  const a = j % 2 === 0 ? ROW_AT[r] : ROW_AT[r] + GAPS[r] * BETA[r];
  return a - ROW_AT[r0];
};
export const ALIGN_LAG = ROW_AT[4]; // the orange lead sits level with cream row 4
// It closes on its place at a steady ORANGE_R world px / f faster than the
// cream, then from ORANGE_IN sheds that extra speed over ORANGE_L frames along
// a smoothstep (braking starts and ends gently) and keeps the cream's pace.
const ORANGE_R = 5.6;
const ORANGE_IN = 110;
const ORANGE_L = 16;
export const ORANGE_SET = ORANGE_IN + ORANGE_L;
/** how far (world px) the orange fleet still lags its aligned place */
export const orangeLag = (f: number) => {
  const L = ORANGE_L;
  if (f >= ORANGE_SET) return 0;
  if (f <= ORANGE_IN) return ORANGE_R * (L / 2 + ORANGE_IN - f);
  const x = (f - ORANGE_IN) / L; // integral of R (1 - smoothstep) from x to 1
  return ORANGE_R * L * (0.5 - x + x * x * x - (x * x * x * x) / 2);
};
export const orangeLeadU = (f: number) => creamLeadU(f) - ALIGN_LAG - orangeLag(f);

// ---------------------------------------------------------------------------
// SHIPS
// ---------------------------------------------------------------------------
export type ShipDef = { fleet: "cream" | "orange"; j: number; seed: number; a: number; o: number; da: number; dn: number };
const shipDefs = (): ShipDef[] => {
  const out: ShipDef[] = [];
  for (let j = 0; j < N_CREAM_SHIPS; j++) {
    const seed = 100 + j;
    out.push({
      fleet: "cream",
      j,
      seed,
      a: formationA("cream", j),
      o: j % 2 === 0 ? OFF.creamN : OFF.creamS,
      da: (hash(seed, 21) - 0.5) * 2 * JIT_A,
      dn: (hash(seed, 22) - 0.5) * 2 * JIT_N,
    });
  }
  for (let j = 0; j < N_ORANGE_SHIPS; j++) {
    const seed = 200 + j;
    out.push({
      fleet: "orange",
      j,
      seed,
      a: formationA("orange", j),
      o: j % 2 === 0 ? OFF.orangeS : OFF.orangeN,
      da: (hash(seed, 21) - 0.5) * 2 * JIT_A,
      dn: (hash(seed, 22) - 0.5) * 2 * JIT_N,
    });
  }
  return out;
};
// small hashed offsets on top (world px): along the file (the in-file gap is
// >= ~3.5 world px) and across it
const JIT_A = 0.7;
const JIT_N = 0.9;
export const SHIPS = shipDefs();
/** a slow individual drift (world px), so no two ships ever move in unison */
const drift = (sd: ShipDef, f: number): [number, number] => [
  0.45 * Math.sin(f * (0.031 + 0.02 * hash(sd.seed, 31)) + 6.283 * hash(sd.seed, 32)),
  0.35 * Math.sin(f * (0.027 + 0.02 * hash(sd.seed, 33)) + 6.283 * hash(sd.seed, 34)),
];
/** a ship's along-track u at frame f (before drift) */
export const shipU = (sd: ShipDef, f: number) =>
  (sd.fleet === "cream" ? creamLeadU(f) : orangeLeadU(f)) - sd.a + sd.da;
/** a ship's waterline anchor (world px) at frame f */
export const shipAt = (sd: ShipDef, f: number): P2 => {
  const [ea, en] = drift(sd, f);
  return lanePoint(shipU(sd, f) + ea, sd.o + sd.dn + en);
};
/** the labels ride their lead ship without its drift or bob */
export const leadAnchor = (fleet: "cream" | "orange", f: number): P2 => {
  const sd = SHIPS.find((s) => s.fleet === fleet && s.j === 0)!;
  return lanePoint(shipU(sd, f), sd.o + sd.dn);
};

// ---------------------------------------------------------------------------
// LABELS (MapLabel f0 = when the slide-up starts; full ~9 f later)
// ---------------------------------------------------------------------------
export const T = {
  narvaezLabel: 38, // PANFILO slides up beside the cream lead, full by f47 ("Narvaez" f50)
  narvaezLabel2: 41, // DE NARVAEZ, 3 f behind it
  cortesLabel: 89, // CORTES lands by the orange lead, full by f98 ("Cortes" f98)
};

// ---------------------------------------------------------------------------
// THE CAMERA. Keys put a world point at a screen point at a zoom; cx, cy and
// ln k run through pchip (C1); every channel is monotone (k only ever eases
// back, cx only west, cy only south), so the camera never stops or turns.
// Three long glides:
//   f0-f50   k 3.20 -> 3.15, drifting west with the pour (the cape at x 716 ->
//            757, the cream lanes on y ~760)
//   f50-f98  the pull-back to k 2.47 that fits the whole convoy, still west,
//            the band centre settling onto y 835
//   f98-f150 both convoys centred, the camera travelling west with them at
//            their sail, its pull-back decaying (k 2.47 -> 2.40)
// ---------------------------------------------------------------------------
const CREAM_MID_Y = Y_REF + (OFF.creamN + OFF.creamS) / 2;
/** world x of the middle of the whole cream convoy (lead .. tail) at frame f */
const creamMidX = (f: number) => CAPE[0] - (creamLeadU(f) - ROW_AT[N_ROWS - 1] / 2);
const camKeys = () => [
  { f: 0, k: 3.2, wx: CAPE[0], wy: CREAM_MID_Y, sx: 716, sy: 760 },
  { f: 50, k: 3.15, wx: CAPE[0], wy: CREAM_MID_Y, sx: 757, sy: 760 },
  { f: 98, k: 2.47, wx: creamMidX(98), wy: Y_REF, sx: SCREEN_CX, sy: CONTENT_Y },
  { f: LAST, k: 2.4, wx: creamMidX(LAST), wy: Y_REF, sx: SCREEN_CX, sy: CONTENT_Y },
];
export const CAM_KEYS = camKeys();
export const camAt: (f: number) => Cam = makeCamera(CAM_KEYS);
