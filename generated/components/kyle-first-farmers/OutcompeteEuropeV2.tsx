// ---------------------------------------------------------------------------
// OutcompeteEuropeV2 (kyle-first-farmers, cut 58; cold-review pass on OutcompeteEurope, which stays as delivered).
// Dwarkesh map style (styles/dwarkesh-map.md). Opaque 1080x1920, 29.97 fps, 166 frames.
// The Neolithic Europe world of firstFarmersMap.tsx and the V2 front model (neolithicFrontV2.ts, baked by
// scripts/clips/kyle-first-farmers/bake-neolithic-front-v2.mjs); the V2 layers in firstFarmersMapV2.tsx.
//
// CHECK LINE: "the farming population spread out of Anatolia across Europe and, by sheer numbers, squeezed the
// hunter-gatherers to the edges — most of the map turns orange, a few cream groups survive."
//
// THE LINE (sequence 58.16-63.70 s): "...They're growing faster, that they, you know, quote unquote, outcompete the
// hunter-gatherer populations, say, of Europe" (the cut then returns to Kyle: "that are largely but not completely
// displaced").
// WORD -> FRAME: they 2 · you know 16-28 · quote 32 · unquote 37 · outcompete 44 · the 64 · hunter 71 · -gatherer 87 ·
// populations 97 · say 112 · of 125 · Europe 128 · (that 156, Kyle continues)
// DURATION: the slot 58.1581 -> 63.6970 s = 5.539 s x 29.97 = 166 frames (f0..f165).
//
// THE MOTION: one damped pull-back. It opens close on a small orange core at Catalhoyuk (central Anatolia, ~7000 BC,
// sparse orange dots, cream foragers all round) that grows and fills as the front runs west across Anatolia; the camera
// follows the front's leading edge (held near screen y 800-850) to the Aegean by "outcompete" (f44, ~6500 BC) and
// stays close along it (k 2.6 -> 2.0) through Greece and the Balkans to the Danube by "populations" (f100, ~5900 BC):
// here a phone sees the dots meet — ahead of the front the cream foragers back off downhill (away from the farmers),
// bunch, and some slide into a neighbour or flee into a pocket (fewer); at the front each is caught and turns orange
// one at a time; behind it the orange dots split out of each other and fill the land (sparse -> dense). Then the camera
// pulls back to Europe (k 1.2 by ~f128) while the front sweeps the Mediterranean, central Europe, Britain and southern
// Scandinavia (3800 BC at f140, ~3600 BC at f165). EUROPE slides up over central Europe f119-128 (thin dark stroke). Resolved frame:
// orange from Anatolia to Britain and Denmark; cream along the Baltic, Finland, northern Scandinavia and the east,
// and cream crowds in three clearings (the Alpine arc, the eastern Carpathians, the Breton fringe). Last frames: the
// front still creeps into Sweden, dots drift, Britain fills, the camera creeps (k 1.2 -> 1.23). No deaths here (that
// is cut 92). Orange = the farmers (hatch + dots); cream = the foragers. No arrows, ships, years or other labels.
//
// SOURCES: arrival dates (cal BC) of first farming at 21 dated anchors from Pinhasi, Fort & Ammerman 2005, PLoS
// Biology 3(12): e410, and Shennan 2018, The First Farmers of Europe (CUP) — the table is in
// scripts/maps/configs/firstfarmers.mjs (ANCHORS). V2 MODEL: the spread starts from one core at Catalhoyuk (the
// earliest dated anchor, 7100 BC); the Fertile Crescent origin further east (Levant, Mesopotamia, Cyprus, the
// Caucasus) is outside this variant's model, left as plain land. Approximate model constraints and the three pockets
// (terrain-favoured forager refugia; foragers lived beside farmers into the 4th millennium BC, e.g. Blatterhohle,
// Bollongino et al. 2013, Science 342: 479) are in the v2 bake script. Dot counts are schematic. No year on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { MapPage, WorldSvg, pchip, runCamera, type CamKey } from "./firstFarmersMap";
import { FarmedLandV2, LabelSeat, PopulationDotsV2 } from "./firstFarmersMapV2";
import { project } from "./firstFarmersEuropeMapData";
import { farmedArea, makePopulation, makeTimeline } from "./neolithicFrontV2";

export const FPS = 30000 / 1001;
export const DURATION = 166;
export const schema = z.object({ vignette: z.number().min(0).max(1) });
export const defaultProps = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// The camera (world px; k 1 = the old Europe wide): the core -> along the front -> Europe at k 1.2
// ---------------------------------------------------------------------------
export const CAM: CamKey[] = [
  { f: -20, x: 982, y: 1290, k: 4.5 },
  { f: 0, x: 975, y: 1286, k: 4.4 },
  { f: 24, x: 850, y: 1292, k: 2.8 },
  { f: 42, x: 818, y: 1252, k: 2.8 },
  { f: 64, x: 786, y: 1168, k: 2.8 },
  { f: 114, x: 495, y: 940, k: 1.24 },
  { f: 165, x: 496, y: 939, k: 1.25 },
  { f: 200, x: 497, y: 938, k: 1.255 },
];

