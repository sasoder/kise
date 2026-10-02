// ---------------------------------------------------------------------------
// incaGlyphs: the engraved period glyphs SHARED by the cuts of the Pizarro /
// Atahualpa clip (Dwarkesh map style, the Peru world): Atahualpa's litter and
// the Spanish horseman. The house's one stroke family (the Carrack's: a DARK
// casing under everything, a thin dark contour, dark engraved hatching; widths
// in SCREEN px). Cream = the Inca side (the litter, its bearers); orange =
// PIZARRO'S SIDE (the horseman). Positions are WORLD units (draw inside a
// WorldSvg); sizes are SCREEN px. Exports are frozen: additions only.
//
//   <Litter x y cam size? frame? gait? bearers? opacity? />
//     Atahualpa's litter in profile, in a 100-unit frame: (x, y) = the ground
//     under its middle, up negative; size = screen px for 100 units (default
//     57). bearers (default true): a row of six bearers under the carrying
//     poles (heads, shoulders, legs; cut 2's), the poles on their shoulders;
//     frame + gait (0 standing .. 1 walking): their two-pose step and the load
//     bobbing on their shoulders. On the poles: struts, the platform, the
//     seated Inca under a canopy on four posts (fringed, shaded inside).
//     Extent (units): x -57 .. 57 (poles), y -90.4 (canopy) .. 0 (feet).
//   <Horseman x y cam size? heading? pose? stand? pitch? tilt? maxTilt? opacity? casing? />
//     A rider (morion, torso leaning in) on a horse in profile, facing +x in a
//     HORSE_UNITS (76) frame: (x, y) = its visual centre; size = screen px for
//     76 units. heading (radians, screen convention: 0 east, + south): the
//     profile is mirrored for westward travel (the rider stays up) and tilted
//     toward the heading by `tilt` of its angle, clamped to +-maxTilt deg.
//     pose 0..2 = the gallop cycle (GALLOP: flying gallop, gathered, stride);
//     stand = the waiting pose (four legs down, head up); pitch = an extra
//     rock of the body in degrees (an idle shift, a stride's lurch).
//     Extent (units, before tilt): x -38 .. 38.4, y -29.4 .. 25.6.
//   faceTransform(heading, tilt?, maxTilt?) the svg transform that faces a +x
//     profile glyph along a heading (used by both, and by cut 3's Falconet)
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, DARK, INK, INK_FULL } from "./incaShared";

type CamK = { k: number };
const RAD = 180 / Math.PI;

/** the transform that faces a +x profile glyph along heading (radians, screen
 *  convention: y down): mirrored when it travels west so the rider stays up,
 *  then tilted toward the heading by `tilt` of its angle, clamped to +-maxDeg */
export const faceTransform = (heading: number, tilt = 1, maxDeg = 90) => {
  const c = Math.cos(heading);
  const s = Math.sin(heading);
  const west = c < 0;
  // angle of the heading measured from the facing axis (+x, or -x when mirrored)
  const a = Math.atan2(s, Math.abs(c)) * RAD; // -90..90, + = downward on screen
  const tiltDeg = Math.max(-maxDeg, Math.min(maxDeg, a * tilt));
  return west ? `rotate(${(-tiltDeg).toFixed(3)}) scale(-1 1)` : `rotate(${tiltDeg.toFixed(3)})`;
};

