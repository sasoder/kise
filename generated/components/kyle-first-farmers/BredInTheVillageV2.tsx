// ---------------------------------------------------------------------------
// BredInTheVillageV2 (kyle-first-farmers, cut 9; file 9_BredInTheVillage_V2.mov, the cold-review pass on
// BredInTheVillage; same 168 frames and word timing). What V2 changes, over four review rounds:
//   - germs are authored engraved microbes (thin dark keyline + cream rim) with a visible cause: f0 is clean, a
//     coccus chain stirs in the dung heap from f3, from f24 germs come out of the dung and the animals at full
//     opacity (revealed as they leave their source) and land on the people by "farmers" (f80-98)
//   - the farmer's own work makes it: the man of the pair hoes his dung heap, and on his dig at f90 a germ comes
//     up off his blade onto him; people and a goat step into the gaps and a pen gate closes (f104-150)
//   - clinging germs divide (binary fission) and hop person to person and house to house; on "engender" one germ
//     divides 1 -> 2 -> 4 -> 8 (f141-153) above the crowd and the eight spread onto the people not yet carrying one
//   - life: idle everywhere, a head turn (TurnFarmer), the woman's cough on "engender", two women stoop with a
//     hand to the belly after they are hit, a woman heaps grain, a goat grazes, varied groups across the row
//   - a near strip below the captions on its own parallax plane (pen rail, goat, a man and a woman cropped at the
//     chest), alive, with two germs off the near goat onto the man (f87) and the woman (f141)
//   - the roof haze and the orange dust are gone; the foreground roofs are solid umber planes
//
// (V1 header, kept for the shared parts:)
// BredInTheVillage (kyle-first-farmers, cut 9; file 9_BredInTheVillage.mov). Dwarkesh map style
// (styles/dwarkesh-map.md), the umber page with no map. Opaque 1080x1920, 29.97 fps, 168 frames.
// World: the clip's own kit (firstFarmersShared: Page, runCamera, Germs, GroundLine) and cast
// (farmersFigures: Farmer, Goat, Cow, Longhouse), imported read-only. The wattle fence and the dung heap
// are this cut's own props, drawn here in the same engraver's hand.
//
// CHECK LINE: "packing people and their animals together in farming villages is what bred these
// diseases: the denser the village, the thicker the haze."
//
// THE LINE: "of these diseases that the farmers had created the conditions to engender"
// WORD -> FRAME: of 3 · these 24 · diseases 43 · that 64 · the 78 · farmers 87 · had 100 · created 108 ·
//   the 121 · conditions 126 · to 136 · engender 141 · (and 152, the 160: Kyle on camera).
// DURATION: the slot 9.1091 -> 14.7147 s = 5.606 s x 29.97 = 168 frames (f0..f167).
//
// THE MOTION (one move): close inside a Neolithic farming village: an orange farmer woman and her child
// and a man with a sickle, packed in beside goats and a cow behind a wattle fence, a longhouse wall behind
// them, a dung heap at their feet; the germs (the kit's Germs) already seep off the people, the animals
// and the dung. One slow eased pull-back (f0 -> ~f150, then a creep) reveals the village that was always
// there: longhouses in parallel rows terracing up the frame, more families, more penned animals, all
// packed close. Every body is a source, so the haze is thickest where the village is densest (its middle)
// and thin at its edges; by "farmers had created" the orange people fill the frame before the big house, by
// "conditions to engender" the whole village sits under one soft, slowly churning veil.
// Orange = the farmers (their coats) and their germs (ACCENT_DEEP). Architecture is the map style's own:
// dark umber planes in cream line (Longhouse tint 0). Animals cream. No text.
//
// CAMERA: runCamera keys the zoom (k, log-space pchip, damped); the vertical framing is derived from the
// zoom so the front ground line stays on screen y 1040 -> 1050 (above the first caption band) all the way.
//
// SICKLES (COMMON.md ruling): never low in front of the body. Sickle men carry it blade-up in the near hand at
// chest height (sickleUp) or hooked over the shoulder (sickleShoulder); the sheaf man's near hand is empty.
// FRAME: the pull-back stops at k 0.40 (front-row man ~200 px, child ~145). Toward the viewer, on lower ground,
// five quiet roofs (sunk 0.66 into the page, no germs) rise into the lower half as the village opens out: only
// thatch and ridge lines in the caption bands, nothing readable.
//
// GERMS (germLayers): all kit <Germs>, rates fixed per source (no mote ever jumps).
//   streams    per depth band, off every person, animal and dung heap: short-lived (130 f), thin, drawn BEHIND
//              that band's figures, so they leave the outlines and never cross a face.
//   rise       0.15x of those sources, long-lived and wide, hanging above the heads (behind its own band).
//   veil       off every roof (the people and animals inside): a flat layer drifting sideways, weighted to the
//              middle, over all the houses and under the pens and the front row; under its stipple the same
//              motes blurred and dimmed into one soft cloud (no glow).
//   microbes   legible microbes (44 px) round the pair and the child, born at head and shoulder height,
//              world-fixed so they stay at body height in the wide.
//   travellers from f40 on, single 44 px microbes leave the back of a goat or a cow in the pens and swim
//              (~34 frames) to the upper torso of the person beside it, then sink in: 7 routes.
// Legible microbes on screen: 8-9 close, 11-15 in the wide (5-7 of them travelling). Stipple on screen: ~1.9k at
// f0, ~7.4k at f167 (r2 had ~13.6k).
//
// SOURCES: none on screen (no figures, places or dates). The village is the LBK (Linearbandkeramik,
// c. 5500-5000 BC) type: timber longhouses in parallel rows, livestock kept at the houses.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  INK,
  LAND,
  Germs,
  GroundLine,
  Page,
  WorldSvg,
  mixColor,
  hash,
  ramp,
  Microbe,
  runCamera,
  type CamKey,
  type GermSource,
  type GermsProps,
  type P2,
} from "./firstFarmersShared";
import {
  Cow,
  Farmer,
  Goat,
  Longhouse,
  ANIMAL_WALK,
  GrainHeap,
  CHILD_F,
  POSES,
  TurnFarmer,
  WALK,
  animalAdvance,
  walkAdvance,
  walkLegs,
  aimTool,
  hoeLoop,
  farmAnchors,
  mirrorPose,
  idle,
  type FigPose,
} from "./farmersFigures";

export const FPS = 30000 / 1001;
export const DURATION = 168;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE WORLD (world px = screen px at f0). A ground plane seen from a little
// above: a row at depth scale s (px per figure unit) stands on y = gy(s);
// nearer rows lower and bigger, rows further back terrace up the frame.
// ---------------------------------------------------------------------------
/** the front row: a man ~470 px tall at f0 */
const S0 = 1.62;
/** the front row's ground, world y (screen y 1040 at f0) */
const Y0 = 1040;
/** the depth of the plane: the rows climb (1 - s / S0) x D above the front ground */
const D = 3000;
const gy = (s: number) => Y0 - (1 - s / S0) * D;
/** a far row sinks toward the page (0 = in play) */
const sinkOf = (s: number) => (s > S0 ? FG_SINK : 0.62 * Math.max(0, 1 - s / S0) ** 1.1);
/** the foreground roofs toward the viewer sink well into the page: quiet shapes under the captions */
const FG_SINK = 0.3;

type PersonSpec = {
  t: "p";
  s: number;
  x: number;
  pose: FigPose;
  woman?: boolean;
  child?: boolean;
  hold?: "sickle" | "hoe" | "sheaf" | "none";
  holdFar?: "sheaf" | "none";
  seed: number;
  /** life: "hoe" works the hoe (hoeLoop, an even 40-frame stroke); "cougher" is the woman of the pair (a head
   *  turn to the child, then the cough on "engender") */
  act?: "hoe" | "cougher" | "sicken" | "gather";
  /** walks (in the way it faces, feet planted) over these frames, from x, then stands */
  walk?: [number, number];
  /** "sicken": from this frame she stoops a little, a hand to her belly (after the germs reached her) */
  sickAt?: number;
  hoeDir?: 1 | -1;
  hoePhase?: number;
};
type BeastSpec = {
  t: "goat" | "cow";
  s: number;
  x: number;
  dir: 1 | -1;
  graze?: number;
  /** the head goes down to the grass over these frames (graze 0 -> 1) */
  grazeAt?: [number, number];
  /** walks (head first) over these frames, then stands */
  walk?: [number, number];
  seed: number;
};
type HouseSpec = {
  t: "house";
  s: number;
  x: number;
  len?: number;
  seed: number;
  /** a foreground roof (toward the viewer, on lower ground): ground y override, no germs, sunk quiet */
  y?: number;
  quiet?: boolean;
};
type FenceSpec = {
  t: "fence";
  s: number;
  x0: number;
  x1: number;
  seed: number;
  /** a hurdle gate hinged at x1 that swings shut toward x0 over these frames (seen side-on it widens out) */
  gate?: [number, number];
};
type DungSpec = { t: "dung"; s: number; x: number; w: number; seed: number };
type GrainSpec = { t: "grain"; s: number; x: number; w: number; seed: number };
type Item = PersonSpec | BeastSpec | HouseSpec | FenceSpec | DungSpec | GrainSpec;

