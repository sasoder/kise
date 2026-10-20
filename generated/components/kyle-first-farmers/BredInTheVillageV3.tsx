// ---------------------------------------------------------------------------
// BredInTheVillageV3 (kyle-first-farmers, cut 9; the V3 pass on 9_BredInTheVillage_V2.mov; same 168 frames and
// word timing). The user on V2: the people at the bottom are not anchored to the place; the bacteria are too big
// and distracting, "the dots will do a much better job". What V3 changes over V2 (everything else is V2):
//   - ONE PLACE: the near strip on its own parallax plane is gone, and so are the five sunk foreground roofs. The
//     near group (the man with the hoe by his dung heap, the woman, the goat, a short hurdle) now stands on the village's own ground
//     plane, under the same camera: the yard runs on from the front row's ground line down to them, one hatch in
//     perspective (strokes and ranks scale with depth), a trodden path from them back to the front pens' gate,
//     their own contact shadows. They are below the frame at f0 and rise into it head first as the camera pulls
//     back (heads at the frame bottom ~f70, whole by ~f135, heads at screen y ~1525 at the end, below both bands).
//   - NO SEAM (director's pass): the front row's full-width GroundLine is gone; one ground runs from behind the far
//     rows to the frame's bottom, its tone graded with depth (a touch lighter toward the village, darker toward us)
//     and its hatch in depth bins (finer and lighter far, coarser near); the front row's feet keep their contact
//     shadows. A second, fainter path runs from the near man's heap back toward the left of the front row.
//   - THE MIDDLE GROUND: a few small, quiet things step the eye back through the yard (stones, a stump, a log
//     trough, a basket, trodden straw, a short hurdle set across at a shallow angle), each at its own depth scale and
//     sunk toward the page; at the end most of them sit in the 1250-1360 gap between the caption bands.
//   - THE WOMAN OF THE PAIR is drawn with TurnFarmerBunSafe (farmersFigures addition): her bun no longer slides
//     onto her jaw when she turns her head toward us.
//   - DOTS ONLY: every legible Microbe glyph is gone (the authored agents, their divisions, the burst of eight, the
//     near coccus chains). The same story is told in the kit's fine stipple motes (<Germs>, no microbes, no rods),
//     overriding COMMON.md's "8-12 legible microbes" for this cut (the user's verdict):
//       routes   each V2 agent is now a small dense stream: dots come off its source (the dung heap, an animal's
//                back, a carrier's chest, a house) from its birth frame, hang there, then are drawn along to a
//                person (or into a door) by its arrival frame, thinning on the way; they settle round that person
//                (drawn behind the figure, so they cling round the outline and never cross a face), and the person
//                sheds dots of their own from then on.
//       the hoe  the man of the pair hoes his dung heap: each dig (f49, f89, f129) picks up a few dots that ride on
//                the blade (hidden in the heap while it is in it); as he raises the hoe after the f89 and f129
//                digs a few drop off it onto his shoulders and sink in.
//       engender a small colony of dots sits on the central dung heap from f112; on "engender" it divides
//                6 -> 12 -> 24 -> 48 (f141, f146, f151: each dot parts in two along its own axis); from f153 some
//                of the new dots drift off toward the hoer, the woman and the child.
//
// (V2 header, kept for the shared parts:)
// BredInTheVillage (kyle-first-farmers, cut 9). Dwarkesh map style (styles/dwarkesh-map.md), the umber page with
// no map. Opaque 1080x1920, 29.97 fps, 168 frames. World: the clip's own kit (firstFarmersShared: Page, runCamera,
// Germs, GroundLine) and cast (farmersFigures: Farmer, Goat, Cow, Longhouse), imported read-only. The wattle fence
// and the dung heap are this cut's own props, drawn here in the same engraver's hand.
//
// CHECK LINE: the farmers' crowded village life breeds disease: germs come out of the dung and the animals and
// settle on the farmers, and the place reads as one village.
//
// THE LINE: "of these diseases that the farmers had created the conditions to engender"
// WORD -> FRAME: of 3 · these 24 · diseases 43 · that 64 · the 78 · farmers 87 · had 100 · created 108 ·
//   the 121 · conditions 126 · to 136 · engender 141 · (and 152, the 160, relationship 166: Kyle on camera).
// DURATION: the slot 9.109 -> 14.715 s = 5.606 s x 29.97 = 168 frames (f0..f167).
//
// THE MOTION (one move): close inside a Neolithic farming village: an orange farmer woman and her child and a man
// hoeing his dung heap, packed in beside goats and a cow behind wattle fences, a longhouse wall behind them. One
// slow eased pull-back (f0 -> ~f150, then a creep) reveals the village that was always there: longhouses in rows
// terracing up the frame, more families, more penned animals, and toward us the yard with its own people and goat.
// Orange = the farmers (their coats) and their germs (ACCENT_DEEP dots). Architecture is the map style's own: dark
// umber planes in cream line. Animals cream. No text.
// CAUSE BEFORE EFFECT: dots first appear at a source (f3 the dung heap, f24 the animals); a person sheds dots only
// from the frame a stream reaches them; the hoe's dots appear on a dig (contact f49/f89/f129) and leave it from f104.
//
// CAMERA: runCamera keys the zoom (k, log-space pchip, damped); the vertical framing is derived from the zoom so the
// front ground line stays on screen y 1040 -> 1050 (above the first caption band) all the way. The yard below it
// is only low ground hatch and the faint path through both caption bands.
//
// SICKLES (COMMON.md ruling): never low in front of the body. Sickle men carry it hooked over the shoulder; the
// sheaf men's near hand is empty.
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
  Page,
  WorldSvg,
  mixColor,
  hash,
  ramp,
  runCamera,
  type CamKey,
  smoothstep,
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
  TurnFarmerBunSafe,
  WALK,
  animalAdvance,
  walkAdvance,
  walkLegs,
  aimTool,
  hoeLoop,
  farmAnchors,
  mirrorPose,
  idle,
  specOf,
  type FigPose,
} from "./farmersFigures";
import { figureRig } from "../kits/maps/texcocoFigures";
import { add, mul, rot } from "../kits/maps/stringsMotion";

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
/** a far row sinks toward the page (0 = in play); the yard toward us a touch, so it stays behind the focus */
const sinkOf = (s: number) => (s > S0 ? NEAR_SINK : 0.62 * Math.max(0, 1 - s / S0) ** 1.1);
const NEAR_SINK = 0.1;

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
  act?: "hoe" | "cougher" | "sicken" | "gather" | "look";
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
  /** the near goat's life: a slow nibble, the head down to the grass from f150 */
  grazeLife?: boolean;
  seed: number;
};
type HouseSpec = {
  t: "house";
  s: number;
  x: number;
  len?: number;
  seed: number;
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
// the yard toward us (V3): its depth scales put the group on the same plane as the village (ground y = gy(s)); at the
// end (k 0.398) their feet land at screen y ~1790-1865 and their heads ~1525, below the second caption band
const NS_FENCE = 2.56;
const NS_GOAT = 2.62;
const NS_MAN = 2.68;
const NS_WOMAN = 2.72;

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
  // ---- THE YARD toward us, on the same ground plane (V3): below the frame at f0, they rise into it head first as
  // the camera pulls back. The man of the near pen with his hoe on the shoulder by his dung heap, a woman, their goat,
  // a short hurdle.
  { t: "fence", s: NS_FENCE, x0: 230, x1: 900, seed: 7 },
  { t: "goat", s: NS_GOAT, x: 560, dir: -1, walk: [100, 124], grazeLife: true, seed: 3 },
  { t: "dung", s: NS_GOAT, x: -350, w: 190, seed: 4 },
  { t: "p", s: NS_MAN, x: -150, pose: P.hoeShoulder(1), hold: "hoe", seed: 31, act: "look" },
  { t: "p", s: NS_WOMAN, x: 1250, pose: P.stand(-1), woman: true, seed: 32 },
];

