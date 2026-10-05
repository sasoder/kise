// ---------------------------------------------------------------------------
// iraqEFG: cuts E, F, G of "Sheppard_Regime_change_in_Iraq_was_the_easy_part"
// (Dwarkesh with Si Sheppard; Dwarkesh map style) as ONE global-clock scene on
// THE IRAQ WORLD (iraqShared.tsx, builder W) + THE MOSAIC (iraqMosaicLayer.tsx,
// builder M). Builder N. Each cut is a window onto <EFGScene g />, joined 0 px:
//   E TwoThousandMilesOfBorder  IN g1956, 424 f (g1956..2379)
//   F WhoAreTheNeighbors        IN g2380, 261 f (g2380..2640)
//   G SacredShiaShrine          IN g2641, 448 f (g2641..3088)
// global g = the sequence frame (24 fps; cut_frames.md).
//
// THE LINES
// E "In the Kuwait war, Gulf One, you're only dealing with 158 miles of that border.
//    In the taking over the whole place, you're dealing with over 2,000 miles of that
//    border. That's a lot of border to try to wall off from interested parties."
// F "And oh, by the way, who are the neighbors? Three of them have real ambitions for
//    regional influence. Saudi Arabia, Iran, and Turkey. They're going to be involved,
//    whether you like it or not."
// G "And it often doesn't take that much involvement to really set things off, right?
//    Sometimes a car bomb will do it. This is a sacred Shia shrine. Car bomb or whatever,
//    blow it up. It set off a big sectarian war. It's very, very difficult to stabilize
//    these places."
//
// PALETTE: orange = only America's burden: here the border it must hold, then the wall.
// Everything else cream at the ladder 1.0 / 0.45 / 0.2.
//
// GESTURES (global frames; the word each serves). Nothing else moves but the camera.
// E1 g1956 Iraq wide (k 0.94), neighbours' borders fine dashed (0.2), Iraq's border
//    cream; the camera already creeping.
// E2 "Kuwait" g1976: KUWAIT slides up in Kuwait (from g1968); the camera glides to the
//    Kuwait-Iraq border (k 2.7, the border's chord centred at (540, 860)), g1966-2036.
// E3 "158 miles of that border" g2065-2101: the Kuwait-Iraq border draws as a heavy
//    solid orange line from its west end to the coast (g2063-2101) while the counter
//    (IM Fell 180 px, MILES beneath, a quiet dark halo, above the border) rolls 0 -> 158,
//    landing on "border" g2101.
// E4 "taking over the whole place" g2147-2183: the camera pulls back to the whole of
//    Iraq (k 0.95, g2138-2190); the counter glides to Iraq's middle with it.
// E5 "over 2,000 miles of that border" g2197-2259: from both ends of the Kuwait segment
//    two orange pens run round Iraq's whole border (each neighbour's share of the time
//    proportional to its Factbook length; the coast is run at its 58 km), meeting on the
//    Turkish border in the far north; the counter rolls 158 -> 2,367 = 158 + the Factbook
//    miles drawn (so it passes each tripoint at the right number), crossing 2,000 at
//    ~g2215 and decelerating onto 2,367 by g2259.
// E6 "wall off" g2273-2333: engraved crenellations grow on the border's outer side, from
//    the Kuwait segment round both ways, complete at "off" g2333. The counter recedes to
//    0.45 (g2273-2292) and fades out by g2340.
// E7 "interested parties" g2339-2366: eight cream darts press in from outside and stop
//    dead on the wall at real crossings (Al-Qaim, Trebil, Arar, Shalamcheh, Mehran,
//    Munthiriya, Haji Omaran, Habur), staggered; they fade as F begins (g2395-2420).
// (F and G: see the second half of the header, below the E code.)
//
// SOURCES. Border lengths: CIA World Factbook, Iraq, 2021 archive: land boundaries total
// 3,809 km (2,367 mi): Iran 1,599 km (994 mi), Jordan 179 km (111 mi), Kuwait 254 km
// (158 mi), Saudi Arabia 811 km (504 mi), Syria 599 km (372 mi), Turkey 367 km (228 mi);
// coastline 58 km. Crossings (scripts/build-iraq-efg.ts -> iraqEFGData.ts): Wikipedia
// coordinates of Trebil, the Arar border crossing, the Ibrahim Khalil (Habur) crossing,
// Haji Omeran, Shalamcheh; Al-Qaim/Husaybah, Mehran-Zurbatiyah, Munthiriya-Khosravi at
// their towns. Al-Askari Shrine, Samarra 34.1986 N 43.8742 E: golden dome on a drum
// flanked by two minarets; bombed 22 Feb 2006, the dome collapsed (the minarets stood
// until June 2007), which triggered the 2006-07 sectarian war (Wikipedia "Al-Askari
// Shrine", "2006 al-Askari mosque bombing").
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  ACCENT,
  COUNTRY_D,
  DARK,
  Hatch,
  INK,
  IraqBorder,
  IraqLand,
  IRAQ_BORDERS,
  IRAQ_CENTROID,
  IRAQ_ROUTE,
  IRAQ_SEG,
  KUWAIT_CENTROID,
  Label,
  MapStack,
  OrangeLine,
  PaperTop,
  RUNG,
  SEA,
  Rivers,
  W_OBJ,
  WorldSvg,
  hash,
  revealHalfPlane,
  viewRect,
  clamp01,
  easeInOutSine,
  fellSC,
  makeCamTrack,
  screenOf,
  smoothstep,
  swayCam,
  type BorderKey,
  type Cam,
  type P2,
} from "./iraqShared";
import { CROSSINGS, PAIR_D } from "./iraqEFGData";
import { Dart, Halo, Odometer, Shrine, TEETH, WallTeeth, dOfPts, digitsOf, makePoly, type Poly } from "./iraqEFGGlyphs";
import { MosaicLayer, MOSAIC_REGIONS, MOSAIC_SEAMS, SEAM_GROUPS } from "./iraqMosaicLayer";

// ---------------------------------------------------------------------------
// THE CLOCK
// ---------------------------------------------------------------------------
export const FPS = 24;
export const CUTS = {
  E: { name: "TwoThousandMilesOfBorder", g0: 1956, dur: 424 },
  F: { name: "WhoAreTheNeighbors", g0: 2380, dur: 261 },
  G: { name: "SacredShiaShrine", g0: 2641, dur: 448 },
} as const;
if (CUTS.E.g0 + CUTS.E.dur !== CUTS.F.g0 || CUTS.F.g0 + CUTS.F.dur !== CUTS.G.g0 || CUTS.G.g0 + CUTS.G.dur !== 3089) throw new Error("EFG clock");