// ---------------------------------------------------------------------------
// THE LITTER (100-unit frame; (0, 0) the ground under its middle, up negative)
// ---------------------------------------------------------------------------
export const LITTER_UNITS = 100;
// the bearers (cut 2's): six in a row under the carrying poles
const L_HEADS = [-37.5, -22.5, -7.5, 7.5, 22.5, 37.5];
const L_HEAD_Y = -33;
const L_HEAD_R = 3.7;
const L_BODY = "M-44,-27 C-44,-29.4 -42.4,-30 -40.5,-30 L40.5,-30 C42.4,-30 44,-29.4 44,-27 L43,-9 L-43,-9 Z";
const L_SEPS = [-30, -15, 0, 15, 30].map((x) => `M${x},-28.8 L${x + 0.5},-10`).join("");
const L_POLES = "M-57,-30.5 L57,-30.5";
// the litter on the poles: struts, the platform, the seated Inca, posts, canopy
const L_STRUTS = "M-14,-30.5 L-14,-37 M14,-30.5 L14,-37";
const L_PLATFORM = "M-21,-48 L21,-48 L19.6,-37 L-19.6,-37 Z";
const L_PLATFORM_HATCH = "M-17.4,-44.2 L17.4,-44.2 M-17,-40.6 L17,-40.6";
const L_POSTS = "M-17.6,-48 L-17.6,-75 M17.6,-48 L17.6,-75";
const L_SHADE = "M-17.6,-75 L17.6,-75 L17.6,-48 L-17.6,-48 Z"; // the shade under the canopy (the crowd does not show through)
const L_INCA = "M-6.4,-48 C-6.4,-53.6 -5,-57.8 -2.5,-59.5 L2.5,-59.5 C5,-57.8 6.4,-53.6 6.4,-48 Z";
const L_INCA_HEAD = { x: 0, y: -63.1, r: 3.5 };
const L_CANOPY = "M-24.6,-75 L24.6,-75 C20.4,-81.2 12,-87.6 0,-90.4 C-12,-87.6 -20.4,-81.2 -24.6,-75 Z";
const L_FRINGE = (() => {
  let d = "M-24.6,-75";
  const n = 10;
  const w = 49.2 / n;
  for (let i = 0; i < n; i++) d += ` q${(w / 2).toFixed(2)},4.5 ${w.toFixed(2)},0`;
  return d;
})();
const L_CANOPY_HATCH = "M-19.6,-79 C-11,-83.2 11,-83.2 19.6,-79";