/** the near man turns his head toward the goat (f100-118) and back (f142-160) */
const lookPose = (q: FigPose, f: number): FigPose => {
  const look = smoother((f - 100) / 18) - smoother((f - 142) / 18);
  return { ...q, headYaw: q.headYaw + (0.3 - q.headYaw) * look };
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
        at: it.walk ? (f: number): P2 => [beastX(it, f) - it.dir * 4 * it.s, y - 100 * it.s] : [it.x - it.dir * 4 * it.s, y - 100 * it.s],
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
  if (!it) throw new Error(`BredInTheVillageV3: no ${t} at ${s} / ${x}`);
  return it;
};

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
  if (it.act === "look") return lookPose(it.pose, f);
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

type End = { kind: "person"; s: number; x: number; off: P2 } | { kind: "door"; s: number; x: number };
type From = [Item["t"], number, number];
/** where dots leave a body: the dung heap's top, an animal's back, a longhouse's door, a carrier's chest */
const outOf = (t: Item["t"], s: number, x: number, f = 0): P2 => {
  const it = itemAt(t, s, x);
  const y = gy(it.s);
  if (it.t === "dung") return [it.x + 0.12 * it.w * it.s, y - 0.2 * it.w * it.s];
  if (it.t === "goat") return [beastX(it, f) - it.dir * 10 * it.s, y - 112 * it.s];
  if (it.t === "cow") return [it.x - it.dir * 20 * it.s, y - 200 * it.s];
  if (it.t === "house") return [it.x - ((it.len ?? 1900) / 2) * 0.12 * it.s, y - 140 * it.s];
  if (it.t === "p") return endAt(pers(s, x, [0, -6]), f);
  throw new Error("BredInTheVillageV3: no germ source " + t);
};
/** where dots end on frame f: a door, or a person's upper body (a walker or the hoer is followed) */
const endAt = (e: End, f: number): P2 => {
  if (e.kind === "door") return outOf("house", e.s, e.x);
  const it = itemAt("p", e.s, e.x) as PersonSpec;
  const moving = it.walk || it.act === "hoe";
  const A = farmAnchors("farmer", moving ? personPose(it, f) : it.pose, [moving ? personX(it, f) : it.x, gy(it.s)], it.s, it.woman, it.child);
  return [A.chest[0] + e.off[0] * it.s, A.chest[1] + (e.off[1] - 10) * it.s];
};
const pers = (s: number, x: number, off: P2 = [0, 0]): End => ({ kind: "person", s, x, off });
const door = (s: number, x: number): End => ({ kind: "door", s, x });