const P = POSES;
// THE SICKLE (COMMON.md ruling): never held low in front of the body (at phone size the orange curve at the
// crotch reads as urination). It is carried blade-up in the near hand at chest height, or hooked over the shoulder.
const SICKLE_SHOULDER_R: FigPose = aimTool({ ...POSES.stand(1), armL: { w: [24, -216], elbow: [-0.2, 1], fist: 1, hand: 0 } }, -150);
const sickleShoulder = (dir: 1 | -1) => (dir === 1 ? SICKLE_SHOULDER_R : mirrorPose(SICKLE_SHOULDER_R));
// depth scales of the rows (front to back)
const R0 = S0; // the front: people, the dung heaps
const RF = 1.55; // the front pens' fences
const RA = 1.48; // the front pens' animals (and a herder or two among them)
const RH1 = 1.34; // the first longhouses (the one right behind the pair)
const RY1 = 1.18; // the yards behind them: people and pens in the gaps between the houses
const RH2 = 1.04;
const RH3 = 0.78;
const RY3 = 0.7;
const RH4 = 0.6;

const ITEMS: Item[] = [
  // ---- the front row: the pair and the child at the middle; more families out to the sides, thinning out
  {
    t: "p",
    s: R0,
    x: 330,
    pose: P.front(),
    child: true,
    hold: "none",
    seed: 1,
  },
  { t: "p", s: R0, x: 470, pose: P.stand(1), woman: true, seed: 2, act: "cougher" },
  // the man of the pair works his dung heap with the hoe (from f0; a dig every 40 frames, one on f90)
  { t: "p", s: R0, x: 700, pose: P.hoeShoulder(1), hold: "hoe", seed: 3, act: "hoe", hoeDir: 1, hoePhase: 0.65 },
  { t: "dung", s: R0, x: 880, w: 230, seed: 1 },
  { t: "p", s: R0, x: -170, pose: P.stand(1), woman: true, seed: 5, act: "sicken", sickAt: 100 },
  // a woman stooped over her grain heap, heaping it with her hands
  { t: "p", s: R0, x: -300, pose: P.stand(-1), woman: true, hold: "none", seed: 4, act: "gather" },
  { t: "grain", s: R0, x: -420, w: 210, seed: 3 },
  {
    t: "p",
    s: R0,
    x: -470,
    pose: P.front(),
    child: true,
    hold: "none",
    seed: 21,
  },
  {
    t: "p",
    s: R0,
    x: 1260,
    // the sheaf in the crook of his far arm; the near hand empty at his side (no sickle low in front)
    pose: P.sheaf(-1),
    hold: "none",
    holdFar: "sheaf",
    seed: 6,
  },
  {
    t: "p",
    s: R0,
    x: 1400,
    pose: P.stand(-1),
    child: true,
    hold: "none",
    seed: 7,
  },
  { t: "p", s: R0, x: 1530, pose: P.stand(-1), woman: true, seed: 8, act: "sicken", sickAt: 146 },
  // "created the conditions": people step into the gaps (the crowd packs tighter as the frame opens)
  { t: "p", s: R0, x: -40, pose: P.stand(1), woman: true, seed: 41, walk: [104, 146] },
  { t: "p", s: R0, x: 1960, pose: sickleShoulder(-1), seed: 42, walk: [108, 150] },
  { t: "dung", s: R0, x: -560, w: 200, seed: 2 },
  { t: "p", s: R0, x: -900, pose: sickleShoulder(1), seed: 9 },
  { t: "p", s: R0, x: 1980, pose: P.sheaf(-1), woman: true, hold: "none", holdFar: "sheaf", seed: 22 },
  // ---- the front pens: goats and cows behind wattle fences, beside the people
  // the two centre goats in file, both heads to the left, a clear gap between them; the first lowers its head to graze
  { t: "goat", s: RA, x: 880, dir: -1, grazeAt: [50, 74], seed: 1 },
  // the second goat closes up on the first (f108-146): the pen packs tighter
  { t: "goat", s: RA, x: 1290, dir: -1, graze: 0.25, seed: 2, walk: [108, 146] },
  { t: "p", s: RA, x: -760, pose: P.stand(-1), woman: true, seed: 23 },
  // the cow beside the child, her head and forequarters inside the f0 frame
  { t: "cow", s: RA, x: 70, dir: 1, seed: 3 },
  { t: "goat", s: RA, x: -560, dir: 1, graze: 0.7, seed: 4 },
  { t: "goat", s: RA, x: 1560, dir: -1, graze: 0.6, seed: 5 },
  { t: "cow", s: RA, x: 1800, dir: -1, graze: 0.95, seed: 6 },
  { t: "fence", s: RF, x0: 760, x1: 1380, seed: 1 },
  { t: "fence", s: RF, x0: -640, x1: 200, seed: 2 },
  { t: "fence", s: RF, x0: 1620, x1: 2000, seed: 4 },
  // the pen gate swings shut (f116-132)
  { t: "fence", s: RF, x0: 1450, x1: 1620, seed: 5, gate: [116, 132] },
  // ---- the first longhouses: one right behind the pair, the next one off to the right
  { t: "house", s: RH1, x: 560, len: 1450, seed: 1 },
  { t: "house", s: RH1, x: 3000, len: 1750, seed: 2 },
  // ---- the yards behind them, seen in the gaps between the houses
  { t: "p", s: RY1, x: -820, pose: P.stand(1), woman: true, seed: 10 },
  { t: "p", s: RY1, x: -680, pose: sickleShoulder(-1), seed: 11 },
  { t: "p", s: RY1, x: 1680, pose: P.front(), hold: "none", seed: 12 },
  {
    t: "p",
    s: RY1,
    x: 1820,
    pose: P.front(),
    child: true,
    hold: "none",
    seed: 13,
  },
  { t: "goat", s: RY1, x: 2000, dir: -1, graze: 0.4, seed: 8 },
  // ---- the rows of longhouses further back, terracing up the frame
  { t: "house", s: RH2, x: -1250, seed: 3 },
  { t: "house", s: RH2, x: 1750, seed: 4 },
  { t: "house", s: RH3, x: -150, seed: 5 },
  { t: "house", s: RH3, x: 2300, seed: 6 },
  { t: "house", s: RH3, x: -2350, seed: 9 },
  { t: "p", s: RY3, x: 930, pose: P.stand(1), woman: true, seed: 17 },
  { t: "p", s: RY3, x: 1060, pose: P.front(), child: true, hold: "none", seed: 18 },
  { t: "goat", s: RY3, x: 1210, dir: -1, seed: 10 },
  { t: "house", s: RH4, x: 1150, seed: 7 },
  { t: "house", s: RH4, x: -1150, seed: 8 },
  // ---- toward the viewer, on lower ground: the roofs of the nearest longhouses, only their thatch in frame
  // (ridges below the f0 frame; they rise into the lower half as the village opens out). Quiet: no germs, sunk.
  { t: "house", s: 1.8, x: 1750, len: 1150, y: 1560 + 930 * 1.8, quiet: true, seed: 14 },
  { t: "house", s: 1.8, x: -900, len: 1000, y: 1600 + 930 * 1.8, quiet: true, seed: 15 },
  { t: "house", s: 2.05, x: -420, len: 1300, y: 2090 + 930 * 2.05, quiet: true, seed: 11 },
  { t: "house", s: 2.05, x: 2050, len: 1200, y: 2150 + 930 * 2.05, quiet: true, seed: 12 },
  { t: "house", s: 2.6, x: 820, len: 1500, y: 2700 + 930 * 2.6, quiet: true, seed: 13 },
];

// ---- THE NEAR STRIP: the village goes on toward us below the captions. Close, cropped by the frame bottom: a
// pen rail, a goat's back, two farmers seen from the chest up, in frame from f0. They sit on their own parallax
// plane (nearCam): as the village pulls back they barely shrink and drift sideways, their heads staying at screen
// y ~1510-1550 (below the second caption band) the whole way.
const NEAR_Y = 3550;
const NEAR_S = 4.0;
const NEAR_MAN = { x: -150, pose: POSES.hoeShoulder(1) };
const NEAR_WOMAN = { x: 1250, pose: POSES.stand(-1) };
const nearCam = (k: number) => {
  const u = (1 - k) / (1 - K_END);
  const kn = 0.46 - 0.03 * u;
  return { x: 540 + 150 * u, y: NEAR_Y - (2080 - 960) / kn, k: kn };
};
/** the near goat shifts a few steps to the left (f96-120) */
const NEAR_GOAT_S = 3.3;
const NEAR_GOAT_WALK: [number, number] = [96, 120];
const nearGoatX = (f: number) => 560 - walkDist(f, NEAR_GOAT_WALK, animalAdvance("goat", NEAR_GOAT_S));
/** the near man turns his head toward the goat (f56-74) and back (f122-140) */
const nearManPose = (f: number): FigPose => {
  const look = smoother((f - 56) / 18) - smoother((f - 122) / 18);
  const q = NEAR_MAN.pose;
  return { ...q, headYaw: q.headYaw + (0.3 - q.headYaw) * look };
};
const nearChestAt = (who: "man" | "woman", f: number): P2 => {
  const A = who === "man" ? farmAnchors("farmer", nearManPose(f), [NEAR_MAN.x, NEAR_Y], NEAR_S) : farmAnchors("farmer", NEAR_WOMAN.pose, [NEAR_WOMAN.x, NEAR_Y + 40], NEAR_S, true);
  return [A.chest[0] + (who === "man" ? 22 : -10) * NEAR_S, A.chest[1] + (who === "man" ? -8 : 10) * NEAR_S];
};
/** the near germs: two coccus chains come up off the near goat's back and land on the man (by "farmers", f87)
 *  and on the woman (by "engender", f141); full opacity, revealed as they leave the goat */
