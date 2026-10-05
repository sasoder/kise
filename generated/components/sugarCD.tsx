// ---------------------------------------------------------------------------
// sugarCD: ACTS C + D of "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands"
// (Dwarkesh with Sarah Paine; Dwarkesh map style) on THE SUGAR WORLD (sugarShared).
// Owned by builder CD. Composed by sugarScene.tsx; rendered by cut C DownAPeg
// (g571..865 = story s297..591) and cut D GlobalWar (g920..1513 = s592..1185).
// Its elements persist on every later story frame (E sees them); the state at D's
// end is exported as CD_END (see notes/D_END.md).
//
// C "[because] a lot of people want to take Britain down a peg in this era. So the
//    French ally with the colonies in 1778, then the Spanish ally with the French in
//    1779, and the Britain attacks the Dutch in 1780. So"
// D "[what was a regional war] becomes a global war. The French attack Savannah. The
//    Spanish attack Louisiana. The French want to try to invade England from the Isle
//    of Wight. The British are trying to fight with the French at Ushant. And then the
//    French and the Spanish are attacking British possessions of Gibraltar, Menorca.
//    And the French, I guess, are attacking British possessions Cape Verde Islands off
//    Africa. The British attack French possessions at Mahe and Pondicherry in India."
//
// ORANGE = THE SIDE AT WAR WITH BRITAIN (the colonies, then France 1778, Spain 1779,
// the Dutch Republic 1780, then their possessions; their attacks). Britain, its
// possessions and its attacks are CREAM. Neutral land stays umber.
//
// GESTURES (story frames s; C: s = g - 274, D: s = g - 328), each with its word:
//  ONE MARK WEIGHT for the clip: arrows 4.5 px with a 24 px engraved head (the tie and the
//  siege line too); battle = StrikeGlyph, 64 px on the frame it lands; towns >= 36 px,
//  regions >= 40 px.
//  C0 "a lot of people want to take" g573-598: from B's last frame the camera crosses
//     the Atlantic on one zoom-out/zoom-in whip (s297-328, W's motion blur) and lands
//     ON "Britain" with France and the Low Countries below it.
//  C1 "Britain" g602: BRITAIN lands (slide from s320); Great Britain's cream wash +
//     hatch brighten and its coast lifts to full cream (s320-334). The camera creeps
//     (s330-380). "down a peg" g609-623: the outlines of France, Spain and the Dutch
//     Republic lift to the 0.45 rung (s334-352): the rivals ringing Britain.
//  C2 "the French" g659: the camera eases over to France + Biscay (s368-404); FRANCE
//     lands (s377). "ally with the colonies" g668-685: an orange tie draws from the
//     colonies (Philadelphia, off frame left) across the Atlantic to Paris (s381-414;
//     Paris' dot while the tie is anchored there). On arrival France fills orange from
//     Paris outward (crisp front, s414-428), settling into the hatch. "1778" g698 lands
//     in the open sea west of France (slide from s416).
//  C3 "the Spanish" g730: the camera eases south (s438-474); SPAIN lands (s448); "ally
//     with the French" g738-751: the orange front crosses the Pyrenees from Andorra and
//     fills Spain (s458-482). "1779" g762 lands west of Portugal (s480); 1778 recedes.
//  C4 "and the Britain attacks the Dutch" g780-821: from ~g780 the camera glides north
//     and in (s506-532) to Britain + the North Sea + the United Provinces (NL ~190 px
//     across); 1778/1779 leave with the turn; a CREAM arrow from London strikes the
//     United Provinces (s518-538); on impact they fill orange from The Hague (s538-
//     550). "Dutch" g821: DUTCH / REPUBLIC lands on the Netherlands (s539). "1780"
//     g839 lands in the open North Sea off Norfolk (s557). The rivals' cream outlines
//     give way to their orange dashed edges as each fills.
//  C5 last ~1 s: the camera begins the pull-back (s562->, continues in D); C's names,
//     1780 and the tie fade with it; the Dutch arrow recedes to 0.45.
//  D0 "becomes a global war" g919-946: the pull-back reaches the world band (the
//     Mississippi -> India with margin, k 0.135, s606, the band centred on y835 on W's
//     faded page). On "global" g936 the orange spreads from Paris, Madrid and The Hague to
//     their possessions overseas and Britain's possessions light cream from London (crisp
//     circular fronts, s596-612), at the full rung; the two-colour world holds to s622 (g950).
//  THE TOUR (s624 on): every polity fill recedes to 0.3 (FILL_LOW) so each strike
//     (arrow, glyph, label) is the brightest thing; a fill that changes flips at full,
//     then settles to 0.3.
//  D1 STATION 1, the Americas (-96..-74 lon, k 1.2; the dive s622-650 = g950-978):
//     "The French attack Savannah" g976-984: an orange arrow comes up from the sea
//     (d'Estaing out of the Caribbean) past Tybee to Savannah (s642-656); glyph
//     (s654-664); SAVANNAH (s648). Savannah stays cream (the siege failed).
//     "The Spanish attack Louisiana" g1003-1020: a glide west and in (s660-690, k 3.6, so
//     the river arrow is ~220 px); an orange arrow up the Mississippi itself (NE 10m),
//     New Orleans -> Fort Bute -> Baton Rouge (s676-690); glyph (s688-698); LOUISIANA on
//     Spanish Louisiana west of the river (s684).
//  HOP 1 (s696-750, a blurred whip) to STATION 2, western Europe as one tall frame.
//  D3 "The French want to try to invade England from the Isle of Wight": ENGLAND (s747);
//     a DASHED orange arrow from Brest round Ushant and up the Channel that slows and
//     STOPS off Plymouth (s750-778: the Armada of 1779 never landed); ISLE OF WIGHT (s771).
//  D4 "fight with the French at Ushant" g1146-1167: a cream arrow down-Channel from
//     Spithead (s806-826) and an orange one out of Brest (s812-826) meet ~100 mi west of
//     Ushant; glyph (cream: Keppel sought the battle) (s824-836); USHANT (s831).
//  D5 the camera creeps south and out (s846-918, no hop) until Gibraltar and Menorca
//     sit low in the frame with the Channel marks still at the top: "Gibraltar" g1270:
//     an orange siege line closes on the isthmus side, the sea side dashed (s912-938)
//     - it HOLDS, Gibraltar's post stays cream; GIBRALTAR (s934). "Menorca" g1286: an
//     orange arrow from off Cartagena (s942-956); the island flips orange from the
//     landing beach (s955-965) and settles to the tour rung; glyph; MENORCA (s950).
//     All five European marks are on this one page.
//  D6 a glide south-west to Cape Verde (s962-1006, k 3.1: the archipelago ~350 px): four
//     cream ships at anchor off Porto Praya (s1002-1012, "British possessions"); an orange
//     arrow out of the north (Suffren, sailing south from Brest) strikes them (s1012-1026);
//     glyph on the town (s1024-1034); CAPE VERDE ISLANDS (s1019). The islands stay unfilled
//     (Portuguese, neutral).
//  HOP 2 = the payoff: right after "Islands" the camera pulls out to the world band
//     (s1042-1078) where every mark from Savannah to Cape Verde shows at once, creeps
//     there (s1076-1090 = g1404-1418), then pushes into south India over 40 f (s1088-1128,
//     k 1.9).
//  D7 "The British attack French possessions at Mahe and Pondicherry in India": a cream
//     arrow from the sea strikes Mahe (s1124-1135), its orange post turns cream (s1135-
//     1149); glyph; MAHE (s1129). A cream arrow down the coast from Madras (Munro's
//     march) strikes Pondicherry (s1137-1148), its post turns cream (s1148-1162);
//     glyph; PONDICHERRY (s1140). INDIA (s1164).
//  E_NEEDS: every strike arrow fades out over s1192-1222 (E's pull-out, under the blur);
//     the glyphs, posts, ships and the Gibraltar siege arc stay at their receded rung.
//  D8 end: the pull-back from India starts after "India" (s1172-1228, still moving on
//     D's last frame s1185); the Indian marks recede (s1182-1196).
//  Every mark (arrow + glyph) recedes to the 0.45 rung as the camera moves on and
//  stays, so the world fills with fronts; names fade with their camera.
//
// SOURCES: notes/CD_FACTS.md (every coordinate, route, date and URL); routes in
// sugarCDData.ts. Treaty of Alliance 6 Feb 1778; Aranjuez 12 Apr 1779; Britain
// declares war on the Dutch 20 Dec 1780. Savannah 16 Sep-18 Oct 1779; Fort Bute
// 7 Sep / Baton Rouge 21 Sep 1779; Armada of 1779 (fleet off Plymouth mid-Aug,
// abandoned 3 Sep); Ushant 27 Jul 1778 (48.56 N 7.38 W); Great Siege of Gibraltar
// 1779-83; Menorca landing 19 Aug 1781; Porto Praya 16 Apr 1781; Pondicherry 18 Oct
// 1778; Mahe 19 Mar 1779 (Wikipedia pages cited in CD_FACTS.md).
// ---------------------------------------------------------------------------
import React from "react";
import { GB_WASH, camAB } from "./sugarAB";
import { PLACES as CDP, ROUTES, type LL } from "./sugarCDData";
import {
  ACCENT,
  type Act,
  type ActProps,
  Arrow,
  type Cam,
  CityDot,
  CREAM_HATCH_OP,
  CREAM_WASH,
  DARK,
  Fill,
  type Framing,
  GROUPS,
  type GroupKey,
  GroupEdge,
  INK,
  SEA,
  InkLine,
  MISSISSIPPI,
  Label,
  type Move,
  Numeral,
  OrangeLine,
  type P2,
  PLACES,
  POSTS,
  RUNG,
  Ring,
  RouteLine,
  clamp01,
  dOf,
  easeInOutSine,
  extendCamTrack,
  groupD,
  lerp,
  mixColor,
  project,
  ramp,
  revealCircle,
  smoothRoute,
  smoothstep,
  sw,
} from "./sugarShared";