// ---------------------------------------------------------------------------
// THE ROUTES (V3, dots only): each V2 microbe agent is now a small dense stream of the kit's stipple motes. From t0
// dots come out of the source and hang round it; from ~td the kit's travel pulls them (each mote on its own delay)
// to the end, which they reach from ~ta: round a person they settle and cling (drawn behind the figure), into a
// door they sink. Emission stops at `until` (default ta + 24); the person sheds dots of their own from ta.
//   A (f3-43)   "these ... diseases": the dung heap stirs from f3, the goat and the cow from f24
//   B (f56-98)  "farmers": they reach the pair, the child, the woman at the left, the sheaf man
//   C (f96-156) "created ... conditions": animal to person, person to person, house to house; the yard's goat to
//               the near man and woman
// ---------------------------------------------------------------------------
type Route = { from: From; t0: number; td: number; ta: number; until?: number; to: End; rate?: number; seed: number };
const ROUTES: Route[] = [
  { from: ["dung", R0, 880], t0: 3, td: 52, ta: 84, until: 118, to: pers(R0, 470, [-6, 0]), rate: 1.5, seed: 1 },
  { from: ["cow", RA, 70], t0: 24, td: 56, ta: 86, until: 118, to: pers(R0, 330, [0, 14]), seed: 2 },
  { from: ["goat", RA, 880], t0: 26, td: 54, ta: 82, until: 112, to: pers(R0, 330, [10, 4]), rate: 0.8, seed: 3 },
  { from: ["cow", RA, 70], t0: 31, td: 62, ta: 92, until: 118, to: pers(R0, -170, [0, 10]), seed: 5 },
  { from: ["goat", RA, 880], t0: 34, td: 66, ta: 98, until: 124, to: pers(R0, 1260, [-6, 14]), seed: 6 },
  // C: the revealed village
  { from: ["goat", RA, 1290], t0: 96, td: 104, ta: 128, to: pers(R0, 1400, [0, 10]), seed: 7 },
  { from: ["house", RH1, 560], t0: 100, td: 106, ta: 136, to: door(RH2, 1750), seed: 8 },
  { from: ["goat", RA, -560], t0: 102, td: 110, ta: 132, to: pers(R0, -170, [4, 20]), seed: 9 },
  { from: ["p", R0, 330], t0: 104, td: 112, ta: 136, to: door(RH1, 560), rate: 0.6, seed: 10 },
  { from: ["p", R0, 470], t0: 106, td: 114, ta: 134, to: pers(R0, 330, [-8, -4]), rate: 0.6, seed: 11 },
  { from: ["goat", RA, 1560], t0: 112, td: 118, ta: 138, to: pers(R0, 1530, [0, 12]), seed: 12 },
  { from: ["p", R0, 1260], t0: 112, td: 120, ta: 140, to: pers(R0, 1400, [6, -2]), rate: 0.6, seed: 13 },
  { from: ["goat", RY3, 1210], t0: 110, td: 116, ta: 136, to: pers(RY3, 1060, [0, 12]), seed: 14 },
  { from: ["dung", R0, -560], t0: 116, td: 122, ta: 144, to: pers(R0, -470, [0, 8]), seed: 15 },
  { from: ["p", R0, -170], t0: 120, td: 128, ta: 150, to: pers(RY1, -680, [8, -6]), rate: 0.6, seed: 16 },
  { from: ["house", RH1, 560], t0: 124, td: 130, ta: 156, to: pers(RY3, 930, [0, 10]), seed: 17 },
  // the yard: the near goat to the man beside it (by "created") and to the woman (by "engender")
  { from: ["goat", NS_GOAT, 560], t0: 100, td: 108, ta: 128, until: 160, to: pers(NS_MAN, -150, [10, 0]), rate: 1.2, seed: 18 },
  { from: ["goat", NS_GOAT, 560], t0: 120, td: 128, ta: 141, until: 167, to: pers(NS_WOMAN, 1250, [-10, 6]), rate: 1.2, seed: 19 },
];
/** the frame each person is first reached (they shed dots of their own from then on) */
const INFECTED = new Map<string, number>();
ROUTES.forEach((g) => {
  if (g.to.kind !== "person") return;
  const key = `${g.to.s}/${g.to.x}`;
  INFECTED.set(key, Math.min(INFECTED.get(key) ?? 1e9, g.ta));
});
// the hoer is reached by his own hoe (f104-118)
INFECTED.set(`${R0}/700`, 112);
/** the depth band a route is drawn in: behind its person (the dots cling round the outline), over its house */
const routeBand = (g: Route) => g.to.s;

// ---------------------------------------------------------------------------
// THE HOE CARRIES SOME (V3): the man of the pair hoes his dung heap (hoeLoop, a dig every 40 frames, contact f49,
// f89, f129). Each dig picks up a few dots that ride on the blade from then on (they are drawn under the heap, so
// they show only as the blade comes out of it). As he raises the hoe after the f89 and f129 digs, a few drop off
// the blade onto his near shoulder and chest and sink in.
// ---------------------------------------------------------------------------
const HOER = (): PersonSpec => itemAt("p", R0, 700) as PersonSpec;
const SP_MAN = specOf("farmer", false, false);
/** the hoe blade's centre (world) and the tool's angle on frame f (the rig's own tool frame, as farmersFigures draws it) */
const bladeAt = (f: number, local: P2 = [22, -142]): P2 => {
  const it = HOER();
  const q = personPose(it, f);
  const r = figureRig(SP_MAN, q);
  const near = Math.sin(q.yaw) >= 0 ? r.armL : r.armR;
  const G = r.s >= 0 ? 1 : -1;
  const v = rot(near.dir, -90 * G);
  const grip = add(near.W, mul(near.dir, 9 * SP_MAN.limb));
  const ang = Math.atan2(v[0], -v[1]);
  const lx = G * local[0];
  const ly = local[1];
  const p: P2 = [grip[0] + lx * Math.cos(ang) - ly * Math.sin(ang), grip[1] + lx * Math.sin(ang) + ly * Math.cos(ang)];
  return [it.x + p[0] * it.s, gy(it.s) + p[1] * it.s];
};
type BladeDot = { o: P2; born: number; leave?: number; to?: P2; h: number };
const BLADE_DOTS: BladeDot[] = (() => {
  const out: BladeDot[] = [];
  const pick = (n: number, born: number, seed: number) =>
    Array.from({ length: n }, (_, i) => {
      // round the blade's edge (tool units: the blade spans x -2..46, y -156..-124), mostly just outside it
      const a = hash(i, seed) * Math.PI * 2;
      const rr = 0.85 + 0.45 * hash(i, seed + 1);
      out.push({ o: [22 + Math.cos(a) * 30 * rr, -140 + Math.sin(a) * 22 * rr], born: born + Math.floor(3 * hash(i, seed + 2)), h: hash(i, seed + 3) });
    });
  pick(5, 49, 101);
  pick(5, 89, 111);
  pick(5, 129, 121);
  // they drop off as he raises the hoe (4 after the f89 dig, 3 after the f129 dig)
  const leavers: [number, number, P2][] = [
    [0, 104, [-4, 14]],
    [5, 107, [8, 4]],
    [1, 110, [-10, 24]],
    [6, 113, [14, 18]],
    [10, 143, [2, 10]],
    [2, 146, [-12, 20]],
    [11, 149, [10, 26]],
  ];
  leavers.forEach(([i, t, to]) => {
    out[i].leave = t;
    out[i].to = to;
  });
  return out;
})();
const DOT_FALL = 14;
/** the hoe's dots on frame f (world), with their alpha */
const bladeDotsAt = (f: number): { at: P2; a: number; h: number }[] =>
  BLADE_DOTS.flatMap((d) => {
    if (f < d.born) return [];
    const a0 = smoothstep((f - d.born) / 8);
    const onBlade = bladeAt(f, d.o);
    if (d.leave === undefined || f < d.leave) return [{ at: onBlade, a: a0, h: d.h }];
    const it = HOER();
    const A = farmAnchors("farmer", personPose(it, f), [it.x, gy(it.s)], it.s);
    const dst: P2 = [A.chest[0] + (d.to as P2)[0] * it.s, A.chest[1] + (d.to as P2)[1] * it.s - 20 * it.s];
    const u = smoother((f - d.leave) / DOT_FALL);
    const from = bladeAt(d.leave, d.o);
    // it falls off the blade (a little arc) onto him, then sinks in over 8 frames
    const lift = Math.sin(Math.PI * u) * 14 * it.s;
    const at: P2 = [from[0] + (dst[0] - from[0]) * u, from[1] + (dst[1] - from[1]) * u - lift];
    const sink = 1 - smoothstep((f - d.leave - DOT_FALL) / 8);
    return sink > 0.02 ? [{ at, a: a0 * sink, h: d.h }] : [];
  });

