// IFV_D: a solid side-view infantry fighting vehicle, facing right, in the 256 box of <Pictogram d=...> (drawn for
// kofman-vivaldi cut 50, EqualDronesAndArmor; same family and weight as the Phosphor DRONE_D in vivaldiPictos.ts).
// A long boxy hull with a sloped glacis, a small turret with a commander's hatch and a short autocannon barrel, and a
// track run whose six road wheels are knocked out as paper holes. Every solid part winds clockwise and every hole
// counter-clockwise, so the nonzero fill leaves the holes as paper. Box extent: x 10..244, y 58..190.

const hole = (cx: number, cy: number, r: number) =>
  `M${cx - r},${cy}A${r},${r} 0 1 0 ${cx + r},${cy}A${r},${r} 0 1 0 ${cx - r},${cy}Z`;

/** track run: a stadium x 14..242, y 142..190 */
const TRACK = "M38,142H218A24,24 0 0 1 218,190H38A24,24 0 0 1 38,142Z";
/** six road wheels as paper holes, centred on the track */
const WHEELS = [50, 81.2, 112.4, 143.6, 174.8, 206].map((x) => hole(x, 166, 11)).join("");
/** hull: square rear, flat roof, sloped glacis, short lower front plate; its belly overlaps the track top */
const HULL = "M10,144V96L18,88H172L244,116V132L236,144Z";
/** turret with a small commander's hatch, and the short barrel */
const TURRET = "M96,90L104,64H146L158,90Z";
const HATCH = "M110,65V58H128V65Z";
const BARREL = "M148,71H214V78H148Z";

export const IFV_D = TRACK + WHEELS + HULL + TURRET + HATCH + BARREL;
/** the track's bottom in the 256 box (where it meets the ground) */
export const IFV_BOTTOM = 190;
/** the silhouette's left and right extremes in the 256 box */
export const IFV_X0 = 10;
export const IFV_X1 = 244;