// ---------------------------------------------------------------------------
// The front's date of frame: anchored on the words, area-even in between (farmed land weighted by 1 / k^1.5)
// ---------------------------------------------------------------------------
export const DATE_KEYS: [number, number][] = [
  [0, 7015],
  [42, 6480],
  [64, 6150],
  [100, 5120],
  [140, 3800],
  [165, 3610],
];
const AREA_BOX = { x0: -50, y0: 150, x1: 1300, y1: 1450 };
const DATES = (() => {
  const Ts: number[] = [];
  const As: number[] = [];
  for (let T = 7100; T >= 3500; T -= 5) {
    Ts.push(T);
    As.push(farmedArea(T, AREA_BOX));
  }
  const areaOf = (T: number) => {
    for (let i = 1; i < Ts.length; i++)
      if (Ts[i] <= T) {
        const t = (T - Ts[i - 1]) / (Ts[i] - Ts[i - 1]);
        return As[i - 1] + (As[i] - As[i - 1]) * t;
      }
    return As[As.length - 1];
  };
  const dateOf = (a: number) => {
    for (let i = 1; i < As.length; i++)
      if (As[i] >= a && As[i] > As[i - 1]) {
        const t = (a - As[i - 1]) / (As[i] - As[i - 1]);
        if (t <= 1) return Ts[i - 1] + (Ts[i] - Ts[i - 1]) * Math.max(0, t);
      }
    return Ts[Ts.length - 1];
  };
  const w = (f: number) => Math.pow(runCamera(CAM, f).k, -1.5) * (f < 140 ? 1 : 1 - 0.6 * Math.min(1, (f - 140) / 25));
  const out: number[] = [];
  for (let s = 0; s < DATE_KEYS.length - 1; s++) {
    const [fa, Ta] = DATE_KEYS[s];
    const [fb, Tb] = DATE_KEYS[s + 1];
    const cum = [0];
    for (let f = fa + 1; f <= fb; f++) cum.push(cum[cum.length - 1] + w(f - 0.5));
    // the first stretch grows the core evenly in RADIUS (sqrt of area), the rest evenly in area
    const g = s === 0 ? 0.5 : 1;
    const a0 = Math.pow(areaOf(Ta), g);
    const a1 = Math.pow(areaOf(Tb), g);
    for (let f = fa; f < fb; f++) out.push(dateOf(Math.pow(a0 + ((a1 - a0) * cum[f - fa]) / cum[cum.length - 1], 1 / g)));
  }
  out.push(DATE_KEYS[DATE_KEYS.length - 1][1]);
  // smooth the speed across the anchors from f30 on (a Gaussian of 6 frames over the dates, ends extended linearly: still monotone)
  const n = out.length;
  const at = (f: number) => (f < 0 ? out[0] + (out[0] - out[1]) * -f : f >= n ? out[n - 1] + (out[n - 1] - out[n - 2]) * (f - n + 1) : out[f]);
  const sm = out.map((_, f) => {
    if (f < 30) return out[f]; // the core's opening is left as it is (its first frames hold the dated start)
    let a = 0;
    let wsum = 0;
    for (let d = -18; d <= 18; d++) {
      const g = Math.exp(-(d * d) / (2 * 36));
      a += g * at(f + d);
      wsum += g;
    }
    return a / wsum;
  });
  for (let f = 1; f < n; f++) sm[f] = Math.min(sm[f], sm[f - 1] - 0.5);
  return sm;
})();
const dateCurve = pchip(DATES.map((d, f) => [f, d] as [number, number]));
const LAST = DATES.length - 1;
const SLOPE_END = DATES[LAST] - DATES[LAST - 1];
// before f0 the population clock runs slowly back (1 year a frame: the core's first farmers are there at f0); after
// f165 the creep continues
export const TIMELINE = makeTimeline((f) => (f < 0 ? DATES[0] - 1 * f : f > LAST ? DATES[LAST] + SLOPE_END * (f - LAST) : dateCurve(f)), -150, DURATION + 6);
const POP = makePopulation(TIMELINE, { fillLag: 20, pioneers: 0.5, slideLead: 20, retreat: 42, fleeLead: 26, absorb: 5, farmerSize: 0.86, lateFrom: 110, lateFill: 8, latePioneers: 0.75, emerge: 7, pioneerShift: -6 });
// dots: a forager is ~14.6 px at the hero (k 2.8: ~3.7 px in a 270 px frame), ~8.6 px in the Europe wide; farmers 0.86x
const dotD = (k: number) => 7.5 * Math.pow(k, 0.65);
// the farmed land recedes in the wide so the dots carry it (hatch 0.45 -> 0.28, wash 0.3 -> 0.2 below k 1.6)
const landMix = (k: number) => Math.min(1, Math.max(0, (k - 1.3) / 0.5));

// EUROPE: slides up f119 -> settled f128 (its word), on the land's centre over Germany (11.9 E, 50.4 N), clear
// of the pocket rings and the last arrivals (Britain, Denmark, Sweden); the style's thin dark stroke, no halo
export const LABEL_AT = project(11.9, 50.4);
export const LABEL_APPEAR = 119;

const OutcompeteEuropeV2: React.FC<z.infer<typeof schema>> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);
  const T = TIMELINE.dateAt(frame);
  return (
    <MapPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <FarmedLandV2 T={T} cam={cam} id="oe2" wash={0.2 + 0.1 * landMix(cam.k)} hatch={0.28 + 0.17 * landMix(cam.k)} />
        <PopulationDotsV2 pop={POP} f={frame} cam={cam} d={dotD(cam.k)} />
        <LabelSeat x={LABEL_AT[0]} y={LABEL_AT[1]} text="EUROPE" appear={LABEL_APPEAR} dur={9} frame={frame} cam={cam} cap={46} spacing={0.34} halo={0} stroke={0.14} id="oe2-label" />
      </WorldSvg>
    </MapPage>
  );
};

export default OutcompeteEuropeV2;