// ---------------------------------------------------------------------------
// ENGENDER (V3): a small colony of dots sits on the central dung heap (they surface f112-126, as the kit's motes do,
// fading up over 14 frames), and on "engender" it multiplies: every dot divides in two at f141, f146 and f151 (the
// pair parts along the dot's own axis over 5 frames): 6 -> 12 -> 24 -> 48. From f153 a third of the new dots drift
// off the heap toward the hoer, the woman of the pair and her child (they do not arrive before the cut).
// ---------------------------------------------------------------------------
const COLONY_C: P2 = [880 + 0.1 * 230 * R0, Y0 - 0.19 * 230 * R0];
const COLONY_SEEDS: P2[] = [
  [-62, 6],
  [-28, -10],
  [6, 10],
  [34, -6],
  [64, 8],
  [-4, -24],
];
const COLONY_DIV = [141, 146, 151];
const COLONY_STEP = [34, 24, 16];
const COLONY_DRIFT = 153;
const COLONY_TO: End[] = [pers(R0, 700, [0, 0]), pers(R0, 470, [-6, 4]), pers(R0, 330, [4, 6])];
const colonyAt = (f: number): { at: P2; a: number; h: number }[] => {
  const out: { at: P2; a: number; h: number }[] = [];
  COLONY_SEEDS.forEach((s0, si) => {
    const born = 112 + 14 * hash(si, 131);
    if (f < born) return;
    const a = smoothstep((f - born) / 14);
    const level = COLONY_DIV.filter((t) => f >= t).length;
    for (let b = 0; b < 1 << level; b++) {
      let x = COLONY_C[0] + s0[0];
      let y = COLONY_C[1] + s0[1];
      for (let j = 0; j < level; j++) {
        const u = smoother((f - COLONY_DIV[j]) / 5);
        const side = (b >> j) & 1 ? 1 : -1;
        const axis = hash(si * 8 + (b & ((1 << j) - 1)), 140 + j) * Math.PI;
        const d = 0.5 * COLONY_STEP[j] * u * side;
        x += Math.cos(axis) * d;
        y += Math.sin(axis) * d * 0.7;
      }
      // a slow wriggle
      x += 1.6 * Math.sin(f * 0.13 + si * 2.1 + b);
      y += 1.2 * Math.sin(f * 0.11 + si * 1.3 + b * 0.7);
      const id = si * 8 + b;
      const h = hash(id, 150);
      if (level === 3 && h < 0.34) {
        // the drift: off the heap toward one of three people, slow (it would take ~40 frames to arrive)
        const t0 = COLONY_DRIFT + 10 * hash(id, 151);
        const u = smoothstep((f - t0) / 40);
        const dst = endAt(COLONY_TO[Math.floor(hash(id, 152) * 3)], f);
        const lift = Math.sin(Math.PI * Math.min(1, u)) * 40;
        out.push({ at: [x + (dst[0] - x) * u, y + (dst[1] - y) * u - lift], a, h });
      } else out.push({ at: [x, y], a, h });
    }
  });
  return out;
};
/** custom-placed dots in the kit's mote look (ACCENT_DEEP, its size and alpha range): the hoe's and the colony's */
const Dots: React.FC<{ dots: { at: P2; a: number; h: number }[]; k: number; mote: number }> = ({ dots, k, mote }) => {
  if (!dots.length) return null;
  const r = mote / k;
  return (
    <g>
      {dots.map((d, i) => (
        <circle key={i} cx={d.at[0]} cy={d.at[1]} r={r * (1.0 + 0.3 * d.h)} fill={ACCENT_DEEP} fillOpacity={0.9 * d.a} />
      ))}
    </g>
  );
};

/** the first frame any roof sheds (the veil's filtered group is drawn from then on) */
const VEIL_FROM = 95;
/** the onset of each body's own stipple: the animals and the dung from "these" (f24); a person from the frame
 *  the first germ reaches them, or as the spread passes them (out from the middle); a house from f95 */
const onsetOf = (it: Item): number => {
  // the yard toward us: its goat sheds once its back is in frame (f100); its people when the goat's dots reach them
  if (it.s > S0 && it.t !== "p") return 100;
  if (it.t === "dung" || it.t === "goat" || it.t === "cow") return it.s >= RA ? 24 + (Math.abs(it.x - 600) / 1400) * 30 : 60 + Math.abs(it.x - 600) / 25;
  if (it.t === "p") return INFECTED.get(`${it.s}/${it.x}`) ?? 92 + Math.abs(it.x - 600) / 30;
  if (it.t === "house") return VEIL_FROM + Math.abs(it.x - 540) / 40;
  return 0;
};

// (V3) per band: the animals' and the dung's sources (looser clouds), and the people's (a tight halo that clings)
const BAND_SOURCES = BANDS.map((b) =>
  b.items
    .filter((it) => it.t !== "house" && it.t !== "p")
    .flatMap((it) => sourcesOf(it, b.s >= RA)),
);
const BAND_PEOPLE = BANDS.map((b) => b.items.filter((it) => it.t === "p").flatMap((it) => sourcesOf(it, b.s >= RA)));
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

