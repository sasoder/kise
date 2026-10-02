// ---------------------------------------------------------------------------
// ambushGlyphs: the engraved period objects only LetsOffTheAmbush (cut 3 of
// the Pizarro / Atahualpa clip) draws, in the house's one stroke family (the
// Carrack's: a DARK casing under everything, a thin dark contour, dark
// engraved hatching; screen-sized widths). The shared Litter and Horseman
// live in incaGlyphs.tsx. Orange = PIZARRO'S SIDE (the falconets, every
// muzzle flash); gun smoke is cream at a low rung.
//   <Falconet x y cam size heading recoil opacity />  a small bronze gun on a
//     two-wheeled field carriage, in profile, muzzle toward its heading
//   falconetMuzzle(...) the muzzle face and its direction for those props
//   <MuzzleFlash x y cam dir age size seed rays />  a few short engraved orange
//     rays (age 0..5 frames; nothing after)
//   <SmokeDefs /> + <SmokePuff x y cam r opacity seed roll />  a soft engraved
//     billow (cream)
// All glyphs are positioned in WORLD units (x, y) and sized in SCREEN px
// (size), so they draw inside a world-space svg group (scale k).
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, DARK, INK, hash } from "./incaShared";
import { faceTransform } from "./incaGlyphs";

type CamK = { k: number };
const RAD = 180 / Math.PI;

// ---------------------------------------------------------------------------
// THE FALCONET: a small bronze gun on a two-wheeled field carriage, profile,
// muzzle toward +x and cocked up a little (the classic field-gun silhouette,
// so its direction reads at a glance); the trunnion over the wheel at the
// origin; 64 units from the trail's end to the muzzle; size = screen px for
// those 64 units. FALCONET_MUZZLE = the muzzle face in the barrel's frame.
// ---------------------------------------------------------------------------
// the barrel in its own frame (x along the bore, the trunnion at 0): a thick
// breech with a base ring, tapering chase, a flared muzzle
const F_BARREL =
  "M-15.6,-4.9 L-12.6,-5.3 L-11.6,-4.7 L6,-3.5 L22.4,-2.7 L23.6,-3.7 L27.2,-3.7 L27.2,3.7 L23.6,3.7 L22.4,2.7 L6,3.5 L-11.6,4.7 L-12.6,5.3 L-15.6,4.9 C-17.6,3.6 -17.6,-3.6 -15.6,-4.9 Z";
const F_CASCABEL = "M-17,0 L-19.6,0 M-22,0 a2.4,2.4 0 1 0 4.8,0 a2.4,2.4 0 1 0 -4.8,0";
const F_RINGS = "M-11.6,-4.7 L-11.6,4.7 M-3.4,-4.2 L-3.4,4.2 M6,-3.5 L6,3.5 M22.4,-2.7 L22.4,2.7";
// the carriage (in the glyph frame, not elevated): a cheek from the axle down
// to the trail on the ground behind
const F_CHEEK = "M-34,14.2 L-31.6,10.8 L-4.6,1.4 L3.4,1 L4.4,4.6 L-2.6,6.6 L-31,16 Z";
const F_WHEEL_C = { x: 0, y: 7.6, r: 8.8 };
export const FALCONET_UNITS = 64;
export const FALCONET_MUZZLE: [number, number] = [27.2, 0];
/** the barrel's elevation in the glyph frame (degrees; - = muzzle up) */
export const FALCONET_ELEV = -11;