export const Litter: React.FC<{
  x: number;
  y: number;
  cam: CamK;
  size?: number; // screen px for 100 units
  frame?: number; // the bearers' step clock
  gait?: number; // 0 standing .. 1 walking
  bearers?: boolean;
  opacity?: number;
}> = ({ x, y, cam, size = 57, frame = 0, gait = 0, bearers = true, opacity = 1 }) => {
  if (opacity <= 0.002) return null;
  const u = size / LITTER_UNITS / cam.k; // world units per glyph unit
  const sw = LITTER_UNITS / size; // one screen px in glyph units
  // the bearers' gait: two poses, the load bobbing on their shoulders (amplitude with gait)
  const ph = frame * 0.5;
  const bob = -0.9 * gait * Math.abs(Math.sin(ph));
  const step = 2.2 * gait * Math.sin(ph);
  const legs = L_HEADS.map((hx, i) => {
    const s = i % 2 === 0 ? step : -step;
    return `M${hx - 1.8},-9 L${hx - 2.8 - s},0 M${hx + 1.8},-9 L${hx + 2.8 + s},0`;
  }).join("");
  const fillC = { fill: INK, fillOpacity: INK_FULL };
  const edge = { stroke: DARK, strokeOpacity: 0.55, strokeWidth: 0.9 * sw };
  const load = `translate(0 ${bob.toFixed(3)})`;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${u})`} strokeLinejoin="round" strokeLinecap="round">
      {/* dark casing under everything, so the glyph reads over the crowd */}
      <g fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={3.2 * sw}>
        {bearers ? <path d={legs} /> : null}
        <g transform={load}>
          {bearers ? (
            <>
              <path d={L_BODY} />
              {L_HEADS.map((hx) => (
                <circle key={`hc${hx}`} cx={hx} cy={L_HEAD_Y} r={L_HEAD_R} />
              ))}
            </>
          ) : null}
          <path d={L_POLES} strokeWidth={(3.2 + 2.4) * sw} />
          <path d={L_STRUTS} strokeWidth={(3.2 + 1.8) * sw} />
          <path d={L_POSTS} strokeWidth={(3.2 + 1.8) * sw} />
          <path d={L_PLATFORM} />
          <path d={L_CANOPY} />
          <path d={L_INCA} />
          <circle cx={L_INCA_HEAD.x} cy={L_INCA_HEAD.y} r={L_INCA_HEAD.r} />
        </g>
      </g>
      {/* the bearers: legs, bodies, heads (the poles ride on their shoulders) */}
      {bearers ? <path d={legs} fill="none" stroke={INK} strokeOpacity={INK_FULL} strokeWidth={1.9 * sw} /> : null}
      <g transform={load}>
        {bearers ? (
          <>
            <path d={L_BODY} {...fillC} {...edge} />
            <path d={L_SEPS} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={0.95 * sw} />
          </>
        ) : null}
        <path d={L_POLES} fill="none" stroke={INK} strokeOpacity={INK_FULL} strokeWidth={2.4 * sw} />
        {bearers
          ? L_HEADS.map((hx) => <circle key={`h${hx}`} cx={hx} cy={L_HEAD_Y} r={L_HEAD_R} {...fillC} {...edge} />)
          : null}
        {/* the litter: struts, the shade inside, posts, the Inca, the platform, the canopy */}
        <path d={L_STRUTS} fill="none" stroke={INK} strokeOpacity={INK_FULL} strokeWidth={1.8 * sw} />
        <path d={L_SHADE} fill={DARK} fillOpacity={0.72} />
        <path d={L_POSTS} fill="none" stroke={INK} strokeOpacity={INK_FULL} strokeWidth={1.8 * sw} />
        <path d={L_INCA} {...fillC} {...edge} />
        <circle cx={L_INCA_HEAD.x} cy={L_INCA_HEAD.y} r={L_INCA_HEAD.r} {...fillC} />
        <path d={L_PLATFORM} {...fillC} {...edge} />
        <path d={L_PLATFORM_HATCH} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={0.95 * sw} />
        <path d={L_CANOPY} {...fillC} {...edge} />
        <path d={L_FRINGE} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={0.95 * sw} />
        <path d={L_CANOPY_HATCH} fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={0.95 * sw} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE HORSEMAN. Profile facing +x, in glyph units: a horse 40 units from the
// buttock to the chest (withers 12 above the back line, chest depth 19), the
// rider in the saddle; about 76 units from the tail's tip to the muzzle
// (HORSE_UNITS); size = screen px for those 76 units.
// ---------------------------------------------------------------------------
export const HORSE_UNITS = 76;
const H_BODY =
  // buttock -> croup -> back (saddle dip) -> withers -> crest of the neck -> poll
  "M-20,-1.5 C-21,-6.6 -18.6,-10.6 -13.6,-11.2 C-9.6,-11.6 -5,-9.8 -0.6,-9.8 C3.6,-9.8 7.6,-11.4 11,-12.4 " +
  "C15.6,-15.4 20.4,-21.4 24.6,-25.8 " +
  // ear, forehead, nose, muzzle, jaw, throat-latch
  "L24.4,-29.8 L27,-26.6 C30.4,-24.2 34.6,-19.2 37.6,-15.4 C38.8,-13.8 38,-11.6 36,-11.6 " +
  "C33.6,-11.8 31.2,-13 29.2,-14.6 C28.4,-15.2 27.8,-15.6 27.4,-15.4 " +
  // under the neck to the chest, chest -> girth -> belly -> stifle -> buttock
  "C25.2,-11.6 22.8,-6.6 20.6,-2.2 C19.6,1.8 17.2,4.6 13.8,6 C7.6,7.8 -2.4,8 -9.2,7 " +
  "C-14,6.2 -17.6,4.6 -19.2,2.2 C-19.8,0.9 -20,-0.2 -20,-1.5 Z";
// the tail flows back and a little down, over the hind legs (not a fork against them)
const H_TAIL = "M-18.2,-8.2 C-24.6,-9.4 -30.4,-6.8 -34.2,1.4 C-33.2,3.6 -31.2,4.2 -30.2,2.2 C-28.2,-1.4 -24.8,-3.2 -20.6,-2.4 C-19.4,-2.6 -18.6,-4.2 -18.2,-8.2 Z";
const H_MANE = "M12.2,-13.4 C15.2,-15.8 19,-20.6 23.4,-25.4";
// the rider: torso leaning into the charge, the head under a morion, the arm to the reins
const R_TORSO = "M-4.4,-9.4 C-4.8,-14.4 -3.4,-20.6 0.4,-25.2 L6.2,-23.4 C4.6,-19.2 3.6,-14.2 3.4,-9.6 Z";
const R_HEAD = "M1.4,-28.6 a3.1,3.1 0 1 0 6.2,0 a3.1,3.1 0 1 0 -6.2,0 Z";
// a morion: crescent brim (tips up fore and aft), dome, comb
const R_HELMET =
  "M-1.4,-31.2 C1.2,-29.2 8.2,-29.4 10.8,-31.8 C9,-31.4 8,-31.6 7.6,-32.2 C7.4,-35.4 5.6,-37.2 4.6,-37.4 " +
  "C3.4,-37.2 1.6,-35.4 1.4,-32.2 C0.8,-31.4 -0.2,-31.2 -1.4,-31.2 Z";
const R_ARM = "M3.4,-22.2 C6.4,-19.4 10.4,-17.4 14.6,-16.6";
const R_LEG = "M-1.6,-9.2 C1.6,-6.8 4.8,-4.2 6,-0.6 C5.2,1.6 4,3.4 3,5 M1.4,5 L4.8,5";
// legs: [joint, knee/hock, hoof] per leg; near fore, far fore, near hind, far hind
type Leg = [number, number][];
export const GALLOP: Leg[][] = [
  // 0: the flying gallop of the old engravings (fore legs reaching, hind legs
  //    driving back and down, under the tail)
  [
    [[14.6, 3.6], [23.6, 8.8], [34.4, 9.4]],
    [[11, 4.6], [19.4, 10.6], [30, 13.2]],
    [[-12.6, 3.8], [-21, 9.6], [-29.4, 15.6]],
    [[-16, 2.4], [-24.6, 7.4], [-33.2, 11.2]],
  ],
  // 1: gathered (fore legs folded back, hind legs swung under the belly)
  [
    [[14.6, 3.6], [20.4, 11.4], [12.4, 15.8]],
    [[11, 4.6], [15, 12.8], [7, 16.6]],
    [[-12.6, 3.8], [-6.2, 10.4], [2.2, 14.4]],
    [[-16, 2.4], [-10.4, 11], [-3.4, 16]],
  ],
  // 2: the stride (lead fore landing, the hind legs driving back)
  [
    [[14.6, 3.6], [20.4, 11.4], [23.4, 19.6]],
    [[11, 4.6], [13.4, 13], [6.4, 17]],
    [[-12.6, 3.8], [-20.6, 10.6], [-28.4, 17.4]],
    [[-16, 2.4], [-23.4, 8.6], [-32.6, 13]],
  ],
];
/** the waiting pose: four legs down (the near pair a little apart), head up */
export const STAND: Leg[] = [
  [[14.6, 3.6], [15.6, 11.6], [16.4, 19.6]],
  [[11, 4.6], [10.6, 12.2], [10.2, 19.6]],
  [[-12.6, 3.8], [-13.4, 11.2], [-12.4, 19.6]],
  [[-16, 2.4], [-17.8, 10.8], [-17.4, 19.6]],
];
/** the body's pitch (degrees) and lift (units) per gallop pose: the gallop's rock */
const POSE_PITCH = [0, -2.6, 2.2];
const POSE_LIFT = [-0.8, -1.6, 0.9];
const STAND_PITCH = -2.2; // the head up, the weight back a little
const STAND_LIFT = -0.6;
const norm = (a: [number, number], b: [number, number]): [number, number] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [-dy / L, dx / L];
};
const norm2 = (m: [number, number], n: [number, number]): [number, number] => {
  const x = m[0] + n[0];
  const y = m[1] + n[1];
  const L = Math.hypot(x, y) || 1;
  return [x / L, y / L];
};
/** a leg as a tapering filled shape (upper width wu, lower width wl) */
const legShape = (l: Leg, wu: number, wl: number) => {
  const [a, b, c] = l;
  const n1 = norm(a, b);
  const n2 = norm(b, c);
  const nk = norm2(n1, n2);
  const P = (p: [number, number], n: [number, number], w: number, sgn: number) =>
    `${(p[0] + n[0] * w * sgn).toFixed(2)},${(p[1] + n[1] * w * sgn).toFixed(2)}`;
  const wk = (wu * 0.45 + wl * 0.55) / 2;
  return (
    `M${P(a, n1, wu / 2, 1)} L${P(b, nk, wk, 1)} L${P(c, n2, wl / 2, 1)} ` +
    `L${P(c, n2, wl / 2, -1)} L${P(b, nk, wk, -1)} L${P(a, n1, wu / 2, -1)} Z`
  );
};
const hoofD = (l: Leg) => {
  const [kx, ky] = l[1];
  const [hx, hy] = l[2];
  const L = Math.hypot(hx - kx, hy - ky) || 1;
  const ux = (hx - kx) / L;
  const uy = (hy - ky) / L;
  return `M${(hx - ux * 1.6).toFixed(2)},${(hy - uy * 1.6).toFixed(2)} L${(hx + ux * 0.6).toFixed(2)},${(hy + uy * 0.6).toFixed(2)}`;
};
// engraved shade: the belly's shadow, the quarter's curve, the shoulder
const H_HATCH =
  "M-13.4,4.4 C-6,6.2 4,6.4 11.6,4.6 M-16.4,-4.4 C-14.6,-1.4 -12.4,1 -9.4,2.6 M16.4,-8.4 C15.4,-4.4 14.4,-1.4 12.6,1.8";

export const Horseman: React.FC<{
  x: number;
  y: number;
  cam: CamK;
  size?: number; // screen px for HORSE_UNITS
  heading?: number; // radians, screen convention (0 = east, + = south)
  pose?: number; // 0..2 (the gallop cycle); fractional = the nearer pose
  stand?: boolean; // the waiting pose instead of the gallop
  pitch?: number; // an extra rock of the body (degrees)
  tilt?: number;
  maxTilt?: number;
  opacity?: number;
  casing?: number; // screen px of the dark casing
}> = ({ x, y, cam, size = 32, heading = 0, pose = 0, stand = false, pitch = 0, tilt = 1, maxTilt = 90, opacity = 1, casing = 2.6 }) => {
  if (opacity <= 0.002) return null;
  const u = size / HORSE_UNITS / cam.k; // world per glyph unit
  const sw = HORSE_UNITS / size; // 1 screen px in glyph units
  const pi = ((Math.round(pose) % 3) + 3) % 3;
  const legs = stand ? STAND : GALLOP[pi];
  const lift = stand ? STAND_LIFT : POSE_LIFT[pi];
  const rock = (stand ? STAND_PITCH : POSE_PITCH[pi]) + pitch;
  const body = `translate(0 ${lift + 8}) rotate(${rock.toFixed(3)})`;
  const cw = casing * sw;
  const legD = legs.map((l, i) => legShape(l, i < 2 ? 5.6 : 6.4, 2.9));
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${u}) ${faceTransform(heading, tilt, maxTilt)}`}>
      <g transform={body} strokeLinejoin="round" strokeLinecap="round">
        {/* dark casing under everything */}
        <g stroke={DARK} strokeOpacity={0.7} fill={DARK}>
          {legD.map((d, i) => (
            <path key={`lc${i}`} d={d} strokeWidth={cw} />
          ))}
          <path d={H_TAIL} strokeWidth={cw} />
          <path d={H_BODY} strokeWidth={cw} />
          <path d={R_TORSO} strokeWidth={cw} />
          <path d={R_HELMET} strokeWidth={cw} />
          <path d={R_HEAD} strokeWidth={cw} />
          <path d={R_ARM} strokeWidth={2.6 + cw} fill="none" />
        </g>
        {/* far legs (deep), tail, body, near legs, rider */}
        {[1, 3].map((i) => (
          <g key={`lf${i}`}>
            <path d={legD[i]} fill={ACCENT_DEEP} />
            <path d={hoofD(legs[i])} stroke={DARK} strokeOpacity={0.8} strokeWidth={3.2} fill="none" />
          </g>
        ))}
        <path d={H_TAIL} fill={ACCENT_DEEP} />
        <path d={H_BODY} fill={ACCENT} stroke={DARK} strokeOpacity={0.55} strokeWidth={0.9 * sw} />
        {[0, 2].map((i) => (
          <g key={`ln${i}`}>
            <path d={legD[i]} fill={ACCENT} />
            <path d={hoofD(legs[i])} stroke={DARK} strokeOpacity={0.8} strokeWidth={3.2} fill="none" />
          </g>
        ))}
        <path d={H_HATCH} stroke={DARK} strokeOpacity={0.55} strokeWidth={0.95 * sw} fill="none" />
        <path d={H_MANE} stroke={DARK} strokeOpacity={0.5} strokeWidth={0.95 * sw} fill="none" />
        <path d={R_LEG} stroke={DARK} strokeOpacity={0.62} strokeWidth={1.2 * sw} fill="none" />
        <path d={R_TORSO} fill={ACCENT} stroke={DARK} strokeOpacity={0.55} strokeWidth={0.9 * sw} />
        <path d={R_ARM} stroke={ACCENT} strokeWidth={2.6} fill="none" />
        <path d={R_HEAD} fill={ACCENT} />
        <path d={R_HELMET} fill={ACCENT} stroke={DARK} strokeOpacity={0.55} strokeWidth={0.9 * sw} />
      </g>
    </g>
  );
};