// ---------------------------------------------------------------------------
// THE YARD (V3): the ground in front of the village is the same plane the village stands on, down to the near group
// and past them. One low-contrast hatch in perspective: rank spacing, stroke length and gap all grow with the depth
// scale s(y) of that row of ground, so it reads as one receding yard. A trodden path runs from the near group back
// through the gap by their hurdle to the front pens' gate; quiet through the caption bands (fill and edges only).
// ---------------------------------------------------------------------------
/** the depth scale of the ground at world y (inverse of gy) */
const sAtY = (y: number) => S0 * (1 + (y - Y0) / D);
/** the ground the hatch covers: from behind the far rows down past the frame's bottom at the end */
const GROUND_TOP = gy(0.62);
const GROUND_BOT = Y0 + 2700;
/** two trodden paths, from the near group back to the front row: [near x, far x] and their half widths per s */
type PathDef = { near: P2; far: P2; w: [number, number] };
const PATHS: PathDef[] = [
  // to the front pens' gate (the main one)
  { near: [1020, 2.9], far: [1535, R0], w: [70, 95] },
  // a fainter one from the near man's heap back to the left of the front row, toward the left houses
  { near: [-240, 2.9], far: [-740, R0], w: [44, 62] },
];
const pathAt = (p: PathDef, s: number): [number, number] => {
  const u = (s - p.far[1]) / (p.near[1] - p.far[1]);
  return [p.far[0] + (p.near[0] - p.far[0]) * u, (p.w[0] + (p.w[1] - p.w[0]) * u) * s];
};
const onPath = (x: number, s: number, pad = 1.05) => s >= R0 && PATHS.some((p) => Math.abs(x - pathAt(p, s)[0]) < pathAt(p, s)[1] * pad);
/** the ground hatch in depth bins: finer and lighter toward the village, coarser and a little stronger toward us
 *  (bins: [s from, s to, screen stroke px, opacity]) */
const HATCH_BINS: [number, number, number, number][] = [
  [0.0, 1.25, 1.2, 0.2],
  [1.25, 1.62, 1.5, 0.24],
  [1.62, 2.05, 1.9, 0.27],
  [2.05, 2.5, 2.4, 0.3],
  [2.5, 9, 2.9, 0.32],
];
const YARD_D = (() => {
  const out = HATCH_BINS.map(() => "");
  let i = 0;
  for (let y = GROUND_TOP; y < GROUND_BOT; i++) {
    const s = sAtY(y);
    const bin = HATCH_BINS.findIndex((b) => s >= b[0] && s < b[1]);
    const gap = 46 * s;
    for (let x = -3400 + gap * hash(i, 81); x < 4500; x += gap * (0.7 + 0.6 * hash(i, 82)), i++) {
      if (hash(i, 83) > 0.5) continue;
      if (onPath(x, s)) continue;
      const l = 12 * s * (0.6 + 0.6 * hash(i, 84));
      const yy = y + (hash(i, 85) - 0.5) * 8 * s;
      out[bin] += `M${(x - l * 0.5).toFixed(1)},${(yy + l * 0.2).toFixed(1)}L${(x + l * 0.5).toFixed(1)},${(yy - l * 0.2).toFixed(1)}`;
    }
    y += 21 * s * (0.8 + 0.4 * hash(i, 86));
  }
  return out;
})();
const PATH_ART = PATHS.map((pd, pi) => {
  const L: P2[] = [];
  const R: P2[] = [];
  let edges = "";
  let i = 0;
  for (let y = Y0 + 6; y < GROUND_BOT + 100; y += 14 * sAtY(y)) {
    const s = sAtY(y);
    const [cx, hw] = pathAt(pd, s);
    const wob = (hash(Math.round(y), 91 + pi) - 0.5) * 6 * s;
    L.push([cx - hw + wob, y]);
    R.push([cx + hw - wob, y]);
  }
  // the worn edges: short strokes along each side, a few ruts down the middle; they fade out toward the front row
  for (let y = Y0 + 10; y < GROUND_BOT + 100; y += 26 * sAtY(y), i++) {
    const s = sAtY(y);
    const [cx, hw] = pathAt(pd, s);
    const l = 16 * s * (0.6 + 0.6 * hash(i, 92 + pi));
    const keep = Math.min(1, (y - Y0) / 260) * (pi === 0 ? 0.8 : 0.55);
    [-1, 1].forEach((side) => {
      if (hash(i + side, 93 + pi) > keep) return;
      edge(cx + side * hw * (0.92 + 0.08 * hash(i, 94 + side)), y, l);
    });
    if (hash(i, 96 + pi) < 0.35 * keep) edge(cx + (hash(i, 97) - 0.5) * hw, y, l * 0.8);
  }
  function edge(x: number, y: number, l: number) {
    edges += `M${(x - l * 0.5).toFixed(1)},${y.toFixed(1)}L${(x + l * 0.5).toFixed(1)},${y.toFixed(1)}`;
  }
  const fill = `M${L.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}L${R.reverse().map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}Z`;
  return { fill, edges, main: pi === 0 };
});
/** one continuous ground from the far rows to the frame's bottom (no ground line: the front row stands on it with
 *  its own contact shadows). Its tone grades with depth: a touch lighter toward the village, darker toward us.
 *  k = the camera zoom: the hatch keeps its screen weight per depth bin through the pull-back. */
const ForeGround: React.FC<{ k: number }> = ({ k }) => (
  <g fill="none" strokeLinecap="round">
    <defs>
      <linearGradient id="groundTone" gradientUnits="userSpaceOnUse" x1={0} y1={GROUND_TOP} x2={0} y2={GROUND_BOT}>
        <stop offset={0} stopColor={INK} stopOpacity={0.05} />
        <stop offset={(Y0 - GROUND_TOP) / (GROUND_BOT - GROUND_TOP)} stopColor={INK} stopOpacity={0.025} />
        <stop offset={(Y0 + 700 - GROUND_TOP) / (GROUND_BOT - GROUND_TOP)} stopColor={DARK} stopOpacity={0.06} />
        <stop offset={1} stopColor={DARK} stopOpacity={0.2} />
      </linearGradient>
    </defs>
    <rect x={-4000} y={GROUND_TOP} width={9000} height={GROUND_BOT - GROUND_TOP + 400} fill="url(#groundTone)" />
    {PATH_ART.map((p, i) => (
      <path key={`pf${i}`} d={p.fill} fill={INK} fillOpacity={p.main ? 0.045 : 0.03} />
    ))}
    {YARD_D.map((d, i) => (
      <path key={`h${i}`} d={d} stroke={mixColor(LAND, INK, 0.75)} strokeWidth={HATCH_BINS[i][2] / k} strokeOpacity={HATCH_BINS[i][3]} />
    ))}
    {PATH_ART.map((p, i) => (
      <path key={`pe${i}`} d={p.edges} stroke={mixColor(LAND, INK, 0.7)} strokeWidth={2.6 / k} strokeOpacity={p.main ? 0.36 : 0.28} />
    ))}
  </g>
);