export const T = {
  kuwaitLabel: 1968,
  traceK: [2063, 2101] as [number, number],
  counterIn: 2057,
  counterGlide: [2140, 2190] as [number, number],
  traceAll: [2195, 2259] as [number, number],
  cross: 2214, // the counter crosses 2,000 ("2" g2212, ",000" g2219)
  wall: [2273, 2333] as [number, number],
  counterRecede: [2273, 2292] as [number, number],
  counterOut: [2318, 2340] as [number, number],
  darts: 2339,
  dartsOut: [2395, 2420] as [number, number],
  kuwaitLabelOut: [2426, 2442] as [number, number],
};

// ---------------------------------------------------------------------------
// THE CAMERA: one keyed track for all three cuts (iraqShared makeCamTrack)
// ---------------------------------------------------------------------------
const KW_A = IRAQ_ROUTE.pointAt(IRAQ_SEG.kuwait.s0);
const KW_B = IRAQ_ROUTE.pointAt(IRAQ_SEG.kuwait.s1);
export const KUWAIT_CHORD_MID: P2 = [(KW_A[0] + KW_B[0]) / 2, (KW_A[1] + KW_B[1]) / 2];
const SAMARRA_P: P2 = [548.85, 709.281];
export const FRAMINGS = [
  { p: IRAQ_CENTROID, k: 0.92, sy: 765 }, // 0 E1 Iraq wide
  { p: [560, 860] as P2, k: 0.96, sy: 765 }, // 1 the creep (toward Kuwait)
  { p: KUWAIT_CHORD_MID, k: 2.7, sy: 860 }, // 2 E2 the Kuwait border
  { p: KUWAIT_CHORD_MID, k: 2.85, sy: 856 }, // 3 its creep
  { p: IRAQ_CENTROID, k: 0.92, sy: 765 }, // 4 E4 the whole of Iraq
  { p: IRAQ_CENTROID, k: 0.95, sy: 768 }, // 5 its creep
  { p: IRAQ_CENTROID, k: 0.5, sy: 800 }, // 6 F2 the three neighbours frame Iraq
  { p: IRAQ_CENTROID, k: 0.53, sy: 805 }, // 7 its creep
  { p: SAMARRA_P, k: 4.3, sy: 965 }, // 8 G1 the push to Samarra (the shrine's middle near y835)
  { p: SAMARRA_P, k: 4.45, sy: 962 }, // 9 its creep
  { p: IRAQ_CENTROID, k: 0.92, sy: 765 }, // 10 G5/G6 the whole of Iraq again
  { p: IRAQ_CENTROID, k: 0.87, sy: 765 }, // 11 the slow pull-back
];
export const MOVES = [
  { from: 1930, to: 1990 },
  { from: 1966, to: 2036 },
  { from: 2030, to: 2160 },
  { from: 2128, to: 2192 },
  { from: 2186, to: 2420 },
  { from: 2398, to: 2442 },
  { from: 2436, to: 2690 },
  { from: 2648, to: 2826 },
  { from: 2815, to: 2965 },
  { from: 2948, to: 3014 },
  { from: 2998, to: 3150 },
];
export const camAt = makeCamTrack(FRAMINGS, MOVES);
export const camShown = (g: number): Cam => swayCam(camAt(g), g);

// ---------------------------------------------------------------------------
// THE TRACE. E3: the Kuwait segment, west end -> coast. E5: two pens from its ends:
// pen A runs the ring forward (coast -> Iran -> into Turkey), pen B backward (Saudi ->
// Jordan -> Syria -> into Turkey); both run at one Factbook-mile rate and meet on the
// Turkish border. The coast takes its 58 km of time but adds no land miles.
// ---------------------------------------------------------------------------
export const MI = { kuwait: 158, coast: 36, iran: 994, turkey: 228, syria: 372, jordan: 111, saudi: 504, total: 2367 };
const A_PRE = MI.coast + MI.iran; // 1030
const B_PRE = MI.saudi + MI.jordan + MI.syria; // 987
const PEN_M = (A_PRE + B_PRE + MI.turkey) / 2; // 1122.5: each pen's run in time-miles
const TURKEY_A = PEN_M - A_PRE; // 92.5 of Turkey's 228 run by pen A (from the Iran tripoint)
type Leg = { key: BorderKey; miles: number; count: boolean; sFrom: number; sTo: number };
const turkeyMeetS = IRAQ_SEG.turkey.s0 + (TURKEY_A / MI.turkey) * (IRAQ_SEG.turkey.s1 - IRAQ_SEG.turkey.s0);
const LEGS_A: Leg[] = [
  { key: "coast", miles: MI.coast, count: false, sFrom: IRAQ_SEG.coast.s0, sTo: IRAQ_SEG.coast.s1 },
  { key: "iran", miles: MI.iran, count: true, sFrom: IRAQ_SEG.iran.s0, sTo: IRAQ_SEG.iran.s1 },
  { key: "turkey", miles: TURKEY_A, count: true, sFrom: IRAQ_SEG.turkey.s0, sTo: turkeyMeetS },
];
const LEGS_B: Leg[] = [
  { key: "saudi", miles: MI.saudi, count: true, sFrom: IRAQ_SEG.saudi.s1, sTo: IRAQ_SEG.saudi.s0 },
  { key: "jordan", miles: MI.jordan, count: true, sFrom: IRAQ_SEG.jordan.s1, sTo: IRAQ_SEG.jordan.s0 },
  { key: "syria", miles: MI.syria, count: true, sFrom: IRAQ_SEG.syria.s1, sTo: IRAQ_SEG.syria.s0 },
  { key: "turkey", miles: MI.turkey - TURKEY_A, count: true, sFrom: IRAQ_SEG.turkey.s1, sTo: turkeyMeetS },
];
export const MEET_S = turkeyMeetS;
/** a pen at time-miles m: its ring arclength and the land miles it has counted */
const penAt = (legs: Leg[], m: number) => {
  let left = Math.max(0, m);
  let counted = 0;
  for (const L of legs) {
    if (left <= L.miles) {
      const u = left / L.miles;
      return { s: L.sFrom + (L.sTo - L.sFrom) * u, counted: counted + (L.count ? left : 0) };
    }
    left -= L.miles;
    if (L.count) counted += L.miles;
  }
  const last = legs[legs.length - 1];
  return { s: last.sTo, counted };
};
/** E3: the Kuwait trace's progress 0..1 */
export const kuwaitTraceAt = (g: number) => easeInOutSine((g - T.traceK[0]) / (T.traceK[1] - T.traceK[0]));
/** E5: the pens' progress 0..1 in two phases joined C1. Phase 1 (g2195 -> T.cross): from
 *  rest up to speed and on to the progress at which the counter reads 2,000 (a Hermite
 *  ease landing with the phase-2 speed). Phase 2 (T.cross -> g2259): the long
 *  deceleration onto 2,367, u = u1 + (1 - u1)(1 - (1 - t)^P) (zero speed at the end). */