const P = (ll: LL): P2 => project(ll[0], ll[1]);
const NUM_SIZE = 224; // the years: IM Fell figures, >= 156 px tall on screen
const LBL = 8; // a label's slide starts this many frames before its word

// ---------------------------------------------------------------------------
// TIMING (story frames)
// ---------------------------------------------------------------------------
export const T = {
  // C
  hop: [297, 328] as [number, number], // lands on "Britain" (s328)
  britain: sw(602) - LBL,
  gbBright: [320, 334] as [number, number],
  rivals: [334, 352] as [number, number], // "down a peg" g609-623
  france: sw(659) - LBL,
  tie: [381, 414] as [number, number],
  tieEdge: 392, // the tie's tip enters the frame
  parisDot: [400, 410] as [number, number],
  frFill: [414, 428] as [number, number],
  y1778: sw(698) - LBL,
  spain: sw(730) - LBL,
  spFill: [458, 482] as [number, number],
  y1779: sw(762) - LBL,
  yearsOut: [506, 520] as [number, number], // 1778 + 1779 leave as the camera turns to the North Sea
  dutchArrow: [518, 538] as [number, number],
  nlFill: [538, 550] as [number, number],
  dutch: sw(821) - LBL,
  y1780: sw(839) - LBL,
  cOut: [562, 588] as [number, number], // C's names + 1780 fade with the pull-back
  cRecede: [566, 580] as [number, number], // the Dutch arrow -> 0.45
  tieOut: [566, 590] as [number, number], // the tie (C's mechanism, not a front) leaves with the pull-back
  gbBack: [566, 600] as [number, number],
  // D
  global: [596, 612] as [number, number], // "global" s608
  fillsDown: [624, 642] as [number, number], // the tour starts: every polity fill recedes to FILL_LOW
  savArrow: [642, 656] as [number, number],
  savGlyph: [654, 664] as [number, number],
  savannah: sw(984) - LBL,
  laArrow: [676, 690] as [number, number],
  laGlyph: [688, 698] as [number, number],
  louisiana: sw(1020) - LBL,
  amLeave: [702, 716] as [number, number],
  england: sw(1083) - LBL,
  armada: [750, 778] as [number, number],
  wight: sw(1107) - LBL,
  ushBrit: [806, 826] as [number, number],
  ushFr: [812, 826] as [number, number],
  ushGlyph: [824, 836] as [number, number],
  ushant: sw(1167) - LBL,
  chLeave: [850, 864] as [number, number],
  gibSiege: [912, 938] as [number, number],
  gibraltar: sw(1270) - LBL,
  menArrow: [942, 956] as [number, number],
  menFlip: [955, 965] as [number, number],
  menSettle: [968, 990] as [number, number],
  menGlyph: [954, 964] as [number, number],
  menorca: sw(1286) - LBL,
  medLeave: [970, 984] as [number, number],
  ships: [1002, 1012] as [number, number], // "British possessions" s1006-1015
  cvArrow: [1012, 1026] as [number, number],
  cvGlyph: [1024, 1034] as [number, number],
  capeVerde: sw(1355) - LBL,
  cvLeave: [1046, 1060] as [number, number],
  maheArrow: [1124, 1135] as [number, number],
  maheFlip: [1135, 1149] as [number, number],
  maheGlyph: [1133, 1143] as [number, number],
  mahe: sw(1465) - LBL,
  pondArrow: [1137, 1148] as [number, number],
  pondFlip: [1148, 1162] as [number, number],
  pondGlyph: [1146, 1156] as [number, number],
  pondicherry: sw(1476) - LBL,
  india: sw(1500) - LBL,
  inRecede: [1182, 1196] as [number, number],
  inLabelsOut: [1192, 1206] as [number, number],
  arrowsOut: [1192, 1222] as [number, number], // E_NEEDS.md: the strike arrows fade during E's pull-out
};