// ---------------------------------------------------------------------------
// THE YARD'S MIDDLE GROUND (V3): a few small, quiet things between the near group and the front row, so the eye steps
// back through the yard: stones, a stump, a hollowed-log trough, a basket, trodden straw and a short hurdle set at
// an angle (spread across, not a ladder). Each at its own depth scale (size and weight shrink with depth); most of
// them land in the 1250-1360 gap between the caption bands at the end; sunk toward the page (YARD_SINK).
// ---------------------------------------------------------------------------
const YARD_SINK = 0.32;
type Prop = { t: "stone" | "stump" | "trough" | "basket" | "straw"; x: number; s: number; w: number; seed: number };
const PROPS: Prop[] = ([
  { t: "straw", x: 1300, s: 1.93, w: 300, seed: 1 },
  { t: "straw", x: -420, s: 2.0, w: 240, seed: 2 },
  { t: "trough", x: 300, s: 1.97, w: 170, seed: 3 },
  { t: "basket", x: 640, s: 1.92, w: 44, seed: 4 },
  { t: "stone", x: -40, s: 2.02, w: 40, seed: 5 },
  { t: "stone", x: 1880, s: 1.96, w: 52, seed: 6 },
  { t: "stone", x: 820, s: 2.36, w: 34, seed: 7 },
  { t: "stump", x: 1700, s: 2.32, w: 46, seed: 8 },
  { t: "stone", x: -700, s: 2.3, w: 46, seed: 9 },
] as Prop[]).sort((a, b) => a.s - b.s);
/** the short hurdle: from (x, s) to (x, s), posts spread across the frame (a shallow angle) */
const HURDLE: [P2, P2] = [
  [1390, 1.95],
  [1700, 2.03],
];
const blob = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
  const n = 9;
  const pts = Array.from({ length: n }, (_, j) => {
    const a = (j / n) * Math.PI * 2;
    const r = 0.85 + 0.3 * hash(j, seed);
    // flat underside: it sits on the ground
    return [cx + Math.cos(a) * rx * r, cy + Math.min(Math.sin(a) * ry * r, ry * 0.25)] as P2;
  });
  let d = `M${((pts[n - 1][0] + pts[0][0]) / 2).toFixed(1)},${((pts[n - 1][1] + pts[0][1]) / 2).toFixed(1)}`;
  pts.forEach((p, j) => {
    const q = pts[(j + 1) % n];
    d += `Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${((p[0] + q[0]) / 2).toFixed(1)},${((p[1] + q[1]) / 2).toFixed(1)}`;
  });
  return d + "Z";
};
const PropArt: React.FC<{ p: Prop }> = ({ p }) => {
  const y = gy(p.s);
  const u = p.s;
  const line = lineOf(0.3);
  const shadow = <ellipse cx={p.x} cy={y + 2 * u} rx={(p.t === "straw" ? 0 : p.w * 0.62) * u} ry={6 * u} fill={DARK} fillOpacity={0.35} />;
  if (p.t === "straw") {
    let d = "";
    for (let j = 0; j < 22; j++) {
      const xx = p.x + (hash(j, p.seed + 200) - 0.5) * p.w * u;
      const yy = y + (hash(j, p.seed + 201) - 0.5) * 22 * u;
      const a = (hash(j, p.seed + 202) - 0.5) * 0.9;
      const l = (10 + 9 * hash(j, p.seed + 203)) * u;
      d += `M${(xx - Math.cos(a) * l).toFixed(1)},${(yy - Math.sin(a) * l).toFixed(1)}L${(xx + Math.cos(a) * l).toFixed(1)},${(yy + Math.sin(a) * l).toFixed(1)}`;
    }
    return <path d={d} stroke={mixColor(INK, ACCENT_DEEP, 0.3)} strokeWidth={2.4 * u} strokeOpacity={0.55} strokeLinecap="round" fill="none" />;
  }
  if (p.t === "stone") {
    const rx = (p.w / 2) * u;
    const ry = p.w * 0.42 * u;
    return (
      <g strokeLinejoin="round" strokeLinecap="round">
        {shadow}
        <path d={blob(p.x, y - ry * 0.25, rx, ry, p.seed)} fill={mixColor(LAND, INK, 0.22)} stroke={DARK} strokeWidth={4 * u} />
        <path d={`M${(p.x - rx * 0.6).toFixed(1)},${(y - ry * 0.4).toFixed(1)}Q${(p.x - rx * 0.4).toFixed(1)},${(y - ry * 1.05).toFixed(1)} ${(p.x + rx * 0.2).toFixed(1)},${(y - ry * 1.0).toFixed(1)}`} stroke={line} strokeWidth={2 * u} fill="none" />
        <path d={`M${(p.x + rx * 0.15).toFixed(1)},${(y - ry * 0.05).toFixed(1)}l${(rx * 0.3).toFixed(1)},${(-ry * 0.4).toFixed(1)}M${(p.x + rx * 0.45).toFixed(1)},${(y - ry * 0.12).toFixed(1)}l${(rx * 0.25).toFixed(1)},${(-ry * 0.35).toFixed(1)}`} stroke={DARK} strokeWidth={2.2 * u} fill="none" strokeOpacity={0.8} />
      </g>
    );
  }
  if (p.t === "stump") {
    const rx = (p.w / 2) * u;
    const h = 34 * u;
    const ey = 8 * u;
    return (
      <g strokeLinejoin="round" strokeLinecap="round">
        {shadow}
        <path d={`M${p.x - rx},${y - h}L${p.x - rx},${y}Q${p.x},${y + ey * 1.4} ${p.x + rx},${y}L${p.x + rx},${y - h}Z`} fill={PLANE} stroke={DARK} strokeWidth={4 * u} />
        <ellipse cx={p.x} cy={y - h} rx={rx} ry={ey} fill={mixColor(LAND, INK, 0.3)} stroke={DARK} strokeWidth={3.4 * u} />
        <ellipse cx={p.x} cy={y - h} rx={rx * 0.55} ry={ey * 0.5} fill="none" stroke={line} strokeWidth={1.6 * u} />
        <path d={`M${(p.x - rx * 0.7).toFixed(1)},${(y - h * 0.7).toFixed(1)}L${(p.x - rx * 0.7).toFixed(1)},${(y - h * 0.1).toFixed(1)}M${(p.x - rx * 0.2).toFixed(1)},${(y - h * 0.75).toFixed(1)}L${(p.x - rx * 0.2).toFixed(1)},${(y - h * 0.05).toFixed(1)}`} stroke={line} strokeWidth={1.8 * u} />
      </g>
    );
  }
  if (p.t === "trough") {
    // a hollowed log lying across the yard
    const hw = (p.w / 2) * u;
    const h = 30 * u;
    const ey = 7 * u;
    return (
      <g strokeLinejoin="round" strokeLinecap="round">
        {shadow}
        <path d={`M${p.x - hw},${y - h}Q${p.x - hw - 8 * u},${y - h * 0.4} ${p.x - hw + 6 * u},${y}L${p.x + hw - 6 * u},${y}Q${p.x + hw + 8 * u},${y - h * 0.4} ${p.x + hw},${y - h}Z`} fill={PLANE} stroke={DARK} strokeWidth={4 * u} />
        <ellipse cx={p.x} cy={y - h} rx={hw} ry={ey} fill={DARK} fillOpacity={0.85} stroke={line} strokeWidth={2 * u} />
        <path d={Array.from({ length: 5 }, (_, j) => `M${(p.x - hw * 0.8 + j * hw * 0.4).toFixed(1)},${(y - h * 0.55).toFixed(1)}l${(hw * 0.12).toFixed(1)},${(h * 0.3).toFixed(1)}`).join("")} stroke={line} strokeWidth={1.6 * u} strokeOpacity={0.7} />
      </g>
    );
  }
  // a woven basket
  const bw = (p.w / 2) * u;
  const h = 34 * u;
  const ey = 6 * u;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {shadow}
      <path d={`M${p.x - bw},${y - h}L${p.x - bw * 0.8},${y}L${p.x + bw * 0.8},${y}L${p.x + bw},${y - h}Z`} fill={PLANE} stroke={DARK} strokeWidth={3.6 * u} />
      <path d={[0.3, 0.55, 0.8].map((r) => `M${(p.x - bw * (0.8 + 0.2 * r)).toFixed(1)},${(y - h * r).toFixed(1)}L${(p.x + bw * (0.8 + 0.2 * r)).toFixed(1)},${(y - h * r).toFixed(1)}`).join("")} stroke={line} strokeWidth={1.6 * u} strokeOpacity={0.8} />
      <ellipse cx={p.x} cy={y - h} rx={bw} ry={ey} fill={DARK} fillOpacity={0.8} stroke={line} strokeWidth={1.8 * u} />
    </g>
  );
};
const Hurdle: React.FC = () => {
  const line = lineOf(0.38);
  const n = 5;
  const pts = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const s = HURDLE[0][1] + (HURDLE[1][1] - HURDLE[0][1]) * u;
    const x = HURDLE[0][0] + (HURDLE[1][0] - HURDLE[0][0]) * u;
    return { x, s, y: gy(s), h: 48 * s };
  });
  let rails = "";
  [0.3, 0.62, 0.9].forEach((r) => {
    pts.slice(0, -1).forEach((p, i) => {
      const q = pts[i + 1];
      rails += `M${p.x.toFixed(1)},${(p.y - p.h * r).toFixed(1)}L${q.x.toFixed(1)},${(q.y - q.h * r).toFixed(1)}`;
    });
  });
  const sw = pts[0].s;
  return (
    <g strokeLinecap="round">
      <path d={`M${pts.map((p) => `${p.x.toFixed(1)},${(p.y + 2 * p.s).toFixed(1)}`).join("L")}`} stroke={DARK} strokeWidth={9 * sw} strokeOpacity={0.3} fill="none" />
      <path d={rails} fill="none" stroke={DARK} strokeWidth={6 * sw} strokeOpacity={0.8} />
      <path d={rails} fill="none" stroke={line} strokeWidth={3 * sw} strokeOpacity={0.8} />
      {pts.map((p, i) => (
        <g key={i}>
          <path d={`M${p.x.toFixed(1)},${(p.y + 3 * p.s).toFixed(1)}L${p.x.toFixed(1)},${(p.y - p.h - 8 * p.s).toFixed(1)}`} stroke={DARK} strokeWidth={9 * p.s} />
          <path d={`M${p.x.toFixed(1)},${(p.y + 3 * p.s).toFixed(1)}L${p.x.toFixed(1)},${(p.y - p.h - 8 * p.s).toFixed(1)}`} stroke={line} strokeWidth={4.4 * p.s} />
        </g>
      ))}
    </g>
  );
};
/** the middle ground, far to near (the hurdle at its own depth among the props), sunk toward the page */
const YardMiddle: React.FC = () => {
  const hs = HURDLE[0][1];
  return (
    <g filter="url(#sinkYard)">
      {PROPS.filter((p) => p.s < hs).map((p) => <PropArt key={p.seed} p={p} />)}
      <Hurdle />
      {PROPS.filter((p) => p.s >= hs).map((p) => <PropArt key={p.seed} p={p} />)}
    </g>
  );
};

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
  const y = gy(it.s);
  if (it.t === "p" && it.act === "cougher")
    return <TurnFarmerBunSafe pose={idle(cougherPose(f), f, it.seed, 0.6)} at={[it.x, y]} scale={it.s} uid={uid} woman={it.woman} hold="none" seed={it.seed} />;
  if (it.t === "p" && it.act === "look")
    return <TurnFarmer pose={idle(lookPose(it.pose, f), f, it.seed)} at={[it.x, y]} scale={it.s} uid={uid} hold={it.hold} seed={it.seed} />;
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
        graze={it.grazeLife ? (0.15 + 0.15 * Math.sin(f / 23)) * (1 - (it.walk ? Math.max(0, Math.min(1, (f - it.walk[0]) / 6, (it.walk[1] - f) / 6)) : 0)) + 0.5 * smoother((f - 150) / 16) : it.grazeAt ? ramp(f, it.grazeAt[0], it.grazeAt[1]) : (it.graze ?? 0) * (it.walk ? 1 - Math.max(0, Math.min(1, (f - it.walk[0]) / 6, (it.walk[1] - f) / 6)) : 1)}
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
        props: { frame, k, sources: BAND_SOURCES[i], density: 0.7, life: 110, spread: 0.7 * q * growB, wander: 30 * q * growB, drift: [0.1 * q * growB, -(front ? 0.3 : 0.12) * q * growB], mote: 2.3 + (front ? 1.1 : 0.5) * close, microbe: 0, rodShare: 0, maxMotes: 14000, opacity: 0.62 + 0.23 * close, seed: i + 1 },
      });
    // a reached person's own dots: born at the outline, they stay close round it (behind the figure: never on a face)
    if (BAND_PEOPLE[i].length)
      out.push({
        band: i,
        place: "behind",
        props: { frame, k, sources: BAND_PEOPLE[i], density: 0.75, life: 80, spread: 0.35 * q * growB, wander: 14 * q * growB, drift: [0, -0.05 * q], mote: 2.3 + (front ? 1.1 : 0.5) * close, microbe: 0, rodShare: 0, maxMotes: 14000, opacity: 0.66 + 0.24 * close, seed: i + 101 },
      });
  });
  // the routes (V3): small dense streams from a source to a person (behind that person's band) or into a door
  ROUTES.forEach((g, ri) => {
    const bi = BANDS.findIndex((b) => b.s === routeBand(g));
    if (frame < g.t0 || bi < 0) return;
    const q = g.to.s / S0;
    const front = g.to.s >= RA;
    const src = g.from;
    const at = src[0] === "goat" || src[0] === "p" ? (f: number) => outOf(src[0], src[1], src[2], f) : outOf(src[0], src[1], src[2]);
    const ss = src[1];
    // a tight clump at the source (a wide emission ellipse reads as a ring round it)
    const rxy = src[0] === "cow" ? [40, 20] : src[0] === "goat" ? [30, 16] : src[0] === "dung" ? [44, 16] : src[0] === "house" ? [40, 22] : [24, 30];
    // a short hang at the source, then a long slow draw to the end: the first dots arrive at ~ta
    const hang = Math.min(18, Math.max(5, g.td - g.t0));
    // a person's cloud gathers at the shoulder edge facing its source, so half of it shows round the outline
    const s0 = outOf(src[0], src[1], src[2], g.t0);
    const e0 = g.to.kind === "door" ? outOf("house", g.to.s, g.to.x) : endAt(g.to, g.ta);
    const dst: P2 = g.to.kind === "door" ? e0 : [e0[0] + Math.sign(s0[0] - e0[0] || 1) * 42 * g.to.s, e0[1] - 16 * g.to.s];
    out.push({
      band: bi,
      place: g.to.kind === "door" ? "over" : "behind",
      props: {
        frame,
        k,
        sources: [{ at, rx: rxy[0] * ss, ry: rxy[1] * ss, rate: (g.rate ?? 1) * (front ? 1.3 : 0.7) * (g.t0 < 60 ? 1.5 : 1), from: g.t0, until: g.until ?? g.ta + 24 }],
        targets: [dst],
        travel: 1,
        travelAt: hang,
        travelTime: Math.max(12, (g.ta - g.t0 - hang) / 1.1),
        settle: (g.to.kind === "door" ? 22 : 76) * g.to.s,
        absorb: g.to.kind === "door",
        life: 70,
        spread: 0.35 * q * growB,
        wander: 12 * q * growB,
        drift: [0, -0.06 * q],
        mote: 2.3 + (front ? 1.1 : 0.5) * close,
        microbe: 0,
        rodShare: 0,
        maxMotes: 1200,
        opacity: 0.7 + 0.2 * close,
        seed: 40 + ri,
      },
    });
  });
  return out;
};

