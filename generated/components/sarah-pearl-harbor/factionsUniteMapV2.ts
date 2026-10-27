// factionsUniteMapV2: the occupied-China region for FactionsUniteFiguresV2 (a 1937
// line). pearlAsiaMapData's OCCUPIED_1938 (read-only) is Japanese-held China by early
// 1939 east of the APPROXIMATE 1938-39 front PLUS the Canton pocket (Oct 1938) and
// Hainan (Feb 1939). Those two are its only subpaths south of world y 1050 (Hainan
// y 1166-1209, Canton y 1092-1130; the front's own ring ends at y ~986), so they are
// dropped here; everything else is the source region unchanged.
import { OCCUPIED_1938, type Region } from "./pearlAsiaMapData";

const SOUTH_CUT = 1050;
const north = (part: string) => {
  const nums = part.match(/-?\d+(?:\.\d+)?/g) ?? [];
  let minY = Infinity;
  for (let i = 1; i < nums.length; i += 2) minY = Math.min(minY, Number(nums[i]));
  return minY < SOUTH_CUT;
};
const keepNorth = (d: string) => (d.match(/M[^M]*/g) ?? []).filter(north).join("");

/** Japanese-held China as drawn in this cut: OCCUPIED_1938 without Hainan and the Canton pocket */
export const OCCUPIED_V2: Region = {
  d: keepNorth(OCCUPIED_1938.d),
  edge: keepNorth(OCCUPIED_1938.edge),
  // the kept subpaths' box (measured once from the filtered path)
  box: [507.76, 608.54, 727.22, 985.81],
};