const PEN_P = 2.5;
const U_2000 = (2000 - MI.kuwait + MI.coast) / 2 / PEN_M; // counter = 158 + 2m - 36 once m > 36
export const pensAt = (g: number) => {
  const [a, b] = T.traceAll;
  const c = T.cross;
  if (g <= a) return 0;
  if (g >= b) return 1;
  const v1 = ((1 - U_2000) * PEN_P) / (b - c); // per frame, at T.cross
  if (g <= c) {
    const t = (g - a) / (c - a);
    const m1 = (v1 * (c - a)) / U_2000; // h'(1)
    return U_2000 * (-2 * t * t * t + 3 * t * t + m1 * (t * t * t - t * t));
  }
  const t = (g - c) / (b - c);
  return U_2000 + (1 - U_2000) * (1 - Math.pow(1 - t, PEN_P));
};
/** the counter's value at g */
export const counterAt = (g: number) => {
  if (g < T.traceAll[0]) return MI.kuwait * kuwaitTraceAt(g);
  const m = pensAt(g) * PEN_M;
  return MI.kuwait + penAt(LEGS_A, m).counted + penAt(LEGS_B, m).counted;
};
{
  const end = counterAt(T.traceAll[1]);
  if (Math.abs(end - MI.total) > 1e-6) throw new Error(`counter ends on ${end}, not 2367`);
}

// ---------------------------------------------------------------------------
// THE WALL: crenellations on the outer side of every land section of the ring
// (not the coast). rank(s) = when the growth front reaches ring arclength s: the
// Kuwait segment from its middle out (0 .. 0.1), then on round both ways like the pens.
// ---------------------------------------------------------------------------
const WALL_KEYS: BorderKey[] = ["kuwait", "iran", "turkey", "syria", "jordan", "saudi"];
const WALL_POLYS: Record<string, Poly> = Object.fromEntries(WALL_KEYS.map((k) => [k, makePoly(IRAQ_BORDERS[k] as P2[])]));
const KW_MID_S = (IRAQ_SEG.kuwait.s0 + IRAQ_SEG.kuwait.s1) / 2;
const milesFromRing = (legs: Leg[], s: number) => {
  let acc = 0;
  for (const L of legs) {
    const lo = Math.min(L.sFrom, L.sTo);
    const hi = Math.max(L.sFrom, L.sTo);
    if (s >= lo - 1e-6 && s <= hi + 1e-6) return acc + (L.miles * Math.abs(s - L.sFrom)) / Math.max(1e-6, hi - lo);
    acc += L.miles;
  }
  return -1;
};
export const wallRank = (s: number) => {
  if (s <= IRAQ_SEG.kuwait.s1) return (0.1 * Math.abs(s - KW_MID_S)) / (KW_MID_S - IRAQ_SEG.kuwait.s0);
  const onA = s <= turkeyMeetS;
  const m = milesFromRing(onA ? LEGS_A : LEGS_B, s);
  return 0.1 + (0.9 * Math.max(0, m)) / PEN_M;
};
export const wallFrontAt = (g: number) => 1.08 * easeInOutSine((g - T.wall[0]) / (T.wall[1] - T.wall[0]));
const WALL_SOFT = 0.06;

// ---------------------------------------------------------------------------
// THE DARTS (E7): staggered, each pressing in along the inward normal and stopping
// dead on the wall's outer edge
// ---------------------------------------------------------------------------
const DART_ORDER = ["arar", "mehran", "alQaim", "habur", "shalamcheh", "trebil", "hajiOmaran", "munthiriya"];
const DART_START = [0, 3, 5, 8, 11, 13, 16, 18];
const DART_TRAVEL = 10;
const DART_RUN = 96; // screen px of approach
export const DARTS = DART_ORDER.map((name, i) => {
  const c = CROSSINGS.find((q) => q.name === name)!;
  const p = IRAQ_ROUTE.pointAt(c.s);
  const t = IRAQ_ROUTE.tangentAt(c.s);
  // the ring is counter-clockwise on screen: outward = (-ty, tx)
  const out: P2 = [-t[1], t[0]];
  return { name, p, out, g0: T.darts + DART_START[i] };
});