const NEAR_GERMS = [
  { t0: 62, td: 72, ta: 87, hover: [-160, -230] as P2, who: "man" as const, n: 3, seed: 61 },
  { t0: 122, td: 130, ta: 141, hover: [200, -240] as P2, who: "woman" as const, n: 4, seed: 62 },
];
const nearGermAt = (g: (typeof NEAR_GERMS)[number], f: number, kn: number): (GState & { behind: boolean }) | null => {
  if (f < g.t0) return null;
  const L = 120 / kn;
  const back: P2 = [nearGoatX(g.t0) + 10 * NEAR_GOAT_S, 3360 - 128 * NEAR_GOAT_S];
  const hov: P2 = [back[0] + g.hover[0], back[1] + g.hover[1]];
  const up = -90 + 12 * Math.sin(f * 0.07 + g.seed);
  if (f < g.td) {
    const u = smoother((f - g.t0) / (g.td - g.t0));
    const s0: P2 = [back[0], back[1] + 0.35 * L];
    return { at: [s0[0] + (hov[0] - s0[0]) * u, s0[1] + (hov[1] - s0[1]) * u], angle: up, len: L, alpha: 1, wave: f * 0.42 + g.seed, behind: u < 0.45 };
  }
  const arc = arcOf(hov, nearChestAt(g.who, g.ta));
  if (f < g.ta) {
    const u = smoother((f - g.td) / (g.ta - g.td));
    return { at: arc.at(u), angle: up + angDiff(up, arc.tan(u)) * smoother((f - g.td) / 5), len: L * (1 - (1 - CLING) * u), alpha: 1, wave: f * 0.42 + g.seed, behind: false };
  }
  const e = arc.tan(1);
  return { ...clingState(nearChestAt(g.who, f), e + angDiff(e, flatOf(e, g.seed)) * smoother((f - g.ta) / 10), f, g.ta, g.seed, L * CLING), behind: false };
};
const NearGerms: React.FC<{ f: number; kn: number; behind: boolean }> = ({ f, kn, behind }) => {
  const list = NEAR_GERMS.map((g) => ({ g, st: nearGermAt(g, f, kn) })).filter((q) => q.st && q.st.behind === behind);
  if (!list.length) return null;
  return (
    <g filter="url(#germRimN)">
      {list.map(({ g, st }) => (st ? <Microbe key={g.seed} at={st.at} len={st.len} angle={st.angle} kind="cocci" n={g.n} wave={st.wave} /> : null))}
    </g>
  );
};
const NearStrip: React.FC<{ f: number; kn: number }> = ({ f, kn }) => {
  const wa = Math.max(0, Math.min(1, (f - NEAR_GOAT_WALK[0]) / 6, (NEAR_GOAT_WALK[1] - f) / 6));
  return (
    <g>
      <WattleFence x0={-1500} x1={2600} y={3150} s={3.2} seed={7} />
      <NearGerms f={f} kn={kn} behind />
      <Goat at={[nearGoatX(f), 3360]} scale={NEAR_GOAT_S} dir={-1} g={f + 11} walk={walkDist(f, NEAR_GOAT_WALK, animalAdvance("goat", NEAR_GOAT_S)) / (2 * ANIMAL_WALK.stride.goat * NEAR_GOAT_S)} walkAmount={wa} graze={(0.15 + 0.15 * Math.sin(f / 23)) * (1 - wa) + 0.5 * smoother((f - 128) / 16)} seed={3} uid="nearGoat" />
      <TurnFarmer pose={idle(nearManPose(f), f, 31)} at={[NEAR_MAN.x, NEAR_Y]} scale={NEAR_S} uid="nearMan" hold="hoe" seed={31} />
      <Farmer pose={idle(NEAR_WOMAN.pose, f, 32)} at={[NEAR_WOMAN.x, NEAR_Y + 40]} scale={NEAR_S} uid="nearWoman" woman seed={32} />
      <NearGerms f={f} kn={kn} behind={false} />
    </g>
  );
};

// far to near (painter's order); items of one depth keep their listed order
const BANDS: { s: number; items: Item[] }[] = (() => {
  const ss = [...new Set(ITEMS.map((it) => it.s))].sort((a, b) => a - b);
  return ss.map((s) => ({ s, items: ITEMS.filter((it) => it.s === s) }));
})();

// ---------------------------------------------------------------------------
// THE GERMS: every person, animal, dung heap and house is a source. Rates and
// distances scale with depth (a far source is smaller on screen). World-fixed:
// the pull-back itself packs the clouds together into one haze.
// ---------------------------------------------------------------------------
/** a body's germs: short-lived streams, so they stay thin round their sources and do not pile into a swarm */
const LIFE = 130;
/** the village is most crowded round its middle: the sources there breed a little more (and the layout packs them closer) */
const crowd = (x: number) => 0.3 + 0.9 * Math.exp(-(((x - 540) / 1300) ** 2));
/** the veil over the roofs: thickest over the middle, thinning to nothing at the village's edges */
const veil = (x: number) => Math.exp(-(((x - 540) / 1150) ** 2));
const sourcesOf = (it: Item, front: boolean): GermSource[] => {
  const y = gy(it.s);
  const q = (it.s / S0) * crowd(it.t === "fence" ? (it.x0 + it.x1) / 2 : it.x);
  // every body sheds from its own onset (nothing in the air on frame 0)
  const from = onsetOf(it);
  if (it.t === "p") {
    const g = farmAnchors(
      "farmer",
      it.pose,
      [it.x, y],
      it.s,
      it.woman,
      it.child,
    ).germ;
    return [{ ...g, rate: (front ? 1.8 : 0.6) * q, from }];
  }
  if (it.t === "goat")
    return [
      {
        at: [it.x - it.dir * 4 * it.s, y - 100 * it.s],
        rx: 92 * it.s,
        ry: 54 * it.s,
        rate: (front ? 1.8 : 1.0) * q,
        from,
      },
    ];
  if (it.t === "cow")
    return [
      {
        at: [it.x, y - 160 * it.s],
        rx: 168 * it.s,
        ry: 84 * it.s,
        rate: 1.4 * q,
        from,
      },
    ];
  if (it.t === "dung")
    return [
      {
        at: [it.x, y - 28 * it.s],
        rx: (it.w / 2) * it.s * 0.8,
        ry: 34 * it.s,
        rate: 3.0 * q,
        from,
      },
    ];
  if (it.t === "house") {
    if (it.quiet) return [];
    // the people and the animals inside: the germs seep out along the roof and hang over it in a flat layer
    const L = (it.len ?? 1900) / 2;
    return Array.from({ length: 5 }, (_, j) => {
      const x = it.x + (j / 4 - 0.5) * 1.5 * L * it.s;
      return { at: [x, y - 760 * it.s] as P2, rx: L * 0.34 * it.s, ry: 90 * it.s, rate: 0.5 * (it.s / S0) * veil(x) };
    }).filter((g) => g.rate > 0.03);
  }
  return [];
};
const itemAt = (t: Item["t"], s: number, x: number) => {
  const it = ITEMS.find((q) => q.t === t && q.s === s && "x" in q && q.x === x);
  if (!it) throw new Error(`BredInTheVillageV2: no ${t} at ${s} / ${x}`);
  return it;
};