// ---------------------------------------------------------------------------
// THE CAMERA (C + D) = AB's track extended
// ---------------------------------------------------------------------------
/** the world band: k and the latitude at y835 that centre the faded page band on y835 */
const K_WORLD = 0.135;
const WORLD_LAT = 30;
const Fr = (lon: number, lat: number, k: number, sx = 540, sy = 835): Framing => ({ p: project(lon, lat), k, sx, sy });
export const camCD = extendCamTrack(
  camAB,
  [
    Fr(-1.5, 51.0, 0.82, 540, 800), // C1 Britain, France + the Low Countries below it
    Fr(-1.6, 51.0, 0.85, 540, 800), //    its creep
    Fr(-4.8, 47.4, 0.8), // C2 France + Biscay
    Fr(-7.0, 42.4, 0.8), // C3 Spain
    Fr(2.6, 53.6, 1.15), // C4 Britain + the North Sea + the United Provinces
    Fr(2.65, 53.6, 1.19), //    its creep (under the pull-back)
    Fr(-3, WORLD_LAT, K_WORLD), // D0 the world band, the Mississippi -> India with margin, centred on y835
    Fr(-3.3, WORLD_LAT, K_WORLD * 1.03), //    its creep
    Fr(-84.5, 30.6, 1.2), // D1 STATION 1: SE North America + the Gulf (-96..-74)
    Fr(-91.0, 30.12, 3.6), //    the glide west + in onto the lower Mississippi (New Orleans -> Baton Rouge)
    Fr(-3.5, 49.3, 1.15, 540, 700), // D3 STATION 2: western Europe, the Channel up top
    Fr(-3.5, 49.3, 1.19, 540, 700), //    its creep
    Fr(-1.6, 38.0, 0.95, 540, 1000), //    the creep south + out: Gibraltar + Menorca, the Channel marks still in frame
    Fr(-1.6, 38.0, 0.98, 540, 1000), //    its creep
    Fr(-23.75, 16.0, 3.1), // D6 Cape Verde: the archipelago ~350 px across
    Fr(-23.7, 15.95, 3.0), //    its creep (out a touch)
    Fr(-3, WORLD_LAT, K_WORLD), // D7 the world again: every front at once
    Fr(-3.3, WORLD_LAT, K_WORLD * 1.03), //    its creep
    Fr(77.6, 13.0, 1.9), // D8 south India filling the column: Mahe left, Pondicherry + Madras right
    Fr(77.6, 13.05, 1.96), //    its creep
    Fr(78, 16, 0.75), // D9 the pull-back (still moving at D's end)
  ],
  [
    { from: 297, to: 328, path: "vw", rho: 1.3, taper: 0.6 },
    { from: 330, to: 380 },
    { from: 368, to: 404 },
    { from: 438, to: 474 },
    { from: 506, to: 532 },
    { from: 530, to: 580 },
    { from: 562, to: 606, path: "vw", rho: 1.0, taper: 0.6 },
    { from: 604, to: 626 },
    { from: 622, to: 650, path: "vw", rho: 1.0, taper: 0.5 },
    { from: 660, to: 690 },
    { from: 696, to: 750, path: "vw", rho: 1.3, taper: 0.5 },
    { from: 748, to: 846 },
    { from: 846, to: 918 },
    { from: 916, to: 966 },
    { from: 962, to: 1006, path: "vw", rho: 1.1, taper: 0.6 },
    { from: 1006, to: 1044 },
    { from: 1042, to: 1078, path: "vw", rho: 1.0, taper: 0.7 },
    { from: 1076, to: 1090 },
    { from: 1088, to: 1128, path: "vw", rho: 1.0, taper: 0.55 },
    { from: 1128, to: 1174 },
    { from: 1172, to: 1228 },
  ] satisfies Move[],
);