// ---------------------------------------------------------------------------
// NEIGHBOURS' BORDERS: each pair line at the higher rung of its two countries
// ---------------------------------------------------------------------------
type NKey = "kuwait" | "saudi" | "jordan" | "syria" | "turkey" | "iran";
export const neighbourRung = (g: number): Record<NKey | "x", number> => {
  const lift = smoothstep((g - 2400) / 26); // F1 "who are the neighbors?"
  const split = smoothstep((g - 2431) / 11); // F2 "Three of them"
  const six = RUNG.low + (RUNG.mid - RUNG.low) * lift;
  const big = six + (RUNG.full - six) * split;
  const small = six + (RUNG.low - six) * split;
  return { kuwait: small, jordan: small, syria: small, saudi: big, iran: big, turkey: big, x: RUNG.low };
};
const DashedPair: React.FC<{ d: string; cam: Cam; opacity: number }> = ({ d, cam, opacity }) => {
  if (opacity <= 0.002 || !d) return null;
  // the house fine dashes (iraqShared DashedBorder), drawn here with the rung as given
  const L2 = Math.log2(cam.k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = 11 / Math.pow(2, o);
  const sets = [
    { p: a, op: 1 - t },
    { p: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {sets.map((q) => (
        <path key={`dp-${q.p}`} d={d} stroke={INK} strokeOpacity={opacity * q.op} strokeWidth={1.4 / cam.k} strokeDasharray={`${(q.p * 0.58).toFixed(5)} ${(q.p * 0.42).toFixed(5)}`} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// F AND G (header, continued)
// F1 "who are the neighbors?" g2400-2426: the six neighbours' borders lift to cream 0.45
//    and their land gets a faint cream rim; the camera begins pulling out (g2398).
// F2 "Three of them" g2431-2442: Saudi Arabia, Iran, Turkey rise to the 1.0 rung,
//    Kuwait, Jordan, Syria drop to 0.2 (KUWAIT fades); the pull-back lands (k 0.5, Iraq's
//    centroid at (540, 800)) so the three big neighbours' near halves frame Iraq.
// F3 "real ambitions for regional influence" g2454-2513: each of the three fills with a
//    fine engraved cream hatch (0.45) whose front travels from its far side toward Iraq.
// F4 SAUDI ARABIA g2513, IRAN g2529, TURKEY g2541: IM Fell SC spaced caps inside each
//    country near Iraq (slide up from 8 f before the word).
// F5 "They're going to be involved ... or not" g2555-2614: six flowing dashed cream lines
//    (Iran -> the Shia Arab south and Baghdad; Saudi Arabia -> the Sunni Arab west and the
//    Sunni heart; Turkey -> the Kurdish north and Sinjar) run from each country across
//    the wall into Iraq, landing by "not" g2614; the mosaic inks in at the 0.2 rung
//    (g2566-2612) so they land on something. The wall does not stop them.
// G1 "doesn't take that much involvement" g2641-2725: the lines thin to fine threads
//    (0.45) and the neighbours' hatch leaves; the camera's long push to Samarra (k 4.3
//    by g2826 on the closeS level, Samarra at (540, 965) so the shrine's middle sits
//    near y835).
// G2 "to really set things off, right?" g2731-2777: as the camera arrives the mosaic
//    lifts 0.2 -> 0.45 so the patches read (Sunni horizontal vs the mix's crossed
//    hatch) and the seams lift to 0.45; the rivers fade to 0.08 (back to 0.2 in G6).
// G3 "This is a sacred Shia shrine" g2836-2878: the Al-Askari shrine (golden dome on its
//    drum, two minarets; cream engraved line, ~260 px) draws itself on at Samarra,
//    bottom-up, complete at "shrine" g2878. No label.
// G4 "blow it up" g2934: the dome splits at the crown and falls into the drum, a few
//    shards scatter and settle (g2934-2960); the minarets stand. No flash, no glow.
// G5 "It set off a big sectarian war" g2952-2993: cracks race out from the broken
//    shrine's foot along the mosaic's seams (Sunni/Shia first: the Baghdad belt, Diyala;
//    then Arab/Kurd toward Kirkuk; then the rest): angular zigzags (~5 px cream on a
//    ~9 px dark casing in the close-up), a brighter travelling head, small forks, the
//    hatch patches either side lifting to 1.0 as a head passes; the camera pulls back
//    with them (g2948-3014).
// G6 "very, very difficult to stabilize" g3009-3088: the whole of Iraq, the orange wall
//    holding round an interior whose seams keep flickering softly (hashed, staggered
//    slow sines between ~0.3 and ~0.85); a slow pull-back to the end.
// ---------------------------------------------------------------------------
export const TF = {
  hatch: [2454, 2513] as [number, number],
  labels: { saudi: 2505, iran: 2521, turkey: 2534 },
  labelsOut: [2655, 2690] as [number, number],
  lines: [2555, 2614] as [number, number],
  mosaicIn: [2566, 2612] as [number, number],
  thin: [2645, 2700] as [number, number],
  seamsLift: [2731, 2777] as [number, number],
  shrine: [2836, 2878] as [number, number],
  blow: 2934,
  blowLen: 26,
  cracks: [2952, 2993] as [number, number],
};
type Big = "saudi" | "iran" | "turkey";
const BIG: Big[] = ["saudi", "iran", "turkey"];
// the hatch fronts: a straight front travelling along n (toward Iraq), from the far side of
// the country's visible part to its Iraq side (projections measured from Iraq's centroid
// over the country's points inside the F hold's frame)
const HATCH_N: Record<Big, P2> = (() => {
  const nz = (x: number, y: number): P2 => [x / Math.hypot(x, y), y / Math.hypot(x, y)];
  return { saudi: nz(-0.3, -0.95), iran: nz(-0.92, 0.18), turkey: nz(0.25, 1) };
})();
const parseD = (d: string): P2[] =>
  d
    .split(/[MLZ]/)
    .filter(Boolean)
    .map((q) => q.split(",").map(Number) as P2);
const HATCH_RANGE: Record<Big, [number, number]> = (() => {
  const v = viewRect(camAt(2480), 80);
  const out = {} as Record<Big, [number, number]>;
  for (const b of BIG) {
    const n = HATCH_N[b];
    let lo = Infinity;
    let hi = -Infinity;
    for (const [x, y] of parseD(COUNTRY_D[b])) {
      if (x < v.x0 || x > v.x1 || y < v.y0 || y > v.y1) continue;
      const q = (x - IRAQ_CENTROID[0]) * n[0] + (y - IRAQ_CENTROID[1]) * n[1];
      lo = Math.min(lo, q);
      hi = Math.max(hi, q);
    }
    out[b] = [lo - 10, hi + 4];
  }
  return out;
})();
const HATCH_STAGGER: Record<Big, number> = { saudi: 0, iran: 4, turkey: 8 };
export const LABEL_AT: Record<Big, { text: string; p: P2 }> = {
  saudi: { text: "SAUDI ARABIA", p: [480, 1446] },
  iran: { text: "IRAN", p: [1062, 832] },
  turkey: { text: "TURKEY", p: [468, 150] },
};
// the influence lines: origin inside the neighbour -> a point in the matching mosaic region
const regionAnchor = (id: number) => MOSAIC_REGIONS[id].anchor as P2;
export const LINES: { from: Big; o: P2; t: P2; g0: number; bend: number }[] = [
  { from: "iran", o: [1172, 1068], t: regionAnchor(1), g0: 2555, bend: 0.1 },
  { from: "saudi", o: [380, 1290], t: regionAnchor(13), g0: 2560, bend: -0.1 },
  { from: "turkey", o: [582, 238], t: regionAnchor(2), g0: 2565, bend: 0.1 },
  { from: "iran", o: [1160, 604], t: [592.2, 802.7], g0: 2570, bend: -0.08 },
  { from: "saudi", o: [630, 1296], t: regionAnchor(3), g0: 2575, bend: 0.08 },
  { from: "turkey", o: [350, 250], t: regionAnchor(10), g0: 2580, bend: -0.12 },
];
const LINE_TRAVEL = 34;
const LINE_POLYS = LINES.map((L) => {
  const [ox, oy] = L.o;
  const [tx, ty] = L.t;
  const len = Math.hypot(tx - ox, ty - oy);
  const cx = (ox + tx) / 2 - ((ty - oy) / len) * len * L.bend;
  const cy = (oy + ty) / 2 + ((tx - ox) / len) * len * L.bend;
  const pts: P2[] = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    pts.push([(1 - u) * (1 - u) * ox + 2 * (1 - u) * u * cx + u * u * tx, (1 - u) * (1 - u) * oy + 2 * (1 - u) * u * cy + u * u * ty]);
  }
  return makePoly(pts);
});
{
  const last = Math.max(...LINES.map((L) => L.g0)) + LINE_TRAVEL;
  if (last > TF.lines[1]) throw new Error(`the influence lines land at g${last}, after "not" g2614`);
}
// the shrine at Samarra: ~260 px at the k 4.3 close-up, shrinking with the pull-back
// (~70 px in the k 0.9 wide)
const shrineSize = (k: number) => 260 * Math.pow(k / 4.3, 0.85);
export const shrineAt = (g: number) => {
  const t = clamp01((g - TF.shrine[0]) / (TF.shrine[1] - TF.shrine[0]));
  return t; // a steady hand: linear pen through the slices (each stroke eases itself)
};
export const collapseAt = (g: number) => clamp01((g - TF.blow) / TF.blowLen);

// THE CRACKS (G5). Each identity seam becomes a crack path: an angular zigzag of short
// straight segments (~2.6 world px, kinks hashed and world-fixed, so it never swims)
// following the seam; small forks branch off it every so often. A crack starts at the
// seam's point nearest the shrine's foot when the front from Samarra reaches it, runs
// both ways with a bright head, and lifts the hatch patches either side as it passes.
const ZIG_STEP = 2.6;
const ZIG_AMP = 1.15;
const zigzag = (pts: P2[], seed: number): P2[] => {
  const src = makePoly(pts);
  const n = Math.max(2, Math.round(src.len / ZIG_STEP));
  const out: P2[] = [];
  let sign = hash(seed, 3) > 0.5 ? 1 : -1;
  for (let i = 0; i <= n; i++) {
    const s = (src.len * i) / n;
    const p = src.pointAt(s);
    const t = src.tangentAt(s);
    if (hash(seed * 31 + i, 5) > 0.22) sign = -sign; // mostly alternating, sometimes a long leg
    const a = i === 0 || i === n ? 0 : sign * ZIG_AMP * (0.35 + 0.65 * hash(seed * 31 + i, 7));
    out.push([p[0] - t[1] * a, p[1] + t[0] * a]);
  }
  return out;
};
type Fork = { s: number; pts: P2[] };
const forksOf = (poly: Poly, seed: number): Fork[] => {
  const out: Fork[] = [];
  let s = 8 + 10 * hash(seed, 21);
  let i = 0;
  while (s < poly.len - 6) {
    const p = poly.pointAt(s);
    const t = poly.tangentAt(s);
    const side = hash(seed * 17 + i, 22) > 0.5 ? 1 : -1;
    const ang = ((35 + 25 * hash(seed * 17 + i, 23)) * Math.PI) / 180;
    // forward-leaning branch: the tangent rotated by +-ang
    const dx = t[0] * Math.cos(ang) - side * t[1] * Math.sin(ang);
    const dy = t[1] * Math.cos(ang) + side * t[0] * Math.sin(ang);
    const L = 4.5 + 5 * hash(seed * 17 + i, 24);
    const kink = (hash(seed * 17 + i, 25) - 0.5) * 0.9;
    const m: P2 = [p[0] + dx * L * 0.55, p[1] + dy * L * 0.55];
    const e: P2 = [m[0] + (dx * Math.cos(kink) - dy * Math.sin(kink)) * L * 0.45, m[1] + (dy * Math.cos(kink) + dx * Math.sin(kink)) * L * 0.45];
    out.push({ s, pts: [p, m, e] });
    s += 16 + 16 * hash(seed * 17 + i, 26);
    i++;
  }
  return out;
};
const SEAM_POLYS = MOSAIC_SEAMS.filter((q) => q.kind === "identity").map((q) => {
  const poly = makePoly(zigzag(q.pts as P2[], q.id));
  let best = { d: Infinity, s: 0 };
  for (let i = 0; i < poly.pts.length; i++) {
    const d = Math.hypot(poly.pts[i][0] - SAMARRA_P[0], poly.pts[i][1] - SAMARRA_P[1]);
    if (d < best.d) best = { d, s: poly.cum[i] };
  }
  const grp = SEAM_GROUPS.sunniShia.includes(q.id) ? 0 : SEAM_GROUPS.arabKurd.includes(q.id) ? 1 : 2;
  return { id: q.id, poly, forks: forksOf(poly, q.id), smooth: dOfPts(q.pts as P2[]), d0: best.d, s0: best.s, grp };
});
const CRACK_REACH = 470; // world px the crack front travels from Samarra
const CRACK_DELAY = [0, 9, 15]; // frames: Sunni/Shia, Arab/Kurd, the rest
const crackFrontAt = (g: number) => {
  const t = clamp01((g - TF.cracks[0]) / (TF.cracks[1] - TF.cracks[0]));
  return CRACK_REACH * (1 - Math.pow(1 - t, 2));
};
/** the crack's stroke (screen px): ~5 px in the close-up, ~2.6 px in the wide */
const crackW = (k: number) => 2.6 + 2.4 * smoothstep((k - 1) / 3);
const CRACK_HEAD = "#FFF7E2";
const flicker = (g: number, id: number) => {
  const P1 = 38 + 26 * hash(id, 11);
  const P2 = 61 + 30 * hash(id, 12);
  const v = 0.58 + 0.17 * Math.sin((2 * Math.PI * g) / P1 + 6.283 * hash(id, 13)) + 0.1 * Math.sin((2 * Math.PI * g) / P2 + 6.283 * hash(id, 14));
  return Math.max(0.3, Math.min(0.85, v));
};

// ---------------------------------------------------------------------------
// small pieces
// ---------------------------------------------------------------------------
const Nib: React.FC<{ p: P2; cam: Cam; opacity?: number }> = ({ p, cam, opacity = 1 }) =>
  opacity > 0.002 ? (
    <g opacity={opacity}>
      <circle cx={p[0]} cy={p[1]} r={5.6 / cam.k} fill={DARK} fillOpacity={0.6} />
      <circle cx={p[0]} cy={p[1]} r={4.0 / cam.k} fill={ACCENT} />
    </g>
  ) : null;
const W_TRACE = W_OBJ; // the heavy orange border (4.2 px, the clip's objective stroke)
const SeamLine: React.FC<{ d: string; cam: Cam; opacity: number; width?: number }> = ({ d, cam, opacity, width = 2.2 }) =>
  opacity <= 0.002 || !d ? null : (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeOpacity={0.5 * Math.min(1, opacity * 1.6)} strokeWidth={(width + 2.4) / cam.k} />
      <path d={d} stroke={INK} strokeOpacity={opacity} strokeWidth={width / cam.k} />
    </g>
  );
const CountryRim: React.FC<{ id: string; d: string; cam: Cam; opacity: number }> = ({ id, d, cam, opacity }) =>
  opacity <= 0.002 ? null : (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={d} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`} fill="none" strokeLinejoin="round">
        <path d={d} stroke={INK} strokeOpacity={0.5 * opacity} strokeWidth={22 / cam.k} />
        <path d={d} stroke={INK} strokeOpacity={0.6 * opacity} strokeWidth={7 / cam.k} />
      </g>
    </g>
  );

// the counter's screen placement: above the Kuwait border (E3), then Iraq's middle (E5)
const COUNTER_SIZE = 180;
const COUNTER_K: P2 = [540, 640];
const COUNTER_W: P2 = [540, 815];
const layoutDigitsAt = (g: number) => {
  let s = 0;
  let w = 0;
  for (let j = -8; j <= 8; j++) {
    const q = 1 - Math.abs(j) / 9;
    s += q * digitsOf(counterAt(g + j));
    w += q;
  }
  return s / w;
};

// ---------------------------------------------------------------------------
// THE SCENE at global frame g
// ---------------------------------------------------------------------------
export const EFGScene: React.FC<{ g: number; vignette?: number }> = ({ g, vignette = 0.55 }) => {
  const cam = camShown(g);
  const rung = neighbourRung(g);

  // E3/E5 trace state
  const kq = kuwaitTraceAt(g);
  const kS = IRAQ_SEG.kuwait.s0 + (IRAQ_SEG.kuwait.s1 - IRAQ_SEG.kuwait.s0) * kq;
  const pm = pensAt(g) * PEN_M;
  const pa = penAt(LEGS_A, pm).s;
  const pb = penAt(LEGS_B, pm).s;
  const penOn = g >= T.traceAll[0];
  const done = g >= T.traceAll[1];

  // wall
  const front = wallFrontAt(g);
  const grow = (key: BorderKey) => (sLocal: number) => smoothstep((front - wallRank(IRAQ_SEG[key].s0 + sLocal)) / WALL_SOFT);

  // counter
  const cIn = smoothstep((g - T.counterIn) / 9);
  const cSlide = 24 * (1 - easeInOutSine((g - T.counterIn) / 14));
  const cRecede = 1 - (1 - RUNG.mid) * smoothstep((g - T.counterRecede[0]) / (T.counterRecede[1] - T.counterRecede[0]));
  const cOut = 1 - smoothstep((g - T.counterOut[0]) / (T.counterOut[1] - T.counterOut[0]));
  const cOp = cIn * cRecede * cOut;
  const glide = easeInOutSine((g - T.counterGlide[0]) / (T.counterGlide[1] - T.counterGlide[0]));
  const ccx = COUNTER_K[0] + (COUNTER_W[0] - COUNTER_K[0]) * glide;
  const cBase = COUNTER_K[1] + (COUNTER_W[1] - COUNTER_K[1]) * glide + cSlide;
  const lay = layoutDigitsAt(g);
  const haloW = (lay * 0.5 + 0.4) * COUNTER_SIZE;

  // darts: they stop on the teeth's outer edge (the teeth's screen height at this zoom)
  const dartsOut = 1 - smoothstep((g - T.dartsOut[0]) / (T.dartsOut[1] - T.dartsOut[0]));
  const L2 = Math.log2(cam.k);
  const tOct = smoothstep((L2 - Math.floor(L2) - 0.25) / 0.5);
  const wallH = ((TEETH.H * cam.k) / Math.pow(2, Math.floor(L2))) * (1 - 0.5 * tOct); // screen px

  // F: neighbours' rim, hatch, labels, lines; the mosaic
  const rimOp = (b: NKey) => 0.18 * (rung[b] / RUNG.full) * smoothstep((g - 2400) / 26);
  const hatchRecede = 1 - smoothstep((g - TF.thin[0]) / 115); // the neighbours' hatch leaves with the push
  const thin = smoothstep((g - TF.thin[0]) / (TF.thin[1] - TF.thin[0]));
  const labelsOut = 1 - smoothstep((g - TF.labelsOut[0]) / (TF.labelsOut[1] - TF.labelsOut[0]));
  const mosaicIn = (id: number) => {
    // the regions ink in from the middle of Iraq outward, staggered across TF.mosaicIn
    const r = MOSAIC_REGIONS[id];
    const d = Math.hypot(r.anchor[0] - IRAQ_CENTROID[0], r.anchor[1] - IRAQ_CENTROID[1]);
    const st = TF.mosaicIn[0] + Math.min(1, d / 520) * 22;
    return clamp01((g - st) / (TF.mosaicIn[1] - TF.mosaicIn[0] - 22));
  };
  const showMosaic = g >= TF.mosaicIn[0];
  const reveal: Record<number, number> = {};
  if (showMosaic) MOSAIC_REGIONS.forEach((r) => (reveal[r.id] = mosaicIn(r.id)));

  // G: the seams (lifted to 0.45 in G2), then the cracks (G5)
  const seamLift = smoothstep((g - TF.seamsLift[0]) / (TF.seamsLift[1] - TF.seamsLift[0]));
  const seamEls: React.ReactNode[] = [];
  const pulseEls: React.ReactNode[] = [];
  if (g >= TF.seamsLift[0]) {
    const px = (v: number) => v / cam.k;
    const w = crackW(cam.k);
    for (const q of SEAM_POLYS) {
      const startG = TF.cracks[0] + CRACK_DELAY[q.grp];
      const r = crackFrontAt(g - CRACK_DELAY[q.grp]) - q.d0; // world px of crack along the seam, each way
      const base = RUNG.mid * seamLift;
      // after the crack: settle from the flare (1.0) into the soft flicker
      const settle = smoothstep((g - (startG + 26)) / 22);
      const crackOp = g < startG ? 0 : 1 + (flicker(g, q.id) - 1) * settle;
      if (base > 0.002) seamEls.push(<SeamLine key={`sb-${q.id}`} d={q.smooth} cam={cam} opacity={base * (r > 0 ? 0.5 : 1)} />);
      if (r <= 0 || crackOp <= 0.002) continue;
      const a0 = Math.max(0, q.s0 - r);
      const a1 = Math.min(q.poly.len, q.s0 + r);
      const body = dOfPts(q.poly.partial(a0, a1));
      // forks the crack has reached
      let forkD = "";
      for (const f of q.forks) {
        const u = clamp01((r - Math.abs(f.s - q.s0)) / 7);
        if (u <= 0) continue;
        const fp = makePoly(f.pts);
        forkD += dOfPts(fp.partial(0, fp.len * u));
      }
      seamEls.push(
        <g key={`sc-${q.id}`} fill="none" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit={3}>
          <path d={body + forkD} stroke={DARK} strokeOpacity={0.62 * Math.min(1, crackOp * 1.4)} strokeWidth={px(w + 4)} />
          <path d={forkD} stroke={INK} strokeOpacity={crackOp} strokeWidth={px(w * 0.55)} />
          <path d={body} stroke={INK} strokeOpacity={crackOp} strokeWidth={px(w)} />
        </g>,
      );
      // the travelling heads (while the crack is still running) and the pulse behind them
      const HL = px(26);
      const PL = px(130);
      for (const [head, dir] of [
        [a1, -1],
        [a0, 1],
      ] as [number, number][]) {
        const running = dir < 0 ? q.s0 + r < q.poly.len : q.s0 - r > 0;
        if (!running) continue;
        seamEls.push(
          <path
            key={`sh-${q.id}-${dir}`}
            d={dOfPts(q.poly.partial(head, head + dir * HL))}
            fill="none"
            stroke={CRACK_HEAD}
            strokeWidth={px(w + 1.8)}
            strokeLinecap="round"
            strokeLinejoin="miter"
          />,
        );
        [1, 0.7, 0.4, 0.15].forEach((o, j) =>
          pulseEls.push(
            <path
              key={`pl-${q.id}-${dir}-${j}`}
              d={dOfPts(q.poly.partial(head + (dir * PL * j) / 4, head + (dir * PL * (j + 1)) / 4))}
              fill="none"
              stroke="#fff"
              strokeOpacity={o}
              strokeWidth={px(80)}
              strokeLinecap="round"
            />,
          ),
        );
      }
    }
  }
  // the mosaic's rung: 0.2 in F; 0.45 for the close-up (G2) so the patches read; 0.3 in G6
  const mzRung = RUNG.low + (RUNG.mid - RUNG.low) * seamLift - 0.15 * smoothstep((g - 3010) / 40);
  const mzOp = { kurd: mzRung, sunni: mzRung, sunniKurd: mzRung, shia: mzRung, shiaSunni: mzRung, turkoman: mzRung, sparse: 0.15 };
  const MZ_FULL = { kurd: 1, sunni: 1, sunniKurd: 1, shia: 1, shiaSunni: 1, turkoman: 1, sparse: 0.4 };
  const pv = viewRect(cam, 40);
  // rivers: 0.45, down to ~0.08 by G2 and through G5, back to 0.2 in G6
  const riverOp =
    RUNG.mid - (RUNG.mid - 0.08) * smoothstep((g - 2700) / (TF.seamsLift[1] - 2700)) + (RUNG.low - 0.08) * smoothstep((g - 3005) / 30);

  // the shrine
  const shP = shrineAt(g);
  const shC = collapseAt(g);

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        <IraqLand cam={cam} />
        <Rivers cam={cam} opacity={riverOp} />
        {/* F: the neighbours' rims and their influence hatch */}
        {g >= 2400
          ? (["kuwait", "saudi", "jordan", "syria", "turkey", "iran"] as NKey[]).map((b) => (
              <CountryRim key={`rim-${b}`} id={`efgRim-${b}`} d={COUNTRY_D[b]} cam={cam} opacity={rimOp(b)} />
            ))
          : null}
        {g >= TF.hatch[0]
          ? BIG.map((b) => {
              const [lo, hi] = HATCH_RANGE[b];
              const t = easeInOutSine((g - TF.hatch[0] - HATCH_STAGGER[b]) / (TF.hatch[1] - TF.hatch[0] - 8));
              if (t <= 0) return null;
              return (
                <Hatch
                  key={`nh-${b}`}
                  id={`efgNh-${b}`}
                  d={COUNTRY_D[b]}
                  cam={cam}
                  color={INK}
                  fill={0}
                  opacity={RUNG.mid * hatchRecede}
                  reveal={revealHalfPlane(IRAQ_CENTROID, HATCH_N[b], lo + (hi - lo) * t)}
                  feather={10}
                />
              );
            })
          : null}
        {/* the region's land borders, by pair */}
        {Object.entries(PAIR_D).map(([key, d]) => {
          const [a, b] = key.split("-");
          const ra = (rung as Record<string, number>)[a] ?? RUNG.low;
          const rb = (rung as Record<string, number>)[b] ?? RUNG.low;
          return <DashedPair key={key} d={d} cam={cam} opacity={Math.max(ra, rb)} />;
        })}
        {/* the mosaic (F5 on) at the receded rung */}
        {showMosaic ? (
          <MosaicLayer
            k={cam.k}
            idPrefix="efgMz"
            classOpacity={mzOp}
            reveal={reveal}
          />
        ) : null}
        {/* G5: the hatch patches either side of a running crack lift to 1.0 */}
        {pulseEls.length ? (
          <>
            <defs>
              <mask id="efgPulse" maskUnits="userSpaceOnUse" x={pv.x0} y={pv.y0} width={pv.x1 - pv.x0} height={pv.y1 - pv.y0}>
                {pulseEls}
              </mask>
            </defs>
            <g mask="url(#efgPulse)">
              <MosaicLayer k={cam.k} idPrefix="efgMzP" classOpacity={MZ_FULL} />
            </g>
          </>
        ) : null}
        {seamEls}
        {/* Iraq's border: cream (under the orange as it draws) */}
        <IraqBorder cam={cam} />
        {/* the orange border: Kuwait first, then the two pens */}
        {kq > 0.0005 ? <OrangeLine d={IRAQ_ROUTE.partialD(IRAQ_SEG.kuwait.s0, kS)} cam={cam} width={W_TRACE} /> : null}
        {penOn && pa > IRAQ_SEG.coast.s0 + 0.01 ? <OrangeLine d={IRAQ_ROUTE.partialD(IRAQ_SEG.coast.s0, pa)} cam={cam} width={W_TRACE} /> : null}
        {penOn && pb < IRAQ_SEG.saudi.s1 - 0.01 ? <OrangeLine d={IRAQ_ROUTE.partialD(pb, IRAQ_SEG.saudi.s1)} cam={cam} width={W_TRACE} /> : null}
        {/* the wall's teeth */}
        {front > 0 ? WALL_KEYS.map((k) => <WallTeeth key={`wt-${k}`} poly={WALL_POLYS[k]} side={1} cam={cam} grow={grow(k)} color={ACCENT} />) : null}
        {/* the darts */}
        {g >= T.darts - 1 && dartsOut > 0.002
          ? DARTS.map((d, i) => {
              const t = clamp01((g - d.g0) / DART_TRAVEL);
              if (t <= 0) return null;
              const q = Math.pow(t, 1.35); // accelerating in, a dead stop
              const stop = (wallH + 3) / cam.k;
              const dist = stop + ((1 - q) * DART_RUN) / cam.k;
              const x = d.p[0] + d.out[0] * dist;
              const y = d.p[1] + d.out[1] * dist;
              return <Dart key={`dart-${i}`} x={x} y={y} dir={[-d.out[0], -d.out[1]]} cam={cam} scale={2.4} opacity={smoothstep(t / 0.35) * dartsOut} />;
            })
          : null}
        {/* F5: the influence lines, flowing dashes, landing on the mosaic */}
        {g >= TF.lines[0]
          ? LINES.map((L, i) => {
              const t = easeInOutSine((g - L.g0) / LINE_TRAVEL);
              if (t <= 0) return null;
              const poly = LINE_POLYS[i];
              const d = dOfPts(poly.partial(0, poly.len * t));
              const op = 1 - (1 - RUNG.mid) * thin;
              const w = (3.9 - 2.3 * thin) / cam.k;
              const per = 24 / cam.k;
              const flow = -((g - L.g0) * 0.9) / cam.k;
              const end = poly.pointAt(poly.len * t);
              return (
                <g key={`il-${i}`} fill="none" strokeLinecap="butt">
                  <path d={d} stroke={DARK} strokeOpacity={0.45 * op} strokeWidth={w + 2.2 / cam.k} strokeDasharray={`${per * 0.6 + 2.2 / cam.k} ${per * 0.4 - 2.2 / cam.k}`} strokeDashoffset={flow + 1.1 / cam.k} />
                  <path d={d} stroke={INK} strokeOpacity={op} strokeWidth={w} strokeDasharray={`${per * 0.6} ${per * 0.4}`} strokeDashoffset={flow} />
                  <circle cx={end[0]} cy={end[1]} r={(4.6 - 1.8 * thin) / cam.k} fill={INK} fillOpacity={op * smoothstep((t - 0.9) / 0.1)} stroke={DARK} strokeOpacity={0.5 * op} strokeWidth={1.4 / cam.k} />
                </g>
              );
            })
          : null}
        {/* G3/G4: the shrine */}
        <Shrine x={SAMARRA_P[0]} y={SAMARRA_P[1]} cam={cam} size={shrineSize(cam.k)} progress={shP} collapse={shC} id="efgShrine" />
        {/* the pens' nibs */}
        <Nib p={IRAQ_ROUTE.pointAt(kS)} cam={cam} opacity={smoothstep((g - (T.traceK[0] - 4)) / 4) * (1 - smoothstep((g - T.traceK[1]) / 5))} />
        {penOn && !done ? <Nib p={IRAQ_ROUTE.pointAt(pa)} cam={cam} opacity={smoothstep((g - T.traceAll[0]) / 3) * (1 - smoothstep((g - (T.traceAll[1] - 6)) / 6))} /> : null}
        {penOn && !done ? <Nib p={IRAQ_ROUTE.pointAt(pb)} cam={cam} opacity={smoothstep((g - T.traceAll[0]) / 3) * (1 - smoothstep((g - (T.traceAll[1] - 6)) / 6))} /> : null}
      </WorldSvg>
      {/* KUWAIT, landing on its word */}
      <Label
        text="KUWAIT"
        x={KUWAIT_CENTROID[0] + 6}
        y={KUWAIT_CENTROID[1] - 14}
        cam={cam}
        frame={g}
        f0={T.kuwaitLabel}
        size={40}
        spacing={0.3}
        opacity={1 - smoothstep((g - T.kuwaitLabelOut[0]) / (T.kuwaitLabelOut[1] - T.kuwaitLabelOut[0]))}
      />
      {/* F4: the three names */}
      {g >= TF.labels.saudi - 1
        ? BIG.map((b) => (
            <Label key={`nl-${b}`} text={LABEL_AT[b].text} x={LABEL_AT[b].p[0]} y={LABEL_AT[b].p[1]} cam={cam} frame={g} f0={TF.labels[b]} size={44} spacing={0.3} opacity={labelsOut} />
          ))
        : null}
      {/* the counter */}
      {cOp > 0.002 ? (
        <>
          <Halo id="ctr" cx={ccx} cy={cBase - 0.12 * COUNTER_SIZE} rx={haloW * 0.75} ry={COUNTER_SIZE * 0.78} opacity={0.5 * cOp} />
          <Odometer id="odo" valueAt={counterAt} g={g} wheels={4} layoutDigits={lay} cx={ccx} base={cBase} size={COUNTER_SIZE} opacity={cOp} />
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
            <text
              x={ccx + 0.16 * 34}
              y={cBase + 62}
              textAnchor="middle"
              fill={INK}
              opacity={cOp}
              stroke={SEA}
              strokeOpacity={0.55}
              strokeWidth={34 * 0.11}
              paintOrder="stroke"
              style={{ fontFamily: fellSC, fontSize: 34, letterSpacing: 34 * 0.32 }}
            >
              MILES
            </text>
          </svg>
        </>
      ) : null}
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

/** for checks: the screen point of a world point at g */
export const screenAt = (p: P2, g: number) => screenOf(p, camShown(g));
