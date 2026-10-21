// ---------------------------------------------------------------------------
// rodentPlace: the burrow's geometry for RodentFromCentralAsia (kyle-pandemics, cut 1), in the map's world px round
// the origin (75.5 E, 42.7 N, the Chuy valley by Issyk-Kul): the mound, the marmot's seat, the burrow mouth, the
// seep's rivulets and the pools they make on the ground (the sources of the disease's front). Pure data; read by the
// cut (rodentCamera.ts) and by the front's bake (scripts/clips/kyle-pandemics/bake-rodent-front.mjs).
// ---------------------------------------------------------------------------
import { ORIGIN, project } from "./rodentMapData";

/** the LCC pole's image: the map's meridians are rays from it */
export const POLE: [number, number] = project(40, 89.99999);
/** the yaw (rad) that looks along the local meridian at map point (x, y): 0 = map-up, + = toward the east */
export const northYaw = (x: number, y: number) => Math.atan2(POLE[0] - x, -(POLE[1] - y));
export const YAW0 = northYaw(ORIGIN[0], ORIGIN[1]);
/** horizontal axes at the origin: AWAY = local north (away from the f0 camera), RIGHT = local east */
export const AWAY: [number, number] = [Math.sin(YAW0), -Math.cos(YAW0)];
export const RIGHT: [number, number] = [Math.cos(YAW0), Math.sin(YAW0)];
/** a point `r` right (east) and `a` away (north) of the origin, map px */
export const local = (r: number, a: number): [number, number] => [ORIGIN[0] + RIGHT[0] * r + AWAY[0] * a, ORIGIN[1] + RIGHT[1] * r + AWAY[1] * a];

export const MOUND = { c: local(0, 0), R: 25, h: 11 };
export const MARMOT = { at: local(4, 5), h: 40 };
/** the burrow mouth on the mound's front-left slope, its radius (local r, a of its centre) */
export const HOLE_RA: [number, number] = [-8, -12.5];
export const HOLE = { at: local(HOLE_RA[0], HOLE_RA[1]), r: 3.6 };
/** the fall line from the mouth (local angle, outward from the mound's centre) */
export const FALL_ANG = Math.atan2(HOLE_RA[1], HOLE_RA[0]);
/** loose earth: an irregular heap (its radius wanders with the angle) and, in front of the mouth, the apron of
 *  thrown-out soil (a low lobe the burrow's digging left) */
const radiusAt = (th: number) => MOUND.R * (1 + 0.09 * Math.sin(3 * th + 1) + 0.06 * Math.sin(5 * th + 2.3) + 0.04 * Math.sin(9 * th + 0.7));
export const SPOIL = { c: local(Math.cos(FALL_ANG) * (MOUND.R * 0.95), Math.sin(FALL_ANG) * (MOUND.R * 0.95)), r: 13, h: 3.2 };
/** height of the earth at map point (x, y) */
export const moundY = (x: number, y: number) => {
  const dx = x - MOUND.c[0];
  const dy = y - MOUND.c[1];
  // local (right, away) angle of the point
  const lr = dx * RIGHT[0] + dy * RIGHT[1];
  const la = dx * AWAY[0] + dy * AWAY[1];
  const d = Math.hypot(dx, dy) / radiusAt(Math.atan2(la, lr));
  const dome = d >= 1 ? 0 : MOUND.h * Math.pow(1 - d * d, 1.3);
  const ds = Math.hypot(x - SPOIL.c[0], y - SPOIL.c[1]) / SPOIL.r;
  const spoil = ds >= 1 ? 0 : SPOIL.h * Math.pow(1 - ds * ds, 1.6);
  return Math.max(dome, spoil);
};
/** the earth's outline radius (map px) from the mound's centre along local angle th */
export const earthRadius = (th: number) => {
  let lo = 0;
  let hi = MOUND.R * 2;
  const at = (r: number) => moundY(MOUND.c[0] + (RIGHT[0] * Math.cos(th) + AWAY[0] * Math.sin(th)) * r, MOUND.c[1] + (RIGHT[1] * Math.cos(th) + AWAY[1] * Math.sin(th)) * r);
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (at(m) > 0.02) lo = m;
    else hi = m;
  }
  return lo;
};

/** the seep's rivulets: from the mouth's lower lip down the slope, fanned round the fall line, each reaching the
 *  mound's foot at its own frame; there it pools on the ground (a source of the front) */
export type Rivulet = { end: [number, number]; start: number; arrive: number; w: number };
/** the seep: ONE broad tongue from the mouth's lip down the fall line over the apron, splitting near the bottom into
 *  lobes; each lobe's end pools on the ground (a source of the front) on its arrival frame */
const lobe = (dAng: number, start: number, arrive: number, w: number, ext: number): Rivulet => {
  const a = FALL_ANG + (dAng * Math.PI) / 180;
  const R = earthRadius(a) + ext;
  return { end: local(Math.cos(a) * R, Math.sin(a) * R), start, arrive, w };
};
export const RIVULETS: Rivulet[] = [lobe(-12, 85, 93, 3.6, 1.6), lobe(1, 85, 91, 6.0, -0.5), lobe(12, 85, 95, 3.2, 1.4)];
/** the well: orange rises in the mouth from WELL[0] and brims at WELL[1] */
export const WELL: [number, number] = [82, 86];
/** the ground stain's centre (the middle pool) */
export const MOUTH: [number, number] = RIVULETS[1].end;
