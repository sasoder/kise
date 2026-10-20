// ---------------------------------------------------------------------------
// firstFarmersOpening: the SPREAD's shared state, so a later cut (cut I) can open on cut F's (OutcompeteEurope)
// Aegean opening, or on any of its frames, pixel for pixel. Read-only once MAP_READY.md lists it; additions only.
//
//   SPREAD_CAM        cut F's camera keys (world px; runCamera(SPREAD_CAM, f)): the Aegean at k 3 (f0), the front's
//                     leading edge held near screen y 800-850 through the pull-back, the Europe wide by ~f116
//                     ({491, 1000, 1}: the land's centre near y 740, North Cape y ~180), a creep to k 1.02 by f165
//   SPREAD_DURATION   166 (cut F's frames)
//   T0, T140          6600 BC at f0, 3800 BC at f140
//   SPREAD_TIMELINE   the front's date of frame (dateAt) and its inverse (frameOf); before f0 the clock runs back at
//                     6 years a frame (the Anatolian farmers were born long before)
//   SPREAD_POP        the dot sets of cut F (makePopulation(SPREAD_TIMELINE, SPREAD_POP_OPTS))
//   spreadAt(f)       { cam, T } of cut F's frame f
// A cut that opens on cut F's first frame draws <MapPage cam> + <FarmedLand T cam hatch={0.45} wash={0.3} /> +
// <PopulationDots pop={SPREAD_POP} f={0} cam /> with spreadAt(0) (and continues with its own clock from there).
// ---------------------------------------------------------------------------
import { pchip, runCamera, type CamKey } from "./firstFarmersMap";
import { farmedArea, makePopulation, makeTimeline, type PopulationOpts } from "./neolithicFront";

export const SPREAD_DURATION = 166;
export const SPREAD_CAM: CamKey[] = [
  { f: -20, x: 830, y: 1240, k: 3.2 },
  { f: 0, x: 815, y: 1232, k: 3.0 },
  { f: 40, x: 712, y: 1160, k: 2.0 },
  { f: 78, x: 565, y: 1124, k: 1.38 },
  { f: 116, x: 491, y: 1000, k: 1.0 },
  { f: 165, x: 494, y: 994, k: 1.02 },
  { f: 200, x: 496, y: 991, k: 1.035 },
];

// The front's date of frame: even visible change (farmed land area in the Europe wide, weighted by 1 / k^1.5),
// 6600 BC at f0 -> 3800 BC at f140, then a slowing creep (~3600 BC at f165).
export const T0 = 6600;
export const T140 = 3800;
const AREA_BOX = { x0: -50, y0: 200, x1: 1040, y1: 1420 };
const DATE_TABLE = (() => {
  const Ts: number[] = [];
  const As: number[] = [];
  for (let T = 6900; T >= 3500; T -= 10) {
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
  const w = (f: number) => Math.pow(runCamera(SPREAD_CAM, f).k, -1.5) * (f < 126 ? 1 : 1 - 0.86 * Math.pow(Math.min(1, (f - 126) / 26), 0.8));
  const cum = [0];
  for (let f = 1; f < SPREAD_DURATION + 8; f++) cum.push(cum[f - 1] + w(f - 0.5));
  const a0 = areaOf(T0);
  const a1 = areaOf(T140);
  const dates = cum.map((c) => dateOf(a0 + ((a1 - a0) * c) / cum[140]));
  // keep it strictly falling (flat area runs would hold the date; the dots run on frames anyway)
  for (let f = 1; f < dates.length; f++) dates[f] = Math.min(dates[f], dates[f - 1] - 0.5);
  return dates;
})();
const dateCurve = pchip(DATE_TABLE.map((d, f) => [f, d] as [number, number]));
const PRE = 6;
export const SPREAD_TIMELINE = makeTimeline((f) => (f >= 0 ? dateCurve(f) : T0 - PRE * f), -150, SPREAD_DURATION + 6);
export const SPREAD_POP_OPTS: PopulationOpts = { fillLag: 24, slideLead: 20 };
export const SPREAD_POP = makePopulation(SPREAD_TIMELINE, SPREAD_POP_OPTS);
export const spreadAt = (f: number) => ({ cam: runCamera(SPREAD_CAM, f), T: SPREAD_TIMELINE.dateAt(f) });