// ---------------------------------------------------------------------------
// THE LEGIBLE GERMS (V2): a few large engraved microbes (the kit's Microbe: bacilli with flagella, coccus chains)
// with a dark casing and a thin cream rim, each one an authored agent with a visible cause and a path:
//   it comes OUT of a source (the dung heap's top, an animal's back, a house door) on its birth frame, rises
//   and hovers, then swims along an arc (heading along its path) to a person, where it clings to the coat and
//   wriggles for the rest of the cut, or to another house, which it goes into.
//   A (f24-43)  "these ... diseases": six rise off the dung heap, the goat and the cow (the first burst on f43)
//   B (f56-98)  "farmers": they leave and land on the pair, the child, the man, the woman at the left, the sheaf man
//   C (f96-152) "created ... conditions": in the revealed village, animal to person and house to house
// Size in SCREEN px (len): 150 close, 100 in the wide; a clinging one 0.55 of that, on the chest (never the face).
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// THE WOMAN OF THE PAIR: she turns her head to the child (f48-68), back to the man (f108-124), and on "engender"
// (f141) she coughs: the near hand comes up to her mouth (f130-139), two small jerks of the head and shoulders.
// ---------------------------------------------------------------------------
const W_BASE = POSES.stand(1);
const smoother = (u: number) => {
  const t = Math.max(0, Math.min(1, u));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const cougherPose = (f: number): FigPose => {
  const look = smoother((f - 48) / 20) - smoother((f - 108) / 16);
  const hand = smoother((f - 130) / 9);
  const jerk = (f0: number) => (f < f0 ? 0 : f < f0 + 3 ? (f - f0) / 3 : Math.max(0, 1 - (f - f0 - 3) / 7));
  const j = jerk(141) + 0.7 * jerk(149);
  const w: P2 = [W_BASE.armL.w[0] + (30 - W_BASE.armL.w[0]) * hand, W_BASE.armL.w[1] + (-250 - W_BASE.armL.w[1]) * hand];
  return {
    ...W_BASE,
    headYaw: W_BASE.headYaw + (0.32 - W_BASE.headYaw) * look,
    lean: W_BASE.lean + 9 * j + 3 * hand,
    pitch: W_BASE.pitch + 7 * j,
    armL: { ...W_BASE.armL, w, elbow: [-0.6 + 0.2 * hand, 1], fist: 0.3 + 0.6 * hand },
  };
};

// ---------------------------------------------------------------------------
// WALKING: constant pace with a 6-frame start and stop; the legs' phase follows the distance, so no foot slides
// ---------------------------------------------------------------------------
const walkDist = (f: number, w: [number, number], speed: number) => {
  const [a, b] = w;
  const r = 6;
  const v = (t: number) => Math.max(0, Math.min(1, (t - a) / r, (b - t) / r));
  // integrate the trapezoid speed profile to frame f
  let d = 0;
  for (let t = a; t < Math.min(f, b); t++) d += speed * 0.5 * (v(t) + v(t + 1));
  return d;
};
const facing = (q: FigPose): 1 | -1 => (Math.sin(q.yaw) >= 0 ? 1 : -1);
/** where a person stands on frame f (a walker moves) */
const personX = (it: PersonSpec, f: number) => (it.walk ? it.x + facing(it.pose) * walkDist(f, it.walk, walkAdvance(it.s, it.child)) : it.x);
const beastX = (it: BeastSpec, f: number) => (it.walk ? it.x + it.dir * walkDist(f, it.walk, animalAdvance(it.t, it.s)) : it.x);
/** a person's pose on frame f (without the idle) */
const personPose = (it: PersonSpec, f: number): FigPose => {
  if (it.act === "hoe") return hoeLoop(it.hoeDir ?? 1, f / 40 + (it.hoePhase ?? 0));
  if (it.act === "sicken") return sickPose(facing(it.pose), smoother((f - (it.sickAt ?? 0)) / 16) * (0.85 + 0.15 * Math.sin(f * 0.21)));
  if (it.act === "cougher") return cougherPose(f);
  // stooped over the heap, the hands working it (the harvest loop, slow, nothing in the hands)
  if (it.act === "gather") return POSES.harvest(facing(it.pose), f / 52);
  if (it.walk) {
    const d = walkDist(f, it.walk, walkAdvance(it.s, it.child));
    const amt = Math.max(0, Math.min(1, (f - it.walk[0]) / 6, (it.walk[1] - f) / 6));
    return walkLegs(it.pose, d / (2 * WALK.stride * it.s * (it.child ? CHILD_F : 1)), amt);
  }
  return it.pose;
};

/** an infected farmer's reaction: a little stoop, the near hand to the belly (u 0..1) */
const SICK_R = (u: number): FigPose => {
  const b = POSES.stand(1);
  return { ...b, lean: b.lean + 12 * u, crouch: b.crouch + 7 * u, pitch: b.pitch + 6 * u, brow: 0.6 * u, armL: { ...b.armL, w: [b.armL.w[0] + (24 - b.armL.w[0]) * u, b.armL.w[1] + (-176 - b.armL.w[1]) * u], elbow: [-0.6 + 0.3 * u, 1], fist: 0.3 + 0.4 * u } };
};
const sickPose = (dir: 1 | -1, u: number) => (dir === 1 ? SICK_R(u) : mirrorPose(SICK_R(u)));

type End = { kind: "person"; s: number; x: number; off: P2 } | { kind: "door"; s: number; x: number } | { kind: "pt"; at: P2 };
type Agent = { off?: boolean; from: [Item["t"], number, number]; fromPt?: P2; burst?: boolean; t0: number; rise?: number; hover: P2; td: number; ta: number; to: End; kind: "rod" | "cocci"; n: number; seed: number };
/** where a germ leaves a body: the dung heap's top, an animal's back, a longhouse's door */
const outOf = (t: Item["t"], s: number, x: number): P2 => {
  const it = itemAt(t, s, x);
  const y = gy(it.s);
  // off the dung heap: its top, toward its far side (clear of the man standing at its edge); coccus chains
  if (it.t === "dung") return [it.x + 0.18 * it.w * it.s, y - 0.3 * it.w * it.s];
  if (it.t === "goat") return [it.x - it.dir * 10 * it.s, y - 128 * it.s];
  if (it.t === "cow") return [it.x - it.dir * 20 * it.s, y - 226 * it.s];
  if (it.t === "house") return [it.x - ((it.len ?? 1900) / 2) * 0.12 * it.s, y - 140 * it.s];
  throw new Error("BredInTheVillageV2: no germ source " + t);
};
/** where a germ ends on frame f: a door, a point, or a person's chest (a walker or the hoer is followed) */
const endAt = (e: End, f: number): P2 => {
  if (e.kind === "pt") return e.at;
  if (e.kind === "door") return outOf("house", e.s, e.x);
  const it = itemAt("p", e.s, e.x) as PersonSpec;
  const moving = it.walk || it.act === "hoe";
  const A = farmAnchors("farmer", moving ? personPose(it, f) : it.pose, [moving ? personX(it, f) : it.x, gy(it.s)], it.s, it.woman, it.child);
  // the chest, below the face and above the belt (offsets in figure units)
  return [A.chest[0] + e.off[0] * it.s, A.chest[1] + (e.off[1] + 6) * it.s];
};
const endPoint = (e: End): P2 => endAt(e, 0);
/** a person who moves (the hoer, a walker): germs on them follow their chest every frame */
const isMoving = (e: End) => e.kind === "person" && (() => {
  const it = itemAt("p", e.s, e.x) as PersonSpec;
  return !!(it.walk || it.act === "hoe");
})();
const pers = (s: number, x: number, off: P2 = [0, 0]): End => ({ kind: "person", s, x, off });
const door = (s: number, x: number): End => ({ kind: "door", s, x });
const AGENTS: Agent[] = [
  // A -> B: out of the dung heap (the first one stirs at its surface from "of", f3), the goat and the cow, then
  // onto the people of the opening
  { from: ["dung", R0, 880], t0: 3, rise: 36, hover: [60, -300], td: 58, ta: 84, to: pers(R0, 470, [-10, -2]), kind: "cocci", n: 3, seed: 1 },
  { from: ["cow", RA, 70], t0: 24, hover: [170, -70], td: 60, ta: 86, to: pers(R0, 330, [0, 12]), kind: "rod", n: 2, seed: 2 },
  { from: ["goat", RA, 880], t0: 26, hover: [-40, -150], td: 55, ta: 80, to: pers(R0, 330, [10, 4]), kind: "cocci", n: 4, seed: 3 },
  { from: ["dung", R0, 880], t0: 28, hover: [170, -430], td: 62, ta: 90, to: pers(R0, 470, [-6, 10]), kind: "cocci", n: 3, seed: 4 },
  { from: ["cow", RA, 70], t0: 31, hover: [-190, -60], td: 64, ta: 92, to: pers(R0, -170, [0, 10]), kind: "rod", n: 3, seed: 5 },
  { from: ["goat", RA, 880], t0: 34, hover: [70, -200], td: 70, ta: 98, to: pers(R0, 1260, [-6, 14]), kind: "cocci", n: 3, seed: 6 },
  // C: the revealed village
  { from: ["goat", RA, 1290], t0: 96, hover: [20, -120], td: 104, ta: 128, to: pers(R0, 1400, [0, 10]), kind: "cocci", n: 4, seed: 7 },
  { from: ["house", RH1, 560], t0: 100, hover: [60, -60], td: 106, ta: 136, to: door(RH2, 1750), kind: "rod", n: 3, seed: 8 },
  { from: ["goat", RA, -560], t0: 102, hover: [10, -120], td: 110, ta: 132, to: pers(R0, -170, [4, 20]), kind: "cocci", n: 3, seed: 9 },
  { off: true, from: ["house", RH2, -1250], t0: 106, hover: [80, -60], td: 112, ta: 140, to: pers(RY1, -680, [0, 10]), kind: "rod", n: 3, seed: 10 },
  { from: ["goat", RA, 1560], t0: 112, hover: [-20, -120], td: 118, ta: 138, to: pers(R0, 1530, [0, 12]), kind: "rod", n: 2, seed: 11 },
  { from: ["goat", RY3, 1210], t0: 110, hover: [-20, -110], td: 116, ta: 136, to: pers(RY3, 1060, [0, 12]), kind: "cocci", n: 3, seed: 12 },
  { from: ["dung", R0, -560], t0: 116, hover: [20, -130], td: 122, ta: 144, to: pers(R0, -470, [0, 8]), kind: "cocci", n: 4, seed: 13 },
  { off: true, from: ["house", RH3, -150], t0: 120, hover: [60, -50], td: 126, ta: 154, to: door(RH2, -1250), kind: "rod", n: 3, seed: 14 },
  { from: ["house", RH1, 560], t0: 124, hover: [-60, -70], td: 130, ta: 156, to: pers(RY3, 930, [0, 10]), kind: "rod", n: 2, seed: 15 },
  // "farmers had": his own work feeds it. On his dig at f90 a rod comes up off the hoe blade in the dung, runs up
  // the haft past his hand and onto his chest (it rides with him from then on)
  { from: ["dung", R0, 880], fromPt: [700 + 75 * R0, Y0 - 80 * R0], t0: 90, rise: 8, hover: [-6, -96], td: 98, ta: 110, to: pers(R0, 700, [-4, 0]), kind: "cocci", n: 3, seed: 16 },
  // "engender": one germ comes up out of his dung heap to the middle of the frame above the crowd, and divides
  // 1 -> 2 -> 4 -> 8 (f141-153); the eight spread onto the nearest people (see BURST)
  { from: ["dung", R0, 880], t0: 124, rise: 16, hover: [-388, -540], td: 141, ta: 141, to: { kind: "pt", at: [560, 380] }, kind: "rod", n: 3, seed: 17, burst: true },
];
/** the frame each person is first reached (they shed germs of their own from then on) */
const INFECTED = new Map<string, number>();
AGENTS.forEach((g) => {
  if (g.to.kind !== "person") return;
  const key = `${g.to.s}/${g.to.x}`;
  INFECTED.set(key, Math.min(INFECTED.get(key) ?? 1e9, g.ta));
});
/** a germ's screen length at zoom k (airborne); a clinging one is CLING of that */
const germPx = (k: number) => 115 + 35 * Math.max(0, Math.min(1, (k - K_END) / (1 - K_END)));
const CLING = 0.66;
const angDiff = (a: number, b: number) => ((((b - a + 180) % 360) + 360) % 360) - 180;
type Arc = { at: (u: number) => P2; tan: (u: number) => number };
const arcOf = (h0: P2, dst: P2): Arc => {
  const dist = Math.hypot(dst[0] - h0[0], dst[1] - h0[1]);
  const c: P2 = [(h0[0] + dst[0]) / 2, Math.min(h0[1], dst[1]) - 0.28 * dist];
  return {
    at: (u) => [(1 - u) ** 2 * h0[0] + 2 * u * (1 - u) * c[0] + u * u * dst[0], (1 - u) ** 2 * h0[1] + 2 * u * (1 - u) * c[1] + u * u * dst[1]],
    tan: (u) => (Math.atan2(2 * (1 - u) * (c[1] - h0[1]) + 2 * u * (dst[1] - c[1]), 2 * (1 - u) * (c[0] - h0[0]) + 2 * u * (dst[0] - c[0])) * 180) / Math.PI,
  };
};
/** a clinging germ lies across the chest (never hanging down the body), flagella out to the side */
const flatOf = (a: number, seed = 0) => {
  const tilt = 8 + 16 * hash(seed, 77);
  return Math.abs(angDiff(a, 0)) < 90 ? tilt * (hash(seed, 78) < 0.5 ? 1 : -1) : 180 - tilt * (hash(seed, 79) < 0.5 ? 1 : -1);
};
const wob = (ff: number, amp: number, seed: number): P2 => [amp * Math.sin(ff * 0.11 + seed * 1.7), amp * 0.7 * Math.sin(ff * 0.083 + seed * 2.9)];
type GState = { at: P2; angle: number; len: number; alpha: number; wave: number };
/** the wriggle of a clinging germ: a visible sway of the body and a quick flagella beat */
const clingState = (at: P2, ang: number, f: number, t: number, seed: number, len: number): GState => ({
  at: [at[0] + 0.05 * len * Math.sin(f * 0.21 + seed), at[1] + 0.04 * len * Math.sin(f * 0.17 + seed * 2)],
  angle: ang + 14 * Math.sin((f - t) * 0.19 + seed),
  len,
  alpha: 1,
  wave: f * 0.55 + seed,
});
const AGENT_DATA = AGENTS.map((g) => {
  const src = g.fromPt ?? outOf(...g.from);
  const hov: P2 = [src[0] + g.hover[0], src[1] + g.hover[1]];
  const dst = endPoint(g.to);
  return { src, hov, dst };
});
/** a root germ: out of its source at FULL opacity (revealed by leaving it: it starts with its body inside the
 *  source and is drawn behind it until it departs), up to its hover point, along an arc to its end */
export const agentAt = (gi: number, f: number, k: number): GState | null => {
  const g = AGENTS[gi];
  if (g.off || f < g.t0) return null;
  const { src, hov, dst } = AGENT_DATA[gi];
  const L = germPx(k) / k;
  const rise = g.rise ?? 18;
  const th = Math.min(g.t0 + rise, g.td);
  const up = -90 + 14 * Math.sin(f * 0.07 + g.seed);
  // the departure point is fixed in the world (the wobble's size taken at the departure frame's zoom)
  const kd = camAt(g.td).k;
  const h0w = wob(g.td, (0.35 * germPx(kd)) / kd, g.seed);
  const dstNow = isMoving(g.to) ? endAt(g.to, Math.min(f, g.ta + 400)) : dst;
  const arc = arcOf([hov[0] + h0w[0], hov[1] + h0w[1]], isMoving(g.to) ? endAt(g.to, g.ta) : dst);
  if (g.burst && f >= g.td) return null;
  if (f < g.td) {
    const u = smoother((f - g.t0) / (th - g.t0));
    const w = wob(f, 0.35 * L * u, g.seed);
    // from inside the source up to the hover point: a coccus chain stands up out of it; a rod starts lying along
    // the animal's back (its flagella inside the body) and turns head-up as it lifts out
    const rod = g.kind === "rod";
    const s0: P2 = [src[0], src[1] + (rod ? 0.3 : 0.35) * L];
    const lie = g.hover[0] >= 0 ? 0 : 180;
    // (the turn waits until the body is out of the source)
    // (a rod stays lying flat as it lifts off the back: it never stands up like an antenna)
    const a0 = rod ? lie : up;
    return { at: [s0[0] + (hov[0] - s0[0]) * u + w[0], s0[1] + (hov[1] - s0[1]) * u + w[1]], angle: a0 + angDiff(a0, arc.tan(0)) * smoother((f - (g.td - 8)) / 8), len: L, alpha: 1, wave: f * 0.42 + g.seed };
  }
  if (f < g.ta) {
    const u = smoother((f - g.td) / (g.ta - g.td));
    const p0 = arc.at(u);
    const live = isMoving(g.to) ? endAt(g.to, f) : dst;
    const fix = isMoving(g.to) ? u * u : 0;
    const p1 = isMoving(g.to) ? endAt(g.to, g.ta) : dst;
    return { at: [p0[0] + (live[0] - p1[0]) * fix, p0[1] + (live[1] - p1[1]) * fix], angle: arc.tan(u), len: L * (1 - (1 - CLING) * smoother((f - g.ta + 8) / 8)), alpha: 1, wave: f * 0.42 + g.seed };
  }
  if (g.to.kind === "door") {
    // it goes in at the door
    const u = smoother((f - g.ta) / 8);
    if (u >= 1) return null;
    return { at: dst, angle: arc.tan(1), len: L * CLING * (1 - 0.4 * u), alpha: 1 - u, wave: f * 0.42 + g.seed };
  }
  const endAng = arc.tan(1);
  const st = clingState(dstNow, endAng + angDiff(endAng, flatOf(endAng, g.seed)) * smoother((f - g.ta) / 12), f, g.ta, g.seed, L * CLING);
  return st;
};

// ---------------------------------------------------------------------------
// MULTIPLYING (f104-167): a clinging germ divides in two (binary fission: the body lengthens, pinches at the
// middle and parts into two halves that grow back), and one daughter often hops on, to the next person or into
// a house; daughters divide again. The load on screen grows as the frame widens.
// ---------------------------------------------------------------------------
type Hop = { td: number; ta: number; to: End };
type Split = { id: string; at: number; hop?: Hop };
/** [parent id, split frame, the second daughter's hop (or none: both stay)] ; roots are r0..r14, daughters <id>a / <id>b */
const SPLITS: Split[] = [
  { id: "r2", at: 104, hop: { td: 112, ta: 136, to: door(RH1, 560) } },
  { id: "r0", at: 108, hop: { td: 116, ta: 136, to: pers(R0, 330, [-8, -4]) } },
  { id: "r5", at: 112, hop: { td: 120, ta: 140, to: pers(R0, 1400, [6, -2]) } },
  { id: "r3", at: 120, hop: { td: 128, ta: 150, to: pers(RY1, -680, [8, -6]) } },
];
type GNode = { id: string; kind: "rod" | "cocci"; n: number; seed: number; parent?: string; side: 1 | -1; t0: number; hop?: Hop; split?: number; root?: number };
const NODES = new Map<string, GNode>();
AGENTS.forEach((g, i) => NODES.set(`r${i}`, { id: `r${i}`, kind: g.kind, n: g.n, seed: g.seed, side: 1, t0: g.t0, root: i }));
SPLITS.forEach((sp) => {
  const pa = NODES.get(sp.id);
  if (!pa) throw new Error(`BredInTheVillageV2: no germ ${sp.id} to split`);
  if (pa.root !== undefined && AGENTS[pa.root].to.kind === "door") throw new Error("a germ inside a house cannot split");
  pa.split = sp.at;
  ([-1, 1] as const).forEach((side, j) => {
    const id = `${sp.id}${j === 0 ? "a" : "b"}`;
    NODES.set(id, { id, kind: pa.kind, n: pa.kind === "cocci" ? Math.max(2, pa.n - (j === 0 ? 1 : 0)) : pa.n, seed: pa.seed * 3.7 + j * 1.3 + 0.5, parent: sp.id, side, t0: sp.at, hop: j === 1 ? sp.hop : undefined });
  });
});
const DIVIDE = 12;
/** where a node clings, its angle there, and its clinging length (world) at its split frame */
const restCache = new Map<string, { at: P2; ang: number }>();
const restOf = (id: string): { at: P2; ang: number } => {
  const hit = restCache.get(id);
  if (hit) return hit;
  const nd = NODES.get(id) as GNode;
  let out: { at: P2; ang: number };
  if (nd.root !== undefined) {
    const { hov, dst } = AGENT_DATA[nd.root];
    const g = AGENTS[nd.root];
    const k0 = camAt(g.td).k;
    const w = wob(g.td, (0.35 * germPx(k0)) / k0, g.seed);
    out = { at: dst, ang: flatOf(arcOf([hov[0] + w[0], hov[1] + w[1]], dst).tan(1), g.seed) };
  } else if (nd.hop) {
    const born = birthRest(nd);
    const dst = endPoint(nd.hop.to);
    out = { at: dst, ang: flatOf(arcOf(born.at, dst).tan(1), nd.seed) };
  } else out = birthRest(nd);
  restCache.set(id, out);
  return out;
};
/** a daughter's place right after the division: beside its sister along the parent's axis */
const birthRest = (nd: GNode): { at: P2; ang: number } => {
  const pr = restOf(nd.parent as string);
  const k0 = camAt(nd.t0).k;
  const Ls = (germPx(k0) * CLING) / k0;
  const a = (pr.ang * Math.PI) / 180;
  // along the parent's axis, and stepped a little across it, so a family does not line up into a band
  // the second daughter steps down the body (toward the belly side of the chest, never up to the face)
  const down = nd.side > 0 ? 0.3 * Ls : 0;
  return { at: [pr.at[0] + Math.cos(a) * nd.side * 0.47 * Ls, pr.at[1] + Math.sin(a) * nd.side * 0.47 * Ls + down], ang: pr.ang + nd.side * 10 };
};
export const nodeAt = (id: string, f: number, k: number): GState | null => {
  const nd = NODES.get(id) as GNode;
  if (nd.split !== undefined && f >= nd.split) return null;
  if (nd.root !== undefined) return agentAt(nd.root, f, k);
  if (f < nd.t0) return null;
  const Lc = (germPx(k) * CLING) / k;
  const pr = restOf(nd.parent as string);
  const a = (pr.ang * Math.PI) / 180;
  if (f < nd.t0 + DIVIDE) {
    // the division: two halves, overlapping as one long pinched body at u 0, parting along the axis
    const u = smoother((f - nd.t0) / DIVIDE);
    const k0 = camAt(nd.t0).k;
    const Ls = (germPx(k0) * CLING) / k0;
    const off = (0.24 + 0.23 * u) * Ls * nd.side;
    return { at: [pr.at[0] + Math.cos(a) * off, pr.at[1] + Math.sin(a) * off], angle: pr.ang + 6 * Math.sin(f * 0.19), len: Ls * (0.56 + 0.1 * u), alpha: 1, wave: f * 0.55 + nd.seed };
  }
  const grow = 0.66 + 0.34 * smoother((f - nd.t0 - DIVIDE) / 14);
  const born = birthRest(nd);
  if (!nd.hop || f < nd.hop.td) return clingState(born.at, born.ang, f, nd.t0, nd.seed, Lc * grow);
  const dst = endPoint(nd.hop.to);
  const arc = arcOf(born.at, dst);
  if (f < nd.hop.ta) {
    const u = smoother((f - nd.hop.td) / (nd.hop.ta - nd.hop.td));
    const lift = Math.sin(Math.PI * u);
    const turn = smoother((f - nd.hop.td) / 6);
    return { at: arc.at(u), angle: born.ang + angDiff(born.ang, arc.tan(u)) * turn, len: Lc * grow * (1 + 0.35 * lift), alpha: 1, wave: f * 0.45 + nd.seed };
  }
  if (nd.hop.to.kind === "door") {
    const u = smoother((f - nd.hop.ta) / 8);
    if (u >= 1) return null;
    return { at: dst, angle: arc.tan(1), len: Lc * (1 - 0.4 * u), alpha: 1 - u, wave: f * 0.45 + nd.seed };
  }
  const endAng = arc.tan(1);
  return clingState(dst, endAng + angDiff(endAng, flatOf(endAng, nd.seed)) * smoother((f - nd.hop.ta) / 12), f, nd.hop.ta, nd.seed, Lc * grow);
};
// ---------------------------------------------------------------------------
// THE BURST ("engender", f141-166): the germ from the dung heap hangs at the middle of the frame above the crowd
// and divides three times, 4 frames each (1 -> 2 -> 4 -> 8: each body lengthens along its axis, pinches and parts;
// the axes turn 0 -> 60 -> 120 deg between divisions), then the eight spread out onto the eight nearest people.
// ---------------------------------------------------------------------------
const BURST_ROOT = AGENTS.findIndex((g) => g.burst);
const BURST_AT = [141, 145, 149];
const BURST_AXES = [0, 60, 120, 150];
const BURST_C: P2 = [560, 380];
const BURST_SPREAD = 153;
// the eight go to the people not yet carrying one (left to right)
const BURST_TO: End[] = [pers(R0, -900, [4, 0]), pers(RY1, -820, [-6, 4]), pers(R0, -300, [6, 0]), pers(R0, -40, [-4, -2]), pers(RY1, 1680, [8, 2]), pers(RY1, 1820, [4, 2]), pers(R0, 1960, [-4, 0]), pers(R0, 1980, [6, 4])];
const leafOff = (bits: number, f: number, L0: number): { at: P2; depth: number; ang: number; len: number } => {
  let x = BURST_C[0];
  let y = BURST_C[1];
  let depth = 0;
  const offs = [0.46, 0.4, 0.32];
  const lens = [1, 0.74, 0.58, 0.48];
  for (let j = 0; j < 3; j++) {
    if (f < BURST_AT[j]) break;
    depth = j + 1;
    const u = smoother((f - BURST_AT[j]) / 4);
    const side = (bits >> j) & 1 ? 1 : -1;
    const a = (BURST_AXES[j] * Math.PI) / 180;
    const o = offs[j] * L0 * (0.5 + 0.5 * u) * side;
    x += Math.cos(a) * o;
    y += Math.sin(a) * o;
  }
  const last = depth === 0 ? -100 : BURST_AT[depth - 1];
  const ang = BURST_AXES[depth === 0 ? 0 : depth - 1] + (BURST_AXES[depth] - BURST_AXES[depth === 0 ? 0 : depth - 1]) * smoother((f - last - 2) / 3);
  return { at: [x, y], depth, ang: depth === 0 ? BURST_AXES[0] : ang, len: lens[depth] * L0 };
};
/** the burst's glyphs on frame f: 2^depth of them, then the eight on their way and clinging */
const burstOn = (f: number, k: number): { nd: GNode; st: GState }[] => {
  if (BURST_ROOT < 0 || f < BURST_AT[0]) return [];
  const kb = camAt(BURST_AT[0]).k;
  const L0 = (1.4 * germPx(kb)) / kb;
  const out: { nd: GNode; st: GState }[] = [];
  const glyph = (id: string, st: GState, seed: number) => out.push({ nd: { id, kind: "rod", n: 2, seed, side: 1, t0: BURST_AT[0] }, st });
  if (f < BURST_SPREAD) {
    const depth = f >= BURST_AT[2] ? 3 : f >= BURST_AT[1] ? 2 : 1;
    for (let b = 0; b < 1 << depth; b++) {
      const q = leafOff(b, f, L0);
      glyph(`burst${depth}-${b}`, { at: q.at, angle: q.ang, len: q.len, alpha: 1, wave: f * 0.6 + b }, b);
    }
    return out;
  }
  // the spread: the eight sorted left to right, each to the person in the same order
  const leaves = Array.from({ length: 8 }, (_, b) => ({ b, at: leafOff(b, BURST_SPREAD, L0).at })).sort((p, q) => p.at[0] - q.at[0]);
  leaves.forEach((lf, i) => {
    const to = BURST_TO[i];
    const t0 = BURST_SPREAD + (i % 3);
    const ta = t0 + 9 + ((i * 5) % 4);
    const dst = endAt(to, Math.min(f, ta));
    const arc = arcOf(lf.at, endAt(to, ta));
    const Lc = (germPx(k) * CLING) / k;
    const L3 = 0.48 * L0;
    if (f < ta) {
      const u = smoother((f - t0) / (ta - t0));
      glyph(`burstL${lf.b}`, { at: f < t0 ? lf.at : arc.at(u), angle: BURST_AXES[2] + angDiff(BURST_AXES[2], arc.tan(u)) * smoother((f - t0) / 4), len: L3 + (Lc - L3) * u, alpha: 1, wave: f * 0.6 + lf.b }, lf.b);
    } else {
      const endAng = arc.tan(1);
      glyph(`burstL${lf.b}`, clingState(dst, endAng + angDiff(endAng, flatOf(endAng, 50 + lf.b)) * smoother((f - ta) / 10), f, ta, 50 + lf.b, Lc), lf.b);
    }
  });
  return out;
};

/** every germ on screen at f, and whether it is still emerging behind its source (drawn in its source's band) */
export const germsOn = (f: number, k: number) =>
  [...NODES.values()].flatMap((nd) => {
    const st = nodeAt(nd.id, f, k);
    if (!st) return [];
    const emerging = nd.root !== undefined && f < AGENTS[nd.root].td && AGENTS[nd.root].from[0] !== "house";
    return [{ nd, st, emerging }];
  }).concat(burstOn(f, k).map((q) => ({ ...q, emerging: false })));
const GermGlyph: React.FC<{ nd: GNode; st: GState }> = ({ nd, st }) => <Microbe at={st.at} len={st.len} angle={st.angle} kind={nd.kind} n={nd.n} wave={st.wave} opacity={st.alpha} />;
const GermAgents: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const list = germsOn(f, k).filter((q) => !q.emerging);
  // (an empty filtered group would paint its filter region at the world origin)
  if (!list.length) return null;
  return (
    <g filter="url(#germRim)">
      {list.map((q) => (
        <GermGlyph key={q.nd.id} nd={q.nd} st={q.st} />
      ))}
    </g>
  );
};
/** the germs still coming out of this item (drawn just before it, so its body hides theirs) */
const EmergingAt: React.FC<{ it: Item; f: number; k: number }> = ({ it, f, k }) => {
  const list = germsOn(f, k).filter((q) => q.emerging && q.nd.root !== undefined && (() => {
    const [t, s0, x] = AGENTS[q.nd.root as number].from;
    return t === it.t && s0 === it.s && "x" in it && it.x === x;
  })());
  if (!list.length) return null;
  // nothing of a germ coming out shows below the ground its source stands on
  const id = `emg-${it.t}-${it.s}-${"x" in it ? it.x : 0}`;
  return (
    <g>
      <clipPath id={id}>
        <rect x={-1e5} y={-1e5} width={2e5} height={1e5 + gy(it.s) - 2} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <g filter="url(#germRim)">
          {list.map((q) => (
            <GermGlyph key={q.nd.id} nd={q.nd} st={q.st} />
          ))}
        </g>
      </g>
    </g>
  );
};
/** the first frame any roof sheds (the veil's filtered group is drawn from then on) */
const VEIL_FROM = 95;
/** the onset of each body's own stipple: the animals and the dung from "these" (f24); a person from the frame
 *  the first germ reaches them, or as the spread passes them (out from the middle); a house from f95 */