// ---------------------------------------------------------------------------
// PLACES, ROUTES
// ---------------------------------------------------------------------------
const PARIS: P2 = [PLACES.paris.x, PLACES.paris.y];
const MADRID: P2 = [PLACES.madrid.x, PLACES.madrid.y];
const HAGUE: P2 = [PLACES.theHague.x, PLACES.theHague.y];
const LONDON: P2 = [PLACES.london.x, PLACES.london.y];
const ANDORRA: P2 = project(1.52, 42.51); // the Pyrenees: where the front crosses
const SAVANNAH: P2 = P(CDP.savannah);
const BATON_ROUGE: P2 = P(CDP.batonRouge);
const NEW_ORLEANS: P2 = P(CDP.newOrleans);
const USHANT_BATTLE: P2 = P(CDP.ushantBattle);
const GIBRALTAR: P2 = P(CDP.gibraltar);
const MESQUIDA: P2 = P(CDP.mesquida);
const PORTO_PRAYA: P2 = P(CDP.portoPraya);
const MAHE: P2 = P(CDP.mahe);
const PONDICHERRY: P2 = P(CDP.pondicherry);
const MADRAS: P2 = P(CDP.madras);
const rt = (k: keyof typeof ROUTES, step = 2) => smoothRoute(ROUTES[k].map(P), step);
export const R = {
  tie: rt("tie", 6),
  dutch: rt("dutch"),
  savannah: rt("savannah"),
  // up the Mississippi itself (NE 10m, W's MISSISSIPPI): New Orleans -> Fort Bute -> Baton Rouge
  louisiana: smoothRoute([...MISSISSIPPI.slice(349, 381)].reverse().filter((_, i, a) => i % 3 === 0 || i === a.length - 1), 0.5),
  armada: rt("armada"),
  ushantBritish: rt("ushantBritish"),
  ushantFrench: rt("ushantFrench"),
  menorca: rt("menorca"),
  portoPraya: rt("portoPraya"),
  pondicherry: rt("pondicherry", 1),
  mahe: rt("mahe", 1),
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
/** 1 -> 0.45 over [a, b] (a mark receding as the camera moves on) */
const recede = (s: number, [a, b]: [number, number]) => lerp(1, RUNG.mid, ramp(s, a, b));
/** 1 -> 0 over [a, b] */
const fadeOut = (s: number, [a, b]: [number, number]) => 1 - ramp(s, a, b);
/** an arrow's head arclength: eased draw over [a, b] (ease 1 = in-out, "out" = decelerate to a stop) */
const drawS = (len: number, s: number, [a, b]: [number, number], ease: "inout" | "out" = "inout") => {
  const u = clamp01((s - a) / (b - a));
  return len * (ease === "out" ? 1 - Math.pow(1 - u, 2.2) : easeInOutSine(u));
};
/** the glyph's screen size: 64 px from k 1, shrinking on the wides (never < 22 px) */
/** a strike glyph's screen size: GLYPH px on the frame it lands, then scaling gently with the camera
 *  (k / kLand)^0.4, never above GLYPH, never under 22 px */
const GLYPH = 64;
const glyphSizeAt = (k: number, land: [number, number]) => GLYPH * Math.max(0.34, Math.min(1, Math.pow(k / camCD(land[0]).k, 0.4)));
// Lucide \`swords\` (lucide-static, ISC), as in NotConveyingAnything.tsx / sugarShared's BattleGlyph
const SWORDS = [
  "m13 19 6-6",
  "M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5",
  "m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586",
  "m16 16 4 4",
  "m19 21 2-2",
  "m5 14 4 4",
  "m5 21-2-2",
  "M7.5 16.5 4 20",
];
/** A BATTLE (the clip's strike mark): the swords inside a ring, screen-sized, coloured by the
 *  attacker. progress 0..1: the ring draws clockwise (0..0.5) while the swords fade + rise in
 *  (0.12..0.6), so the swords read on the landing frame. Same look as sugarShared's BattleGlyph,
 *  heavier strokes (ring 3.0, swords 3.0 screen px) for phone size. */
const StrikeGlyph: React.FC<{ x: number; y: number; cam: Cam; size: number; color?: string; progress: number; opacity?: number }> = ({
  x,
  y,
  cam,
  size,
  color = ACCENT,
  progress,
  opacity = 1,
}) => {
  if (opacity <= 0.002 || progress <= 0.001) return null;
  const R = size / 2 / cam.k;
  const ringP = clamp01(progress / 0.5);
  const gp = smoothstep((progress - 0.12) / 0.48);
  const gs = (size * 0.64) / 24 / cam.k;
  const lift = (1 - gp) * 6;
  const sw = 3.0 * Math.max(0.6, size / GLYPH);
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={R} fill={SEA} fillOpacity={0.7 * ringP} />
      <Ring x={x} y={y} cam={cam} r={size / 2} progress={ringP} color={color} width={sw} />
      {gp > 0.002 ? (
        <g transform={`translate(${x - 12 * gs} ${y - 12 * gs + lift / cam.k}) scale(${gs})`} opacity={gp} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {SWORDS.map((d, i) => (
            <path key={`sk${i}`} d={d} stroke={DARK} strokeOpacity={0.6} strokeWidth={(sw + 2.2) / (gs * cam.k)} />
          ))}
          {SWORDS.map((d, i) => (
            <path key={`sw${i}`} d={d} stroke={color} strokeWidth={sw / (gs * cam.k)} />
          ))}
        </g>
      ) : null}
    </g>
  );
};
/** THE ONE ARROW WEIGHT of the clip (screen px) and its head */
const ARROW_W = 4.5;
const ARROW_HEAD = 24;
/** an arrow's head stops at its glyph's ring (screen radius gs / 2 + 5) */
const toRing = (route: { len: number }, s1: number, gs: number, k: number) => Math.min(s1, route.len - (gs / 2 + 6) / k);
const glyphP = (s: number, [a, b]: [number, number]) => clamp01((s - a) / (b - a));
const FLIP_WASH = 0.55;
/** THE TOUR RUNG: once the tour starts every polity fill recedes so each strike is the brightest thing */
const FILL_LOW = 0.3;
const fillOp = (s: number) => lerp(1, FILL_LOW, ramp(s, T.fillsDown[0], T.fillsDown[1]));
/** a country turning orange: the bright flip wash settling into the hatch */
const flipFill = (settle: number) => ({ fill: lerp(FLIP_WASH, 0.2, settle), hatch: 0.85 * settle });

// the global fronts: each group revealed by a circle from its mother capital
const ORANGE_OVERSEAS: { g: GroupKey; o: P2 }[] = [
  ...(["frCarib", "frGuiana", "frIndian"] as GroupKey[]).map((g) => ({ g, o: PARIS })),
  ...(["spCarib", "spLouisiana", "spNewSpain", "spSouthAm"] as GroupKey[]).map((g) => ({ g, o: MADRID })),
  ...(["dutchCarib", "dutchGuiana", "dutchCape", "dutchCeylon", "dutchIndies"] as GroupKey[]).map((g) => ({ g, o: HAGUE })),
];
const CREAM_OVERSEAS: GroupKey[] = ["britNA", "wFlorida", "eFlorida", "britCarib", "bermuda", "gibraltar", "menorca", "britIndia"];
const GLOBAL_R = 5800; // world px: past the farthest possession from its capital
const globalR = (s: number) => GLOBAL_R * easeInOutSine((s - T.global[0]) / (T.global[1] - T.global[0]));
const reachS = (o: P2, p: P2) => {
  // the story frame the global front from o reaches p
  const d = Math.hypot(p[0] - o[0], p[1] - o[1]) / GLOBAL_R;
  const u = Math.acos(1 - 2 * clamp01(d)) / Math.PI;
  return T.global[0] + u * (T.global[1] - T.global[0]);
};
const sideOrigin = { brit: LONDON, france: PARIS, spain: MADRID, dutch: HAGUE } as const;