const BredInTheVillageV3: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const layers = germLayers(frame);
  const germsAt = (band: number, place: GermLayer["place"]) => layers.filter((l) => l.band === band && l.place === place).map((l, j) => <Germs key={`${place}${j}`} {...l.props} />);
  const close = Math.max(0, Math.min(1, (cam.k - K_END) / (1 - K_END)));
  const moteFront = 2.3 + 1.1 * close;
  const sinks = BANDS.map((b, i) => (sinkOf(b.s) > 0.01 ? <SinkFilter key={i} id={`sink${i}`} t={sinkOf(b.s)} /> : null));
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={cam} defs={[...sinks, <SinkFilter key="yard" id="sinkYard" t={YARD_SINK} />]}>
          {/* one ground under the whole village, the front row and the yard: no ground line, no seam */}
          <ForeGround k={cam.k} />
          {BANDS.map((b, i) => {
            const t = sinkOf(b.s);
            return (
              <React.Fragment key={i}>
                {/* the yard's middle ground: after the front row, before the near group */}
                {b.s === NS_FENCE ? <YardMiddle /> : null}
                {/* nothing of the dots (or the hoe's blade in the heap) shows below the ground its band stands on */}
                <clipPath id={`gnd${i}`}>
                  <rect x={-1e5} y={-1e5} width={2e5} height={1e5 + gy(b.s) + 10 * b.s} />
                </clipPath>
                <g clipPath={`url(#gnd${i})`}>{germsAt(i, "behind")}</g>
                <g filter={t > 0.01 ? `url(#sink${i})` : undefined}>
                  {b.items.map((it, j) => (
                    <React.Fragment key={j}>
                      {it.t === "p" && it.act === "hoe" ? (
                        <g clipPath={`url(#gnd${i})`}>
                          <ItemArt it={it} f={frame} uid={`b${i}i${j}`} />
                        </g>
                      ) : (
                        <ItemArt it={it} f={frame} uid={`b${i}i${j}`} />
                      )}
                      {/* the hoe's dots ride on its blade, under the dung heap (drawn next), so the heap hides them while the blade is in it */}
                      {it.t === "p" && it.act === "hoe" ? (
                        <g clipPath={`url(#gnd${i})`}>
                          <Dots dots={bladeDotsAt(frame)} k={cam.k} mote={moteFront} />
                        </g>
                      ) : null}
                      {/* the colony multiplies on the central heap's face */}
                      {it.t === "dung" && it.s === R0 && it.x === 880 ? <Dots dots={colonyAt(frame)} k={cam.k} mote={moteFront} /> : null}
                    </React.Fragment>
                  ))}
                </g>
                {germsAt(i, "over")}
              </React.Fragment>
            );
          })}
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

export default BredInTheVillageV3;
