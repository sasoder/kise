// ---------------------------------------------------------------------------
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
  POSES,
  aimTool,
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
const FG_SINK = 0.66;

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
};
type BeastSpec = {
  t: "goat" | "cow";
  s: number;
  x: number;
  dir: 1 | -1;
  graze?: number;
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
};
type DungSpec = { t: "dung"; s: number; x: number; w: number; seed: number };
type Item = PersonSpec | BeastSpec | HouseSpec | FenceSpec | DungSpec;

const P = POSES;
// THE SICKLE (COMMON.md ruling): never held low in front of the body (at phone size the orange curve at the
// crotch reads as urination). It is carried blade-up in the near hand at chest height, or hooked over the shoulder.
const SICKLE_UP_R: FigPose = aimTool({ ...POSES.stand(1), armL: { w: [30, -206], elbow: [-0.6, 1], fist: 1, hand: 0 } }, -8);
const SICKLE_SHOULDER_R: FigPose = aimTool({ ...POSES.stand(1), armL: { w: [24, -216], elbow: [-0.2, 1], fist: 1, hand: 0 } }, -150);
const sickleUp = (dir: 1 | -1) => (dir === 1 ? SICKLE_UP_R : mirrorPose(SICKLE_UP_R));
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
  { t: "p", s: R0, x: 470, pose: P.stand(1), woman: true, seed: 2 },
  { t: "p", s: R0, x: 700, pose: sickleUp(-1), seed: 3 },
  { t: "dung", s: R0, x: 930, w: 230, seed: 1 },
  { t: "p", s: R0, x: -170, pose: P.stand(1), woman: true, seed: 5 },
  { t: "p", s: R0, x: -320, pose: P.hoeShoulder(1), hold: "hoe", seed: 4 },
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
  { t: "p", s: R0, x: 1530, pose: P.stand(-1), woman: true, seed: 8 },
  { t: "dung", s: R0, x: -560, w: 200, seed: 2 },
  { t: "p", s: R0, x: -900, pose: sickleShoulder(1), seed: 9 },
  { t: "p", s: R0, x: 1980, pose: P.hoeShoulder(-1), hold: "hoe", seed: 22 },
  // ---- the front pens: goats and cows behind wattle fences, beside the people
  { t: "goat", s: RA, x: 920, dir: -1, seed: 1 },
  { t: "goat", s: RA, x: 1110, dir: 1, graze: 1, seed: 2 },
  { t: "p", s: RA, x: 1270, pose: P.stand(-1), woman: true, seed: 23 },
  { t: "cow", s: RA, x: -190, dir: 1, seed: 3 },
  { t: "goat", s: RA, x: -520, dir: 1, graze: 0.7, seed: 4 },
  { t: "goat", s: RA, x: 1560, dir: -1, graze: 0.6, seed: 5 },
  { t: "cow", s: RA, x: 1800, dir: -1, seed: 6 },
  { t: "fence", s: RF, x0: 780, x1: 1250, seed: 1 },
  { t: "fence", s: RF, x0: -640, x1: 200, seed: 2 },
  { t: "fence", s: RF, x0: 1450, x1: 2000, seed: 4 },
  // ---- the first longhouses: one right behind the pair, the next one off to the right
  { t: "house", s: RH1, x: 560, len: 1450, seed: 1 },
  { t: "house", s: RH1, x: 3000, len: 1750, seed: 2 },
  // ---- the yards behind them, seen in the gaps between the houses
  { t: "p", s: RY1, x: -820, pose: P.stand(1), woman: true, seed: 10 },
  { t: "p", s: RY1, x: -680, pose: sickleShoulder(-1), seed: 11 },
  { t: "p", s: RY1, x: 1680, pose: P.hoeShoulder(-1), hold: "hoe", seed: 12 },
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
  { t: "p", s: RY3, x: 1060, pose: sickleUp(-1), seed: 18 },
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
/** the houses' own haze lives shorter (there are many of them) */
const HOUSE_LIFE = 300;
/** the village is most crowded round its middle: the sources there breed a little more (and the layout packs them closer) */
const crowd = (x: number) => 0.3 + 0.9 * Math.exp(-(((x - 540) / 1300) ** 2));
/** the veil over the roofs: thickest over the middle, thinning to nothing at the village's edges */
const veil = (x: number) => Math.exp(-(((x - 540) / 1150) ** 2));
const sourcesOf = (it: Item, front: boolean): GermSource[] => {
  const y = gy(it.s);
  const q = (it.s / S0) * crowd(it.t === "fence" ? (it.x0 + it.x1) / 2 : it.x);
  const from = front ? -90 : undefined;
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
const BAND_SOURCES = BANDS.map((b) =>
  b.items
    .filter((it) => it.t !== "house")
    .flatMap((it) => sourcesOf(it, b.s >= RA)),
);
const HOUSE_SOURCES = BANDS.map((b) =>
  b.items
    .filter((it) => it.t === "house")
    .flatMap((it) => sourcesOf(it, false)),
);
/** the few legible microbes: off the front pair, the child and the dung heap */
const MICROBE_SOURCES: GermSource[] = ITEMS.filter(
  // off the pair and the child only (the dung heap's microbes would swim at the men's hip height)
  (it) => it.t === "p" && it.s === R0 && Math.abs(it.x - 600) < 420,
).flatMap((it) =>
  sourcesOf(it, true).map((g) => ({
    ...g,
    // born round the head and shoulders, never down at the hips
    at: [(g.at as P2)[0], (g.at as P2)[1] - 60 * it.s] as P2,
    rx: (g.rx ?? 40) * 1.9,
    ry: (g.ry ?? 40) * 0.8,
    rate: 0.015,
    from: -160,
  })),
);
const FRONT_BAND = BANDS.findIndex((b) => b.s === R0);
/** a body's emission ellipse / a person's chest, by kind, depth and x (from ITEMS) */
const itemAt = (t: Item["t"], s: number, x: number) => {
  const it = ITEMS.find((q) => q.t === t && q.s === s && "x" in q && q.x === x);
  if (!it) throw new Error(`BredInTheVillage: no ${t} at ${s} / ${x}`);
  return it;
};
const chestOf = (s: number, x: number): P2 => {
  const it = itemAt("p", s, x) as PersonSpec;
  const A = farmAnchors("farmer", it.pose, [it.x, gy(it.s)], it.s, it.woman, it.child);
  // the upper torso: below the face, well above the belt
  return [A.chest[0] + (A.hip[0] - A.chest[0]) * 0.2, A.chest[1] + (A.hip[1] - A.chest[1]) * 0.2];
};
/** the travellers' routes: from an animal to the person beside it, at body height (never up from the ground past
 *  the legs); they start once the pens are open */
const TRAVEL: { src: GermSource; to: P2 }[] = (
  [
    ["goat", RA, 920, R0, 700],
    ["goat", RA, 1110, R0, 1260],
    ["cow", RA, -190, R0, 330],
    ["goat", RA, -520, R0, -320],
    ["goat", RA, 1560, R0, 1400],
    ["cow", RA, 1800, R0, 1980],
    ["goat", RY1, 2000, RY1, 1820],
  ] as [Item["t"], number, number, number, number][]
).map(([t, s, x, ts, tx], j) => {
  // they leave the animal's back and shoulders (never its belly: nothing orange travels at hip height)
  const g = sourcesOf(itemAt(t, s, x), false)[0];
  const at = g.at as P2;
  return { src: { ...g, at: [at[0], at[1] - 45 * s] as P2, ry: (g.ry ?? 40) * 0.5, rate: 0.024, from: 40 + 9 * j }, to: chestOf(ts, tx) };
});

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
  if (it.t === "p")
    return (
      <Farmer
        pose={idle(it.pose, f, it.seed)}
        at={[it.x, y]}
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
        at={[it.x, y]}
        scale={it.s}
        dir={it.dir}
        g={f + it.seed * 37}
        graze={it.graze ?? 0}
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
  if (it.t === "fence")
    return <WattleFence x0={it.x0} x1={it.x1} y={y} s={it.s} seed={it.seed} />;
  if (it.t !== "dung") return null;
  return <DungHeap x={it.x} y={y} s={it.s} w={it.w} seed={it.seed} />;
};

/** every germ layer at frame f: which band it belongs to, whether it is drawn behind that band's figures or over
 *  them, and its Germs props (exported for the mote count in the review) */
export type GermLayer = { band: number; place: "behind" | "over" | "veil" | "top"; props: GermsProps };
export const germLayers = (frame: number): GermLayer[] => {
  const k = camAt(frame).k;
  // the clouds spread further as the village grows round them (world px; a pure function of the zoom, smooth)
  const grow = (1 / k) ** 0.6;
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
        props: { frame, k, sources: BAND_SOURCES[i], density: 1.75, life: LIFE, spread: 1.0 * q * growB, wander: 70 * q * growB, drift: [0.12 * q * growB, -(front ? 0.4 : 0.15) * q * growB], mote: 2.3 + (front ? 1.1 : 0.5) * close, microbe: 0, rodShare: 0.03, maxMotes: 14000, opacity: 0.62 + 0.23 * close, seed: i + 1 },
      });
    if (BAND_SOURCES[i].length)
      out.push({
        band: i,
        place: "behind",
        // the share that lifts off the crowd and hangs above the heads, among the roofs: long-lived, wide, slow
        props: { frame, k, sources: BAND_SOURCES[i].map((g) => ({ ...g, rate: (g.rate ?? 1) * 0.15 * veil(typeof g.at === "function" ? 540 : g.at[0]) })), density: 1.75, life: 340, spread: 1.3 * q * grow, wander: 130 * q * grow, drift: [0.2 * q * grow, -0.45 * q * grow], mote: 2.3, microbe: 0, rodShare: 0.03, maxMotes: 14000, opacity: 0.8, seed: i + 31 },
      });
    if (HOUSE_SOURCES[i].length)
      out.push({
        band: i,
        // every row's veil is drawn over all the houses (one cloud among the roofs), under the pens and the front row
        place: "veil",
        // the veil: a flat, slowly churning layer over the roofs (it drifts sideways, hardly rises)
        props: { frame, k, sources: HOUSE_SOURCES[i], density: 1.75, life: HOUSE_LIFE, spread: 0.9 * q * grow, wander: 130 * q * grow, drift: [0.22 * q * grow, -0.06 * q * grow], mote: 2.0, microbe: 0, rodShare: 0.03, maxMotes: 14000, opacity: 0.9, seed: i + 51 },
      });
  });
  out.push({
    // behind the front row: the microbes swim in the air round the pair, never over a face
    band: FRONT_BAND,
    place: "behind",
    // (world-fixed: they stay round the pair at body height in the wide too)
    props: { frame, k, sources: MICROBE_SOURCES, life: 260, spread: 1.6, wander: 60, drift: [0.1, -0.7], microbe: 44, microbeShare: 1, rodShare: 0, seed: 99 },
  });
  // the travellers: single legible microbes leaving an animal or a dung heap and swimming to a person's chest
  // (~35 frames on the way, then they sink in); they begin once the pull-back has opened the pens up
  TRAVEL.forEach((tr, j) =>
    out.push({
      band: FRONT_BAND,
      place: "top",
      props: { frame, k, sources: [tr.src], targets: [tr.to], travel: 1, travelAt: 6, travelTime: 34, settle: 18, absorb: true, life: 70, spread: 0.6 * grow, wander: 14 * grow, microbe: 44, microbeShare: 1, rodShare: 0, seed: 200 + j },
    }),
  );
  return out;
};