// ---------------------------------------------------------------------------
// THE POSTS (only those a strike lands on): a dot in a thin ring, orange or cream,
// lit by the global front. Mahe and Pondicherry turn cream when struck. Gibraltar is
// drawn as a cream post (the Rock is < 1 px at most zooms).
// ---------------------------------------------------------------------------
type PostDef = { name: string; p: P2; side: "orange" | "cream"; lit: number; flip?: [number, number] };
const POST_DEFS: PostDef[] = [
  ...POSTS.filter((q) => q.name === "Mahe" || q.name === "Pondicherry").map((q) => {
    const p: P2 = [q.x, q.y];
    const flip = q.name === "Mahe" ? T.maheFlip : q.name === "Pondicherry" ? T.pondFlip : undefined;
    return { name: q.name, p, side: q.side === "brit" ? ("cream" as const) : ("orange" as const), lit: reachS(sideOrigin[q.side], p), flip };
  }),
  { name: "Gibraltar", p: GIBRALTAR, side: "cream", lit: reachS(LONDON, GIBRALTAR) },
];
const Post: React.FC<{ d: PostDef; s: number; cam: Cam }> = ({ d, s, cam }) => {
  const on = ramp(s, d.lit, d.lit + 8);
  if (on <= 0.002) return null;
  const toCream = d.flip ? ramp(s, d.flip[0], d.flip[1]) : 0;
  const col = d.side === "cream" ? INK : mixColor(ACCENT, INK, toCream);
  const sc = Math.max(0.55, Math.min(1, Math.pow(cam.k / 0.8, 0.5)));
  const r = 4.2 * sc;
  return (
    <g opacity={on}>
      <circle cx={d.p[0]} cy={d.p[1]} r={(r + 1.6) / cam.k} fill={DARK} fillOpacity={0.6} />
      <circle cx={d.p[0]} cy={d.p[1]} r={r / cam.k} fill={col} />
      <circle cx={d.p[0]} cy={d.p[1]} r={(r + 5 * sc) / cam.k} fill="none" stroke={col} strokeOpacity={0.8} strokeWidth={1.6 / cam.k} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// C: the rivals
// ---------------------------------------------------------------------------
const RIVALS: GroupKey[] = ["france", "spain", "dutch"];
const settleU = ([, b]: [number, number], s: number, dur = 14) => smoothstep((s - b) / dur);
/** France's reveal radius (world px) from Paris; Spain's from Andorra; the Netherlands' from The Hague */
const FR_R = 540;
const SP_R = 1050; // reaches the Canaries last
const NL_R = 210;
const frontR = (s: number, w: [number, number], Rmax: number) => Rmax * easeInOutSine((s - w[0]) / (w[1] - w[0]));
/** when each rival's own orange fill starts (its cream outline gives way then) */
const rivalOn: Record<string, [number, number]> = { france: T.frFill, spain: T.spFill, dutch: T.nlFill };

// arclength where the tie enters the C2 frame (lon -21)
const TIE_EDGE_S = (() => {
  const xEdge = project(-21.5, 47)[0];
  const L = R.tie.len;
  for (let i = 0; i <= 2000; i++) if (R.tie.pointAt((L * i) / 2000)[0] >= xEdge) return (L * i) / 2000;
  return 0;
})();
const tieS = (s: number) => {
  if (s <= T.tie[0]) return 0;
  if (s < T.tieEdge) return TIE_EDGE_S * clamp01((s - T.tie[0]) / (T.tieEdge - T.tie[0]));
  const u = clamp01((s - T.tieEdge) / (T.tie[1] - T.tieEdge));
  return TIE_EDGE_S + (R.tie.len - TIE_EDGE_S) * (1 - Math.pow(1 - u, 1.8));
};

// ---------------------------------------------------------------------------
// THE LAYERS
// ---------------------------------------------------------------------------
export const CDUnder: React.FC<ActProps> = ({ s, cam, uid = "" }) => {
  const k = cam.k;
  if (s < 297) return null;
  // Great Britain (handed over from AB at C's first frame): brightens on "Britain"
  const gbB = ramp(s, T.gbBright[0], T.gbBright[1]) * (1 - ramp(s, T.gbBack[0], T.gbBack[1]));
  const fo = fillOp(s);
  const els: React.ReactNode[] = [
    <Fill key="gb" id={`cdGb${uid}`} d={groupD("gb", k)} cam={cam} side="cream" opacity={fo} fill={lerp(GB_WASH.fill, 0.36, gbB)} hatch={lerp(GB_WASH.hatch, 0.95, gbB)} />,
  ];
  // France, Spain, the Dutch Republic
  const fr = (key: GroupKey, w: [number, number], o: P2, Rmax: number) => {
    if (s < w[0]) return null;
    const st = settleU(w, s);
    const f = flipFill(st);
    const spreading = s < w[1];
    return (
      <Fill
        key={key}
        id={`cd-${key}${uid}`}
        d={groupD(key, k)}
        cam={cam}
        side="orange"
        opacity={fo}
        fill={f.fill}
        hatch={f.hatch}
        reveal={spreading ? revealCircle(o, Math.max(0.01, frontR(s, w, Rmax))) : undefined}
        feather={4}
      />
    );
  };
  els.push(fr("france", T.frFill, PARIS, FR_R), fr("spain", T.spFill, ANDORRA, SP_R), fr("dutch", T.nlFill, HAGUE, NL_R));
  // D: the possessions overseas (W's scene-wide polar mask fades them with the page)
  if (s >= T.global[0]) {
    const over: React.ReactNode[] = [];
    const r = globalR(s);
    const spreading = s < T.global[1];
    ORANGE_OVERSEAS.forEach(({ g, o }) => {
      const c = GROUPS[g].c;
      const ls = reachS(o, c);
      const st = smoothstep((s - ls) / 14);
      const f = flipFill(st);
      over.push(
        <Fill key={`go-${g}`} id={`cdGo-${g}${uid}`} d={groupD(g, k)} cam={cam} side="orange" opacity={fo} fill={f.fill} hatch={f.hatch} reveal={spreading ? revealCircle(o, Math.max(0.01, r)) : undefined} feather={5} />,
      );
    });
    CREAM_OVERSEAS.forEach((g) => {
      // Menorca turns orange when it is taken (D5)
      const op = fo * (g === "menorca" ? 1 - ramp(s, T.menFlip[0], T.menFlip[1]) : 1);
      over.push(
        <Fill
          key={`gc-${g}`}
          id={`cdGc-${g}${uid}`}
          d={groupD(g, k)}
          cam={cam}
          side="cream"
          opacity={op}
          fill={CREAM_WASH}
          hatch={CREAM_HATCH_OP}
          reveal={spreading ? revealCircle(LONDON, Math.max(0.01, r)) : undefined}
          feather={5}
        />,
      );
    });
    els.push(
      <g key="overseas">
        {over}
      </g>,
    );
    if (s >= T.menFlip[0]) {
      const st = smoothstep((s - T.menFlip[1]) / 12);
      const f = flipFill(st);
      const spread = s < T.menFlip[1];
      els.push(
        <Fill
          key="men-o"
          id={`cdMenO${uid}`}
          d={groupD("menorca", k)}
          cam={cam}
          side="orange"
          opacity={lerp(1, FILL_LOW, ramp(s, T.menSettle[0], T.menSettle[1]))}
          fill={f.fill}
          hatch={f.hatch}
          reveal={spread ? revealCircle(MESQUIDA, Math.max(0.01, 26 * easeInOutSine((s - T.menFlip[0]) / (T.menFlip[1] - T.menFlip[0])))) : undefined}
          feather={3}
        />,
      );
    }
  }
  return <>{els}</>;
};

/** the Gibraltar siege: an orange arc round the Rock, solid on the land side (the
 *  Spanish lines across the isthmus, N), dashed on the sea side (the blockade) */
const SiegeArc: React.FC<{ cam: Cam; s: number; opacity: number }> = ({ cam, s, opacity }) => {
  const u = clamp01((s - T.gibSiege[0]) / (T.gibSiege[1] - T.gibSiege[0]));
  if (u <= 0 || opacity <= 0.002) return null;
  const R0 = 44 * Math.max(0.5, Math.min(1, Math.pow(cam.k / camCD(T.gibSiege[0]).k, 0.4)));
  const r = R0 / cam.k;
  const arc = (a0: number, a1: number, n = 40) =>
    dOf(Array.from({ length: n + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / n;
      return [GIBRALTAR[0] + r * Math.cos(a), GIBRALTAR[1] + r * Math.sin(a)] as P2;
    }));
  // land side: from W (pi) over N (3pi/2) to E (2pi); sea side: E -> S -> W
  const landU = easeInOutSine(clamp01(u / 0.62));
  const seaU = easeInOutSine(clamp01((u - 0.5) / 0.5));
  // the land arc grows from N both ways (the lines run across the isthmus)
  const N = 1.5 * Math.PI;
  const half = (Math.PI / 2) * landU;
  return (
    <g>
      {landU > 0.001 ? <OrangeLine d={arc(N - half, N + half)} cam={cam} width={ARROW_W} opacity={opacity} /> : null}
      {seaU > 0.001 ? (
        <>
          <OrangeLine d={arc(2 * Math.PI, 2 * Math.PI + (Math.PI / 2) * seaU, 20)} cam={cam} width={ARROW_W - 0.5} dash={0} opacity={opacity * 0.9} />
          <OrangeLine d={arc(Math.PI, Math.PI - (Math.PI / 2) * seaU, 20)} cam={cam} width={ARROW_W - 0.5} dash={0} opacity={opacity * 0.9} />
        </>
      ) : null}
    </g>
  );
};

// Johnstone's squadron at anchor in Porto Praya bay: four cream ship marks just south
// of the town (screen offsets, px), the strike's glyph lands on the town above them
const SHIP_OFF: P2[] = [
  [-60, 66],
  [-20, 76],
  [20, 66],
  [60, 76],
];
const SHIP_S = 1.5; // ~30 px hull, ~24 px mast
/** a small engraved ship at anchor (screen-sized, ~18 px): hull, mast, one sail */
const Ship: React.FC<{ x: number; y: number; cam: Cam; opacity: number; scale?: number }> = ({ x, y, cam, opacity, scale = 1 }) => {
  if (opacity <= 0.002) return null;
  const u = (SHIP_S * scale) / cam.k;
  const hull = `M${x - 10 * u},${y}L${x + 10 * u},${y}L${x + 6 * u},${y + 5 * u}L${x - 6 * u},${y + 5 * u}Z`;
  const sail = `M${x + 1 * u},${y - 15 * u}L${x + 8 * u},${y - 3 * u}L${x + 1 * u},${y - 3 * u}Z`;
  const mast = `M${x},${y - 16 * u}L${x},${y}`;
  return (
    <g opacity={opacity} strokeLinejoin="round" strokeLinecap="round">
      <path d={`${hull}${sail}${mast}`} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={(4.2 / (SHIP_S * scale)) * u} />
      <path d={`${hull}${sail}`} fill={INK} />
      <path d={mast} stroke={INK} strokeWidth={(2.2 / (SHIP_S * scale)) * u} />
    </g>
  );
};

export const CDOver: React.FC<ActProps> = ({ s, cam }) => {
  if (s < 297) return null;
  const k = cam.k;
  const els: React.ReactNode[] = [];
  // E's pull-out from India (s1192-1222, under the blur): every strike arrow leaves; glyphs, posts, ships stay
  const arrowsOut = 1 - ramp(s, T.arrowsOut[0], T.arrowsOut[1]);
  // C1: Great Britain's coast lifts to full cream on "Britain" (with its brighter wash)
  const gbLine = ramp(s, T.gbBright[0], T.gbBright[1]) * (1 - 0.55 * ramp(s, T.gbBack[0], T.gbBack[1]));
  if (gbLine > 0.002) els.push(<InkLine key="gbLine" d={groupD("gb", k)} cam={cam} width={1.8} opacity={gbLine} />);
  // C0: the rivals' cream outlines; each gives way to its orange dashed edge as it fills
  RIVALS.forEach((g) => {
    const lift = ramp(s, T.rivals[0], T.rivals[1]);
    const w = rivalOn[g];
    const toOrange = ramp(s, w[0], w[1] + 6);
    const op = RUNG.mid * lift * (1 - toOrange);
    if (op > 0.002) els.push(<InkLine key={`ro-${g}`} d={groupD(g, k)} cam={cam} width={1.6} opacity={op} />);
    if (toOrange > 0.002) els.push(<GroupEdge key={`re-${g}`} group={g} cam={cam} side="orange" opacity={toOrange * lerp(1, 0.5, ramp(s, T.fillsDown[0], T.fillsDown[1]))} />);
  });
  // C2: the tie, colonies -> Paris; Paris' dot while it is anchored there
  const tieOp = fadeOut(s, T.tieOut);
  const ts = tieS(s);
  if (ts > 0.5) els.push(<RouteLine key="tie" route={R.tie} cam={cam} s0={0} s1={ts} opacity={tieOp} width={ARROW_W} />);
  const pd = ramp(s, T.parisDot[0], T.parisDot[1]);
  if (pd > 0) els.push(<CityDot key="paris" x={PARIS[0]} y={PARIS[1]} cam={cam} opacity={pd * tieOp} />);
  // C4: Britain strikes the Dutch (cream)
  if (s >= T.dutchArrow[0]) {
    els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="dutchA" route={R.dutch} cam={cam} s1={drawS(R.dutch.len, s, T.dutchArrow)} color={INK} opacity={recede(s, T.cRecede) * arrowsOut} />);
  }
  // D: the posts
  if (s >= T.global[0]) POST_DEFS.forEach((d) => els.push(<Post key={`post-${d.name}`} d={d} s={s} cam={cam} />));
  // D1 Savannah
  if (s >= T.savArrow[0]) {
    const op = recede(s, T.amLeave);
    els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="savA" route={R.savannah} cam={cam} s1={toRing(R.savannah, drawS(R.savannah.len, s, T.savArrow), glyphSizeAt(k, T.savGlyph), k)} opacity={op * arrowsOut} />);
    els.push(<StrikeGlyph key="savG" x={SAVANNAH[0]} y={SAVANNAH[1]} cam={cam} size={glyphSizeAt(k, T.savGlyph)} progress={glyphP(s, T.savGlyph)} opacity={op} />);
  }
  // D2 Louisiana
  if (s >= T.laArrow[0]) {
    const op = recede(s, T.amLeave);
    els.push(<CityDot key="nola" x={NEW_ORLEANS[0]} y={NEW_ORLEANS[1]} cam={cam} opacity={op * arrowsOut * ramp(s, T.laArrow[0] - 6, T.laArrow[0])} r={4.5} color={ACCENT} />);
    els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="laA" route={R.louisiana} cam={cam} s1={toRing(R.louisiana, drawS(R.louisiana.len, s, T.laArrow), glyphSizeAt(k, T.laGlyph), k)} opacity={op * arrowsOut} />);
    els.push(<StrikeGlyph key="laG" x={BATON_ROUGE[0]} y={BATON_ROUGE[1]} cam={cam} size={glyphSizeAt(k, T.laGlyph)} progress={glyphP(s, T.laGlyph)} opacity={op} />);
  }
  // D3 the Armada of 1779: dashed, slowing to a stop off Plymouth
  if (s >= T.armada[0]) {
    els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="armA" route={R.armada} cam={cam} s1={drawS(R.armada.len, s, T.armada, "out")} dashed opacity={recede(s, T.chLeave) * arrowsOut} />);
  }
  // D4 Ushant
  if (s >= T.ushBrit[0]) {
    const op = recede(s, T.chLeave);
    els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="ushB" route={R.ushantBritish} cam={cam} s1={toRing(R.ushantBritish, drawS(R.ushantBritish.len, s, T.ushBrit), glyphSizeAt(k, T.ushGlyph), k)} color={INK} opacity={op * arrowsOut} />);
    if (s >= T.ushFr[0]) els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="ushF" route={R.ushantFrench} cam={cam} s1={toRing(R.ushantFrench, drawS(R.ushantFrench.len, s, T.ushFr), glyphSizeAt(k, T.ushGlyph), k)} opacity={op * arrowsOut} />);
    els.push(<StrikeGlyph key="ushG" x={USHANT_BATTLE[0]} y={USHANT_BATTLE[1]} cam={cam} size={glyphSizeAt(k, T.ushGlyph)} color={INK} progress={glyphP(s, T.ushGlyph)} opacity={op} />);
  }
  // D5 Gibraltar (holds), Menorca (taken)
  if (s >= T.gibSiege[0]) els.push(<SiegeArc key="gib" cam={cam} s={s} opacity={recede(s, T.medLeave)} />);
  if (s >= T.menArrow[0]) {
    const op = recede(s, T.medLeave);
    els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="menA" route={R.menorca} cam={cam} s1={drawS(R.menorca.len, s, T.menArrow)} opacity={op * arrowsOut} />);
    const gp: P2 = [MESQUIDA[0] + 30 / k, MESQUIDA[1] - 30 / k];
    els.push(<StrikeGlyph key="menG" x={gp[0]} y={gp[1]} cam={cam} size={glyphSizeAt(k, T.menGlyph)} progress={glyphP(s, T.menGlyph)} opacity={op} />);
  }
  // D6 Cape Verde: the squadron at anchor, Suffren's strike
  if (s >= T.ships[0]) {
    const op = ramp(s, T.ships[0], T.ships[1]) * recede(s, T.cvLeave);
    const sc = Math.max(0.15, Math.min(1, Math.pow(k / camCD(T.ships[0]).k, 0.6)));
    SHIP_OFF.forEach(([dx, dy], i) => els.push(<Ship key={`ship${i}`} x={PORTO_PRAYA[0] + (dx * sc) / k} y={PORTO_PRAYA[1] + (dy * sc) / k} cam={cam} scale={sc} opacity={op} />));
  }
  if (s >= T.cvArrow[0]) {
    const op = recede(s, T.cvLeave);
    els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="cvA" route={R.portoPraya} cam={cam} s1={toRing(R.portoPraya, drawS(R.portoPraya.len, s, T.cvArrow), glyphSizeAt(k, T.cvGlyph), k)} opacity={op * arrowsOut} />);
    els.push(<StrikeGlyph key="cvG" x={PORTO_PRAYA[0]} y={PORTO_PRAYA[1]} cam={cam} size={glyphSizeAt(k, T.cvGlyph)} progress={glyphP(s, T.cvGlyph)} opacity={op} />);
  }
  // D7 India: Mahe and Pondicherry (cream strikes)
  if (s >= T.maheArrow[0]) {
    const op = recede(s, T.inRecede);
    els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="maA" route={R.mahe} cam={cam} s1={toRing(R.mahe, drawS(R.mahe.len, s, T.maheArrow), glyphSizeAt(k, T.maheGlyph), k)} color={INK} opacity={op * arrowsOut} />);
    els.push(<StrikeGlyph key="maG" x={MAHE[0]} y={MAHE[1]} cam={cam} size={glyphSizeAt(k, T.maheGlyph)} color={INK} progress={glyphP(s, T.maheGlyph)} opacity={op} />);
  }
  if (s >= T.pondArrow[0] - 6) {
    const op = recede(s, T.inRecede);
    els.push(<CityDot key="madras" x={MADRAS[0]} y={MADRAS[1]} cam={cam} r={4.5} opacity={op * arrowsOut * ramp(s, T.pondArrow[0] - 6, T.pondArrow[0])} />);
    if (s >= T.pondArrow[0])
      els.push(<Arrow width={ARROW_W} head={ARROW_HEAD} key="poA" route={R.pondicherry} cam={cam} s1={toRing(R.pondicherry, drawS(R.pondicherry.len, s, T.pondArrow), glyphSizeAt(k, T.pondGlyph), k)} color={INK} opacity={op * arrowsOut} />);
    els.push(<StrikeGlyph key="poG" x={PONDICHERRY[0]} y={PONDICHERRY[1]} cam={cam} size={glyphSizeAt(k, T.pondGlyph)} color={INK} progress={glyphP(s, T.pondGlyph)} opacity={op} />);
  }
  return <g>{els}</g>;
};