const onsetOf = (it: Item): number => {
  if (it.t === "dung" || it.t === "goat" || it.t === "cow") return it.s >= RA ? 24 + (Math.abs(it.x - 600) / 1400) * 30 : 60 + Math.abs(it.x - 600) / 25;
  if (it.t === "p") return INFECTED.get(`${it.s}/${it.x}`) ?? 92 + Math.abs(it.x - 600) / 30;
  if (it.t === "house") return VEIL_FROM + Math.abs(it.x - 540) / 40;
  return 0;
};

const BAND_SOURCES = BANDS.map((b) =>
  b.items
    .filter((it) => it.t !== "house")
    .flatMap((it) => sourcesOf(it, b.s >= RA)),
);
// ---------------------------------------------------------------------------
// THE CAMERA: one damped pull-back, k in log space; y derived from k
// ---------------------------------------------------------------------------
const CAM: CamKey[] = [
  { f: 0, x: 540, y: 960, k: 1 },
  { f: 22, x: 540, y: 960, k: 0.963 },
  { f: 52, x: 540, y: 960, k: 0.82 },
  { f: 84, x: 540, y: 960, k: 0.648 },
  { f: 114, x: 540, y: 960, k: 0.51 },
  { f: 144, x: 540, y: 960, k: 0.418 },
  { f: 167, x: 540, y: 960, k: 0.398 },
];
/** the resolved zoom: a front-row man ~200 px tall, a woman ~190, a child ~145 */
const K_END = 0.398;
/** the front ground's screen y at zoom k: 1040 close, 1050 wide */
const groundScreen = (k: number) => 1040 + (10 * (1 - k)) / (1 - K_END);
export const camAt = (f: number) => {
  const c = runCamera(CAM, f);
  return { x: c.x, y: Y0 - (groundScreen(c.k) - 960) / c.k, k: c.k };
};