const BredInTheVillage: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const layers = germLayers(frame);
  const germsAt = (band: number, place: GermLayer["place"]) => layers.filter((l) => l.band === band && l.place === place).map((l, j) => <Germs key={`${place}${j}`} {...l.props} />);
  const soft = (
    <filter key="veilSoft" id="veilSoft" x="-10%" y="-30%" width="120%" height="160%" colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={9 / cam.k} />
      <feComponentTransfer>
        <feFuncA type="linear" slope={3.2} />
      </feComponentTransfer>
    </filter>
  );
  const sinks = BANDS.map((b, i) => (sinkOf(b.s) > 0.01 ? <SinkFilter key={i} id={`sink${i}`} t={sinkOf(b.s)} /> : null));
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={cam} defs={[soft, ...sinks]}>
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
                    <ItemArt key={j} it={it} f={frame} uid={`b${i}i${j}`} />
                  ))}
                </g>
                {germsAt(i, "over")}
                {b.s === RH1 ? (
                  <>
                    {/* the veil's body: the same motes, softened into one hanging cloud (dim, no glow), under its stipple */}
                    <g filter="url(#veilSoft)" opacity={0.42}>
                      {BANDS.map((_, j) => germsAt(j, "veil"))}
                    </g>
                    {BANDS.map((_, j) => germsAt(j, "veil"))}
                  </>
                ) : null}
              </React.Fragment>
            );
          })}
          {germsAt(FRONT_BAND, "top")}
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

export default BredInTheVillage;