// label anchors (world px)
const L_AT = {
  britain: project(-2.2, 53.4),
  france: project(2.6, 46.7),
  spain: project(-3.9, 40.1),
  dutch: project(6.3, 52.45),
  y1778: project(-11.8, 45.3),
  y1779: project(-10.1, 39.6),
  y1780: project(3.0, 56.0),
  louisiana: project(-92.8, 30.05),
  england: project(-1.4, 52.5),
  wight: project(-1.3, 50.67),
  capeVerde: project(-24.1, 17.55),
  india: project(77.4, 16.2),
};
const pt = (p: P2) => ({ x: p[0], y: p[1] });

export const CDLabels: React.FC<ActProps> = ({ s, cam }) => {
  if (s < 297) return null;
  const cOut = fadeOut(s, T.cOut);
  const yOut = fadeOut(s, T.yearsOut);
  // one name bright at a time in C; the years likewise
  const nameOp = (next: number | null) => (next === null ? 1 : lerp(1, RUNG.mid, ramp(s, next, next + 10)));
  const yearOp = (next: number | null) => (next === null ? 1 : lerp(1, RUNG.mid, ramp(s, next, next + 10)));
  const am = fadeOut(s, T.amLeave);
  const ch = fadeOut(s, T.chLeave);
  const med = fadeOut(s, T.medLeave);
  const cv = fadeOut(s, T.cvLeave);
  const ind = fadeOut(s, T.inLabelsOut);
  return (
    <>
      {cOut > 0.002 ? (
        <>
          <Label text="BRITAIN" {...pt(L_AT.britain)} cam={cam} frame={s} f0={T.britain} size={42} opacity={cOut * nameOp(T.france)} />
          <Label text="FRANCE" {...pt(L_AT.france)} cam={cam} frame={s} f0={T.france} size={44} opacity={cOut * nameOp(T.spain)} />
          <Label text="SPAIN" {...pt(L_AT.spain)} cam={cam} frame={s} f0={T.spain} size={44} opacity={cOut * nameOp(T.dutch)} />
          <Label text="DUTCH" {...pt(L_AT.dutch)} cam={cam} frame={s} f0={T.dutch} size={40} dy={-26} opacity={cOut} />
          <Label text="REPUBLIC" {...pt(L_AT.dutch)} cam={cam} frame={s} f0={T.dutch} size={40} dy={20} opacity={cOut} />
          <Numeral text="1778" {...pt(L_AT.y1778)} cam={cam} frame={s} f0={T.y1778} size={NUM_SIZE} opacity={yOut * yearOp(T.y1779)} />
          <Numeral text="1779" {...pt(L_AT.y1779)} cam={cam} frame={s} f0={T.y1779} size={NUM_SIZE} anchor="end" opacity={yOut} />
          <Numeral text="1780" {...pt(L_AT.y1780)} cam={cam} frame={s} f0={T.y1780} size={NUM_SIZE} opacity={cOut} />
        </>
      ) : null}
      {am > 0.002 ? (
        <>
          <Label text="Savannah" font="roman" {...pt(SAVANNAH)} cam={cam} frame={s} f0={T.savannah} size={38} anchor="end" dx={-42} dy={12} opacity={am} />
          <Label text="LOUISIANA" {...pt(L_AT.louisiana)} cam={cam} frame={s} f0={T.louisiana} size={42} opacity={am} />
        </>
      ) : null}
      {ch > 0.002 ? (
        <>
          <Label text="ENGLAND" {...pt(L_AT.england)} cam={cam} frame={s} f0={T.england} size={44} opacity={ch * nameOp(T.wight)} />
          <Label text="ISLE OF WIGHT" {...pt(L_AT.wight)} cam={cam} frame={s} f0={T.wight} size={40} dy={56} opacity={ch * nameOp(T.ushant)} />
          <Label text="Ushant" font="roman" {...pt(USHANT_BATTLE)} cam={cam} frame={s} f0={T.ushant} size={38} anchor="end" dx={-44} dy={12} opacity={ch} />
        </>
      ) : null}
      {med > 0.002 ? (
        <>
          <Label text="Gibraltar" font="roman" {...pt(GIBRALTAR)} cam={cam} frame={s} f0={T.gibraltar} size={38} dy={-56} opacity={med * nameOp(T.menorca)} />
          <Label text="MENORCA" {...pt(MESQUIDA)} cam={cam} frame={s} f0={T.menorca} size={40} dx={-20} dy={-74} opacity={med} />
        </>
      ) : null}
      {cv > 0.002 ? <Label text="CAPE VERDE ISLANDS" {...pt(L_AT.capeVerde)} cam={cam} frame={s} f0={T.capeVerde} size={40} opacity={cv} /> : null}
      {ind > 0.002 ? (
        <>
          <Label text="Mahé" font="roman" {...pt(MAHE)} cam={cam} frame={s} f0={T.mahe} size={38} anchor="end" dx={-42} dy={12} opacity={ind} />
          <Label text="Pondicherry" font="roman" {...pt(PONDICHERRY)} cam={cam} frame={s} f0={T.pondicherry} size={38} anchor="start" dx={42} dy={12} opacity={ind} />
          <Label text="INDIA" {...pt(L_AT.india)} cam={cam} frame={s} f0={T.india} size={50} opacity={ind} />
        </>
      ) : null}
    </>
  );
};
/** ACT CD for sugarScene */
export const ACT_CD: Act = { name: "CD", cam: camCD, Under: CDUnder, Over: CDOver, Labels: CDLabels };

// ---------------------------------------------------------------------------
// THE STATE AT D'S END (s = 1185), for act E (see notes/D_END.md)
// ---------------------------------------------------------------------------
export const CD_END = {
  s: 1185,
  /** the camera on D's last frame (no sway) - still pulling back from India; camCD
   *  comes to rest at camCD.rest (s1215). E: extendCamTrack(camCD, ...) */
  cam: camCD(1185),
  rest: camCD.rest,
};