// ---------------------------------------------------------------------------
// THE CUT'S OWN PROPS
// ---------------------------------------------------------------------------
const PLANE = "#2A2119";
const lineOf = (tint: number) => mixColor(INK, ACCENT, tint);
/** a wattle hurdle fence: stakes with withies woven between them, ~105 units high (a goat's back shows over it) */
const WattleFence: React.FC<{
  x0: number;
  x1: number;
  y: number;
  s: number;
  seed: number;
}> = ({ x0, x1, y, s, seed }) => {
  const H = 105 * s;
  const n = Math.max(2, Math.round((x1 - x0) / (95 * s)));
  const posts = Array.from(
    { length: n + 1 },
    (_, i) =>
      x0 +
      ((x1 - x0) * i) / n +
      (i > 0 && i < n ? (hash(i, 40 + seed) - 0.5) * 18 * s : 0),
  );
  const line = lineOf(0.38);
  let weave = "";
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const yy = y - H * (0.12 + (0.8 * r) / (rows - 1));
    posts.slice(0, -1).forEach((px, i) => {
      const nx = posts[i + 1];
      const over = (i + r) % 2 === 0 ? 1 : -1;
      weave += `M${(px + 3 * s).toFixed(1)},${(yy + over * 3 * s).toFixed(1)}Q${((px + nx) / 2).toFixed(1)},${(yy - over * 5 * s).toFixed(1)} ${(nx - 3 * s).toFixed(1)},${(yy + over * 3 * s).toFixed(1)}`;
    });
  }
  const top = posts.map(
    (px, i) => [px, y - H - (10 + 14 * hash(i, 50 + seed)) * s] as P2,
  );
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${x0},${y}L${x0},${y - H * 0.94}L${x1},${y - H * 0.94}L${x1},${y}Z`}
        fill={PLANE}
        fillOpacity={0.92}
      />
      <path
        d={weave}
        fill="none"
        stroke={DARK}
        strokeWidth={6.5 * s}
        strokeOpacity={0.8}
      />
      <path
        d={weave}
        fill="none"
        stroke={line}
        strokeWidth={3.2 * s}
        strokeOpacity={0.8}
      />
      {posts.map((px, i) => (
        <g key={i}>
          <path
            d={`M${px.toFixed(1)},${(y + 4 * s).toFixed(1)}L${top[i][0].toFixed(1)},${top[i][1].toFixed(1)}`}
            stroke={DARK}
            strokeWidth={11 * s}
          />
          <path
            d={`M${px.toFixed(1)},${(y + 4 * s).toFixed(1)}L${top[i][0].toFixed(1)},${top[i][1].toFixed(1)}`}
            stroke={line}
            strokeWidth={5.4 * s}
          />
        </g>
      ))}
    </g>
  );
};
/** the dung heap: a low mound piled with rounded clods (each cased dark, lit on its upper left, hatched low right),
 *  a few straws; w = width in units */
const DungHeap: React.FC<{
  x: number;
  y: number;
  s: number;
  w: number;
  seed: number;
}> = ({ x, y, s, w, seed }) => {
  const hw = (w / 2) * s;
  const h = 0.3 * w * s;
  const mound = `M${x - hw},${y}C${x - hw * 0.7},${y - h * 0.9} ${x + hw * 0.6},${y - h * 1.05} ${x + hw},${y}Z`;
  // clods in tiers, the bottom tier widest, drawn back to front (top tier first)
  const clods: { cx: number; cy: number; r: number; i: number }[] = [];
  const tiers = [
    { n: 8, v: 0.1, span: 0.88, r: 0.075 },
    { n: 7, v: 0.32, span: 0.72, r: 0.075 },
    { n: 5, v: 0.55, span: 0.5, r: 0.07 },
    { n: 3, v: 0.76, span: 0.26, r: 0.065 },
  ];
  tiers.forEach((t, ti) =>
    Array.from({ length: t.n }, (_, j) => {
      const i = ti * 10 + j;
      const u = t.n === 1 ? 0 : (j / (t.n - 1)) * 2 - 1;
      clods.push({
        cx: x + u * t.span * hw + (hash(i, 60 + seed) - 0.5) * 0.08 * hw,
        cy: y - t.v * h * 1.0 - (hash(i, 61 + seed) - 0.5) * 0.06 * h,
        r: t.r * w * s * (0.85 + 0.3 * hash(i, 62 + seed)),
        i,
      });
    }),
  );
  clods.sort((p, q) => p.cy - q.cy);
  let straw = "";
  for (let i = 0; i < 5; i++) {
    const u = 0.2 + 0.6 * hash(i, 70 + seed);
    const xx = x - hw + 2 * hw * u;
    const yy = y - h * (0.35 + 0.5 * hash(i, 71 + seed));
    const a = (hash(i, 72 + seed) - 0.5) * 2.2;
    const l = (8 + 7 * hash(i, 73 + seed)) * s;
    straw += `M${(xx - Math.cos(a) * l).toFixed(1)},${(yy - Math.sin(a) * l).toFixed(1)}L${(xx + Math.cos(a) * l).toFixed(1)},${(yy + Math.sin(a) * l).toFixed(1)}`;
  }
  const lit = mixColor(LAND, INK, 0.4);
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <ellipse
        cx={x}
        cy={y + 2 * s}
        rx={hw * 1.1}
        ry={11 * s}
        fill={DARK}
        fillOpacity={0.4}
      />
      <path d={mound} fill="#4A3826" stroke={DARK} strokeWidth={5 * s} />
      {clods.map((c) => {
        const ry = c.r * 0.62;
        return (
          <g key={c.i}>
            <ellipse
              cx={c.cx}
              cy={c.cy}
              rx={c.r}
              ry={ry}
              fill="#4F3C29"
              stroke={DARK}
              strokeWidth={3.2 * s}
              transform={`rotate(${((hash(c.i, 64 + seed) - 0.5) * 30).toFixed(1)} ${c.cx.toFixed(1)} ${c.cy.toFixed(1)})`}
            />
            <path
              d={`M${(c.cx - c.r * 0.72).toFixed(1)},${(c.cy - ry * 0.1).toFixed(1)}Q${(c.cx - c.r * 0.55).toFixed(1)},${(c.cy - ry * 0.85).toFixed(1)} ${(c.cx + c.r * 0.15).toFixed(1)},${(c.cy - ry * 0.86).toFixed(1)}`}
              fill="none"
              stroke={lit}
              strokeWidth={2 * s}
            />
            <path
              d={`M${(c.cx + c.r * 0.1).toFixed(1)},${(c.cy + ry * 0.62).toFixed(1)}l${(c.r * 0.3).toFixed(1)},${(-ry * 0.42).toFixed(1)}M${(c.cx + c.r * 0.42).toFixed(1)},${(c.cy + ry * 0.45).toFixed(1)}l${(c.r * 0.24).toFixed(1)},${(-ry * 0.4).toFixed(1)}`}
              fill="none"
              stroke={DARK}
              strokeWidth={2.4 * s}
              strokeOpacity={0.8}
            />
          </g>
        );
      })}
      <path
        d={straw}
        stroke={mixColor(INK, ACCENT_DEEP, 0.3)}
        strokeWidth={2.4 * s}
        strokeOpacity={0.75}
        fill="none"
      />
    </g>
  );
};

/** the quiet ground in front of the village: sparse engraved strokes in ranks, bigger and sparser toward us, fading out */
const FORE_D = (() => {
  let d = "";
  let i = 0;
  for (let dy = 150; dy < 3000; dy *= 1.32) {
    const sz = 1 + dy / 420;
    const gap = 70 * sz;
    const fade = 1 - dy / 3000;
    for (
      let x = -3400 + gap * hash(dy, 81);
      x < 4500;
      x += gap * (0.7 + 0.6 * hash(i, 82)), i++
    ) {
      if (hash(i, 83) > 0.55 * fade) continue;
      const l = 18 * sz * (0.6 + 0.6 * hash(i, 84));
      const yy = Y0 + dy + (hash(i, 85) - 0.5) * 40 * sz;
      d += `M${(x - l * 0.5).toFixed(1)},${(yy + l * 0.22).toFixed(1)}L${(x + l * 0.5).toFixed(1)},${(yy - l * 0.22).toFixed(1)}`;
    }
  }
  return d;
})();
const ForeGround: React.FC = () => (
  <path
    d={FORE_D}
    fill="none"
    stroke={mixColor(LAND, INK, 0.7)}
    strokeWidth={2.2}
    strokeOpacity={0.26}
    strokeLinecap="round"
  />
);

// a far row sinks toward the page: one colour matrix per depth (alpha kept)
const hexRgb = (h: string) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const LAND_RGB = hexRgb(LAND);
const SinkFilter: React.FC<{ id: string; t: number }> = ({ id, t }) => {
  const a = (1 - t).toFixed(4);
  const [r, g, b] = LAND_RGB.map((v) => (v * t).toFixed(4));
  return (
    <filter
      id={id}
      x="-5%"
      y="-5%"
      width="110%"
      height="110%"
      colorInterpolationFilters="sRGB"
    >
      <feColorMatrix
        type="matrix"
        values={`${a} 0 0 0 ${r} 0 ${a} 0 0 ${g} 0 0 ${a} 0 ${b} 0 0 0 1 0`}
      />
    </filter>
  );
};

const ItemArt: React.FC<{ it: Item; f: number; uid: string }> = ({
  it,
  f,
  uid,
}) => {
  const y = it.t === "house" && it.y !== undefined ? it.y : gy(it.s);
  if (it.t === "p" && it.act === "cougher")
    return <TurnFarmer pose={idle(cougherPose(f), f, it.seed, 0.6)} at={[it.x, y]} scale={it.s} uid={uid} woman={it.woman} hold="none" seed={it.seed} />;
  if (it.t === "p")
    return (
      <Farmer
        pose={it.act === "hoe" ? personPose(it, f) : idle(personPose(it, f), f, it.seed, it.walk && f > it.walk[0] && f < it.walk[1] ? 0 : 1)}
        at={[personX(it, f), y]}
        scale={it.s}
        uid={uid}
        woman={it.woman}
        child={it.child}
        hold={it.hold}
        holdFar={it.holdFar}
        seed={it.seed}
      />
    );
  if (it.t === "goat")
    return (
      <Goat
        at={[beastX(it, f), y]}
        scale={it.s}
        dir={it.dir}
        g={f + it.seed * 37}
        walk={it.walk ? walkDist(f, it.walk, animalAdvance("goat", it.s)) / (2 * ANIMAL_WALK.stride.goat * it.s) : undefined}
        walkAmount={it.walk ? Math.max(0, Math.min(1, (f - it.walk[0]) / 6, (it.walk[1] - f) / 6)) : 0}
        graze={it.grazeAt ? ramp(f, it.grazeAt[0], it.grazeAt[1]) : (it.graze ?? 0) * (it.walk ? 1 - Math.max(0, Math.min(1, (f - it.walk[0]) / 6, (it.walk[1] - f) / 6)) : 1)}
        seed={it.seed}
        uid={uid}
      />
    );
  if (it.t === "cow")
    return (
      <Cow
        at={[it.x, y]}
        scale={it.s}
        dir={it.dir}
        g={f + it.seed * 37}
        graze={it.graze ?? 0}
        seed={it.seed}
        uid={uid}
      />
    );
  if (it.t === "house")
    return (
      <Longhouse
        tint={0}
        at={[it.x, y]}
        scale={it.s}
        len={it.len}
        uid={uid}
        seed={it.seed}
      />
    );
  if (it.t === "fence") {
    if (it.gate) {
      const u = smoother((f - it.gate[0]) / (it.gate[1] - it.gate[0]));
      if (u < 0.03) return null;
      return <WattleFence x0={it.x1 - (it.x1 - it.x0) * u} x1={it.x1} y={y} s={it.s} seed={it.seed} />;
    }
    return <WattleFence x0={it.x0} x1={it.x1} y={y} s={it.s} seed={it.seed} />;
  }
  if (it.t === "grain") return <GrainHeap at={[it.x, y]} scale={it.s} amount={1} width={it.w} seed={it.seed} />;
  if (it.t !== "dung") return null;
  return <DungHeap x={it.x} y={y} s={it.s} w={it.w} seed={it.seed} />;
};

/** every germ layer at frame f: which band it belongs to, whether it is drawn behind that band's figures or over
 *  them, and its Germs props (exported for the mote count in the review) */
export type GermLayer = { band: number; place: "behind" | "over" | "veil" | "top"; props: GermsProps };
export const germLayers = (frame: number): GermLayer[] => {
  const k = camAt(frame).k;
  const close = Math.max(0, Math.min(1, (k - K_END) / (1 - K_END)));
  const out: GermLayer[] = [];
  // the body streams spread less than the veil: they stay thin round their sources
  const growB = (1 / k) ** 0.45;
  BANDS.forEach((b, i) => {
    const q = b.s / S0;
    const front = b.s >= RA;
    if (BAND_SOURCES[i].length)
      out.push({
        band: i,
        // behind the band's own figures: the streams leave their outlines and never cross a face
        place: "behind",
        props: { frame, k, sources: BAND_SOURCES[i], density: 0.55, life: LIFE, spread: 1.0 * q * growB, wander: 70 * q * growB, drift: [0.12 * q * growB, -(front ? 0.4 : 0.15) * q * growB], mote: 2.3 + (front ? 1.1 : 0.5) * close, microbe: 0, rodShare: 0.03, maxMotes: 14000, opacity: 0.62 + 0.23 * close, seed: i + 1 },
      });
  });
  return out;
};

/** the legible germs' thin dark keyline and cream rim (screen px at zoom k) */
const rimFilter = (id: string, k: number) => (
    <filter key={id} id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={4.6 / k} result="outer" />
      <feMorphology in="SourceAlpha" operator="dilate" radius={2.4 / k} result="inner" />
      <feFlood floodColor={INK} floodOpacity={1} />
      <feComposite in2="outer" operator="in" result="cream" />
      <feFlood floodColor={DARK} />
      <feComposite in2="inner" operator="in" result="dark" />
      <feMerge>
        <feMergeNode in="cream" />
        <feMergeNode in="dark" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );

const BredInTheVillageV2: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const layers = germLayers(frame);
  const germsAt = (band: number, place: GermLayer["place"]) => layers.filter((l) => l.band === band && l.place === place).map((l, j) => <Germs key={`${place}${j}`} {...l.props} />);

  // the legible germs' dark casing and thin cream rim (screen px), so they part from the orange coats
  const rim = rimFilter("germRim", cam.k);

  const sinks = BANDS.map((b, i) => (sinkOf(b.s) > 0.01 ? <SinkFilter key={i} id={`sink${i}`} t={sinkOf(b.s)} /> : null));
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={cam} defs={[rim, ...sinks]}>
          {BANDS.map((b, i) => {
            const t = sinkOf(b.s);
            return (
              <React.Fragment key={i}>
                {b.s === R0 ? (
                  <>
                    <ForeGround />
                    <GroundLine x0={-3200} x1={4300} y={Y0} depth={90} seed={5} />
                  </>
                ) : null}
                {germsAt(i, "behind")}
                <g filter={t > 0.01 ? `url(#sink${i})` : undefined}>
                  {b.items.map((it, j) => (
                    <React.Fragment key={j}>
                      <EmergingAt it={it} f={frame} k={cam.k} />
                      <ItemArt it={it} f={frame} uid={`b${i}i${j}`} />
                    </React.Fragment>
                  ))}
                </g>
                {germsAt(i, "over")}

              </React.Fragment>
            );
          })}
          <GermAgents f={frame} k={cam.k} />
        </WorldSvg>
        <WorldSvg cam={nearCam(cam.k)} defs={rimFilter("germRimN", nearCam(cam.k).k)}>
          <NearStrip f={frame} kn={nearCam(cam.k).k} />
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

export default BredInTheVillageV2;