export const Falconet: React.FC<{
  x: number;
  y: number;
  cam: CamK;
  size?: number;
  heading?: number;
  tilt?: number;
  maxTilt?: number;
  recoil?: number; // glyph units the gun has run back
  opacity?: number;
  casing?: number;
}> = ({ x, y, cam, size = 48, heading = 0, tilt = 1, maxTilt = 90, recoil = 0, opacity = 1, casing = 2.6 }) => {
  if (opacity <= 0.002) return null;
  const u = size / FALCONET_UNITS / cam.k;
  const sw = FALCONET_UNITS / size;
  const cw = casing * sw;
  const Wc = F_WHEEL_C;
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 + 0.26;
    return `M${Wc.x},${Wc.y} L${(Wc.x + Math.cos(a) * Wc.r).toFixed(2)},${(Wc.y + Math.sin(a) * Wc.r).toFixed(2)}`;
  }).join(" ");
  const barrel = `rotate(${FALCONET_ELEV})`;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${u}) ${faceTransform(heading, tilt, maxTilt)} translate(${-recoil} 0)`}>
      <g strokeLinejoin="round" strokeLinecap="round">
        <g stroke={DARK} strokeOpacity={0.7} fill={DARK}>
          <path d={F_CHEEK} strokeWidth={cw} />
          <circle cx={Wc.x} cy={Wc.y} r={Wc.r} strokeWidth={cw + 2.2} fill="none" />
          <g transform={barrel}>
            <path d={F_BARREL} strokeWidth={cw} />
            <path d={F_CASCABEL} strokeWidth={cw + 1.6} fill="none" />
          </g>
        </g>
        <path d={F_CHEEK} fill={ACCENT_DEEP} stroke={DARK} strokeOpacity={0.55} strokeWidth={0.9 * sw} />
        <circle cx={Wc.x} cy={Wc.y} r={Wc.r} stroke={ACCENT} strokeWidth={2.2} fill="none" />
        <path d={spokes} stroke={ACCENT} strokeWidth={1.3} fill="none" />
        <circle cx={Wc.x} cy={Wc.y} r={1.8} fill={ACCENT} stroke={DARK} strokeOpacity={0.6} strokeWidth={0.8 * sw} />
        <g transform={barrel}>
          <path d={F_CASCABEL} stroke={ACCENT} strokeWidth={1.7} fill="none" />
          <path d={F_BARREL} fill={ACCENT} stroke={DARK} strokeOpacity={0.55} strokeWidth={0.9 * sw} />
          <path d={F_RINGS} stroke={DARK} strokeOpacity={0.6} strokeWidth={0.95 * sw} fill="none" />
          <path d="M-10,-2.2 L21,-1.5" stroke={DARK} strokeOpacity={0.32} strokeWidth={0.95 * sw} fill="none" />
          <circle cx={0} cy={0} r={1.6} fill={ACCENT_DEEP} stroke={DARK} strokeOpacity={0.6} strokeWidth={0.8 * sw} />
        </g>
      </g>
    </g>
  );
};

/** the muzzle face of a Falconet drawn with these props, in world units */
export const falconetMuzzle = (x: number, y: number, cam: CamK, size: number, heading: number, tilt = 1, maxTilt = 90, recoil = 0) => {
  const u = size / FALCONET_UNITS / cam.k;
  // the barrel frame: rotate(ELEV) then translate(-recoil), then the face transform
  const e = (FALCONET_ELEV * Math.PI) / 180;
  const mx = FALCONET_MUZZLE[0] * Math.cos(e) - FALCONET_MUZZLE[1] * Math.sin(e) - recoil;
  const my = FALCONET_MUZZLE[0] * Math.sin(e) + FALCONET_MUZZLE[1] * Math.cos(e);
  const c = Math.cos(heading);
  const s = Math.sin(heading);
  const west = c < 0;
  const a = Math.atan2(s, Math.abs(c)) * RAD;
  const t = (Math.max(-maxTilt, Math.min(maxTilt, a * tilt)) * Math.PI) / 180;
  const sx = west ? -mx : mx; // scale(-1, 1) first
  const sy = my;
  const r = west ? -t : t;
  const qx = sx * Math.cos(r) - sy * Math.sin(r);
  const qy = sx * Math.sin(r) + sy * Math.cos(r);
  // the muzzle's direction (unit, screen)
  const dx0 = Math.cos(e);
  const dy0 = Math.sin(e);
  const ddx = west ? -dx0 : dx0;
  const ddy = dy0;
  return {
    x: x + qx * u,
    y: y + qy * u,
    dir: [ddx * Math.cos(r) - ddy * Math.sin(r), ddx * Math.sin(r) + ddy * Math.cos(r)] as [number, number],
  };
};

// ---------------------------------------------------------------------------
// THE MUZZLE FLASH: a few short engraved orange rays from the muzzle in a
// forward cone, age 0..5 frames (none after); size = screen px of the longest ray
// ---------------------------------------------------------------------------
export const FLASH_FRAMES = 5;
export const MuzzleFlash: React.FC<{
  x: number;
  y: number;
  cam: CamK;
  dir: [number, number];
  age: number; // frames since the shot (fractional ok)
  size?: number;
  seed?: number;
  rays?: number;
  casing?: number;
}> = ({ x, y, cam, dir, age, size = 30, seed = 1, rays = 7, casing = 2.6 }) => {
  if (age < 0 || age >= FLASH_FRAMES) return null;
  const s = 1 / cam.k; // world per screen px
  const a0 = Math.atan2(dir[1], dir[0]);
  const grow = Math.min(1, 0.55 + age * 0.45); // full length by frame 1
  const fade = age < 2 ? 1 : 1 - (age - 2) / (FLASH_FRAMES - 2);
  const out = 0.25 + Math.min(1, age / 3) * 0.55; // rays leave the muzzle as they fade
  const els: React.ReactNode[] = [];
  for (let i = 0; i < rays; i++) {
    const q = rays === 1 ? 0 : i / (rays - 1) - 0.5; // -0.5..0.5
    const ang = a0 + q * 1.5 + (hash(seed, i) - 0.5) * 0.18;
    const L = size * (1 - 0.55 * Math.abs(q) * 2) * (0.8 + 0.3 * hash(seed, i + 9)) * grow;
    const r0 = L * (age < 1 ? 0.12 : out * 0.6);
    const r1 = L;
    const c = Math.cos(ang);
    const sn = Math.sin(ang);
    const d = `M${(x + c * r0 * s).toFixed(3)},${(y + sn * r0 * s).toFixed(3)} L${(x + c * r1 * s).toFixed(3)},${(y + sn * r1 * s).toFixed(3)}`;
    const w = (i === Math.floor(rays / 2) ? 2.6 : 2) * (age < 2 ? 1 : 0.8);
    els.push(
      <g key={i}>
        <path d={d} stroke={DARK} strokeOpacity={0.6 * fade} strokeWidth={(w + casing) * s} strokeLinecap="round" />
        <path d={d} stroke={ACCENT} strokeOpacity={fade} strokeWidth={w * s} strokeLinecap="round" />
      </g>,
    );
  }
  // the burst at the muzzle itself (first 2 frames): a small engraved star
  if (age < 2) {
    const R = size * 0.28 * s * (age < 1 ? 1 : 0.7);
    const pts: string[] = [];
    for (let i = 0; i < 12; i++) {
      const ang = a0 + (i / 12) * Math.PI * 2;
      const rr = i % 2 === 0 ? R : R * 0.45;
      pts.push(`${(x + Math.cos(ang) * rr).toFixed(3)},${(y + Math.sin(ang) * rr).toFixed(3)}`);
    }
    els.push(
      <polygon key="star" points={pts.join(" ")} fill={ACCENT} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.2 * s} strokeLinejoin="round" />,
    );
  }
  return <g>{els}</g>;
};

// ---------------------------------------------------------------------------
// SMOKE: a soft engraved billow: overlapping round lobes, each a soft cream
// fill (flat core, soft rim) with a thin cream contour on its outer side and a
// short inner curl, rolling slowly (roll = radians); r in world units;
// opacity = the puff's rung (~0.18..0.3)
// ---------------------------------------------------------------------------
export const SMOKE_GRAD_ID = "ambushSmokeGrad";
export const SmokeDefs: React.FC = () => (
  <defs>
    <radialGradient id={SMOKE_GRAD_ID}>
      <stop offset="0%" stopColor={INK} stopOpacity={1} />
      <stop offset="62%" stopColor={INK} stopOpacity={0.86} />
      <stop offset="100%" stopColor={INK} stopOpacity={0} />
    </radialGradient>
  </defs>
);
export const SmokePuff: React.FC<{
  x: number;
  y: number;
  cam: CamK;
  r: number;
  opacity: number;
  seed?: number;
  roll?: number;
  lobes?: number;
  line?: number; // contour opacity relative to the fill
}> = ({ x, y, cam, r, opacity, seed = 1, roll = 0, lobes = 5, line = 1 }) => {
  if (opacity <= 0.003 || r <= 0) return null;
  const fills: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];
  const s = 1 / cam.k;
  const lw = Math.min(1.5, 0.6 + (r * cam.k) / 60) * s; // contour width (screen px), thinner on small puffs
  const lo = Math.min(0.62, opacity * 2.1 * line);
  for (let i = 0; i < lobes; i++) {
    const a = roll + (i / lobes) * Math.PI * 2 + hash(seed, i) * 0.8;
    const d = i === 0 ? 0 : r * (0.44 + 0.2 * hash(seed, i + 20));
    const rr = r * (i === 0 ? 0.74 : 0.5 + 0.17 * hash(seed, i + 40));
    const cx = x + Math.cos(a) * d;
    const cy = y + Math.sin(a) * d;
    fills.push(<circle key={`f${i}`} cx={cx} cy={cy} r={rr} fill={`url(#${SMOKE_GRAD_ID})`} fillOpacity={opacity} />);
    if (i === 0) continue;
    // the engraved contour: an open arc on the lobe's outer side ...
    const cr = rr * 0.84;
    const arc = (a1: number, a2: number, rad: number) => {
      const p1 = [cx + Math.cos(a1) * rad, cy + Math.sin(a1) * rad];
      const p2 = [cx + Math.cos(a2) * rad, cy + Math.sin(a2) * rad];
      return `M${p1[0].toFixed(3)},${p1[1].toFixed(3)} A${rad.toFixed(3)},${rad.toFixed(3)} 0 0 1 ${p2[0].toFixed(3)},${p2[1].toFixed(3)}`;
    };
    lines.push(<path key={`l${i}`} d={arc(a - 1.25, a + 1.25, cr)} fill="none" stroke={INK} strokeOpacity={lo} strokeWidth={lw} strokeLinecap="round" />);
    // ... and a short inner curl (the billow's roll)
    lines.push(
      <path key={`c${i}`} d={arc(a + 0.5, a + 1.7, cr * 0.55)} fill="none" stroke={INK} strokeOpacity={lo * 0.6} strokeWidth={lw * 0.85} strokeLinecap="round" />,
    );
  }
  return (
    <g>
      {fills}
      {lines}
    </g>
  );
};

