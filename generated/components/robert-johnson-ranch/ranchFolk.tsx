// ---------------------------------------------------------------------------
// ranchFolk — THE CAST of robert-johnson-ranch (Robert Caro on the Texas Hill Country). Picture-book gouache on the
// pandemics paint (kyle-pandemics/pandemicFolkPaint: the same crescent shadow, grain, dry-brush mottling and wobbly
// edges, so this clip is painted by the same hand), the pandemics Worker's proportions (a woman ~470 units to the top
// of her bun against his 513, ~4.5 heads tall, a round head on a pear body, dot eyes, a small nose, a blush dot,
// mitten hands, small feet). Built on a 2.5D rig (ranchFolkRig.ts): every part is a 3D cloth surface, sphere, tube or
// ellipsoid projected through the view, so the women turn, walk, climb and rock with no mirror flip and no pop.
// Orange (the clip's accent) is ONLY their shawls: the women who lived out there alone.
//
// UNITS: figure units = the Worker's (513 = his height); FIG_W = 0.6335 world units per figure unit (the kit's world:
//   U = 178 per metre, a man 312), so a figure standing at world (X, Z) draws with scale = A.P.r(Z) * FIG_W (world px
//   per figure unit inside <WorldSvg>) and its feet at A.P.p(X, -groundH, Z). Feet / floor at y = 0, up is -y.
// VIEW: yaw (deg) = her facing vs the camera (0 front, 90 screen right, 180 her back, -90 screen left; a world facing
//   direction (dX, dZ) is yaw = atan2(dX, -dZ)); elev (deg) = how far the camera looks down on her (elevOf()).
//
// REBEKAH BAINES JOHNSON, c. 1910 (cut 59): cream high-collared shirtwaist, long dark slate skirt to the ankles, a
//   belt, dark hair up in a soft bun, an ORANGE triangle shawl over her shoulders (the point down her back, a fringe,
//   a deeper border), dark boots.
//   <Rebekah pose at scale uid fog? unitPx? />      pose: RebekahPose (all fields; build it with the helpers below)
//   rebekahStand(frame, yaw?)        standing, breathing, the shawl's edge moving in the wind, her right hand holding
//                                    the shawl closed at her chest
//   WALKS: makeWalk(spec) -> walk(frame) -> { X, Z, H, yaw, pose }: footprints planted in the WORLD (each foot stays put
//     on its print through its stance, then swings to the next), the hem swinging with the stride (lagged, never
//     popping), the left arm swinging, a forward lean from the slope (the climb), hip bob and sway. spec: path (world
//     XZ polyline), sAt(frame) (distance along it, monotone), steps (count), ground H(X, Z) (world, up +), startFeet?,
//     yawAt?(frame, pathYaw) (override, e.g. the turn on the crest), headAt?(frame) (head yaw / pitch), lean? scale.
//   stop-and-look: pass yawAt to turn her on the spot after the last step (both feet planted, the head leads); a drawn
//     three-quarter back view at yaw ~150, a back view at 180.
//
// THE FARM WOMAN, the 1970s (cut 26): grey hair in a low bun, a plain muted housedress (dusty sage-grey) with an
//   oatmeal apron, an ORANGE shawl, stockings and dark shoes, seated in her rocking chair, hands folded in her lap.
//   <FarmWoman pose at scale uid fog? unitPx? chair? />   the woman IN her RockingChair (chair default true): the chair
//                                    and she rock together about the rockers (rolling on the floor), her feet stay on
//                                    the floor. pose: FarmWomanPose
//   farmWomanPose(frame, o?)         rock (a slow continuous loop, o.rockAmp deg, o.rockPeriod s), breathing, the
//                                    shawl's edge moving, o.yaw (default 35: three-quarter front facing screen right;
//                                    -35 faces screen left), o.headYaw (a small head turn, e.g. toward the road)
//   <RockingChair at scale uid yaw elev rock? fog? />  the empty chair (the same geometry)
//   SEAT: the chair's floor point is the figure origin: place `at` = A.P.p(X, -H, Z) of the porch floor point under the
//     seat; ROCKER_HALF_LEN (figure units) = how far the rockers reach front and back.
//
// SHADOWS: <FolkShadowW A X Z kind /> a soft contact shadow under a figure on the ground ("stand" | "seated"),
//   the kit's AirShadow sized for this cast.
// FOG: fog?: { rgb: "#hex", amount } mixes every paint colour toward the air (A.folkFog(Z) from the kit). Orange keeps
//   half of it (the one glowing material).
// Probe: ranchProbe.tsx (src/Root.RanchProbe.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { AirShadow, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { PAINT, folkTexDefs, mixC, type Shape } from "../kyle-pandemics/pandemicFolkPaint";
import {
  D2R,
  add3,
  c01,
  densify,
  facing,
  drape,
  ellD,
  ellipsoidD,
  facingOn,
  hull,
  lerp,
  lerp3,
  lineOn,
  makeView,
  mul3,
  n2,
  norm3,
  onSphere,
  outlineD,
  patchOn,
  pr2,
  proj,
  rotPitch,
  rotRoll,
  rotYaw,
  smoothClosed,
  smoothOpen,
  sphereCapPts,
  sstep,
  sub3,
  tube3,
  type P2,
  type V3,
  type View,
} from "./ranchFolkRig";

export const FPS = 24000 / 1001;
/** world units per figure unit (the kit's world: U = 178 per metre; the Worker's 513 = 325 world units) */
export const FIG_W = 325 / 513;
export const U = 178;
export const ORANGE = "#FFB000";
export const ORANGE_MID = "#E99A10";
export const ORANGE_DEEP = "#D98A0C";

// ===================================================================================================================
// INKS
// ===================================================================================================================
export const REBEKAH_INKS = {
  skin: "#E9C6A4",
  skinSh: "#C89A7C",
  blush: "#D98A80",
  eye: "#2A201A",
  hair: "#4B3427",
  bun: "#5A3F2E",
  hairLine: "#33231A",
  shirt: "#ECE2CC",
  skirt: "#4E565B",
  skirtFold: "#3E4549",
  belt: "#3B3632",
  shawl: ORANGE,
  shawlBand: ORANGE_DEEP,
  fringe: "#D98A0C",
  boots: "#33261E",
  stocking: "#3F342C",
};
export const FARM_INKS = {
  skin: "#E6C3A3",
  skinSh: "#C3967A",
  blush: "#D39184",
  eye: "#2A201A",
  hair: "#CFC8BC",
  bun: "#DAD4C9",
  hairLine: "#A39B8F",
  dress: "#7E8B85",
  dressFold: "#69756F",
  apron: "#B3AE95",
  apronLine: "#A99A78",
  shawl: ORANGE,
  shawlBand: ORANGE_DEEP,
  fringe: "#D98A0C",
  stocking: "#B4A38C",
  shoes: "#33261E",
};
export const CHAIR_INKS = { wood: "#73583B", woodLit: "#8E6E4C", woodDark: "#4E3B29" };

// ===================================================================================================================
// THE PAINT (romeFolk's fast FolkPaint: crescent masks cover each shape's own box) + fog
// ===================================================================================================================
export type FolkFog = { rgb: [number, number, number] | string; amount: number };
const fogRgbHex = (c: FolkFog["rgb"]) => (typeof c === "string" ? c : `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`);
const SHADE = { amt: 0.4, to: "#2C3433" };
const isOrange = (c: string) => c === ORANGE || c === ORANGE_MID || c === ORANGE_DEEP;
const fogShapes = (shapes: Shape[], fog?: FolkFog | null) => {
  if (!fog || fog.amount <= 0.001) return shapes;
  return shapes.map((s) => ({ ...s, fill: mixC(s.fill, fogRgbHex(fog.rgb), (isOrange(s.fill) ? 0.5 : 1) * c01(fog.amount)) }));
};
const boxOf = (d: string): [number, number, number, number] => {
  const v = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < v.length; i += 2) {
    if (v[i] < x0) x0 = v[i];
    if (v[i] > x1) x1 = v[i];
    if (v[i + 1] < y0) y0 = v[i + 1];
    if (v[i + 1] > y1) y1 = v[i + 1];
  }
  return [x0, y0, x1, y1];
};
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
/** paint shapes (figure units, feet at the origin) at `at` (svg units) with `scale` svg units per figure unit */
export const RanchPaint: React.FC<{ shapes: Shape[]; at: P2; scale: number; uid: string; fog?: FolkFog | null; unitPx?: number; opacity?: number; texture?: boolean }> = ({
  shapes,
  at,
  scale,
  uid,
  fog,
  unitPx = 1,
  opacity = 1,
  texture = true,
}) => {
  const S = fogShapes(shapes, fog);
  const pxf = (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  const shade = (c: string) => mixC(c, SHADE.to, SHADE.amt);
  const off = PAINT.shadeOff;
  const pad = off * 1.2 + blurU * 3 + 2;
  return (
    <g opacity={opacity}>
      <defs>
        {texture ? folkTexDefs(uid, pxf, unitPx) : null}
        <filter id={`${uid}su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU).toFixed(3)} />
        </filter>
        <filter id={`${uid}cu`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU * 2.2).toFixed(3)} />
        </filter>
      </defs>
      <g filter={texture ? `url(#${uid}tx)` : undefined}>
        <g transform={`translate(${n3(at[0])} ${n3(at[1])}) scale(${n3(scale)})`}>
          {S.map((s, i) => {
            const op = s.op ?? 1;
            if (op <= 0.002 || !s.d) return null;
            const clipId = s.clip ? `${uid}c${i}` : undefined;
            const wrap = (el: React.ReactNode) =>
              clipId ? (
                <g key={i}>
                  <clipPath id={clipId}>
                    <path d={s.clip} />
                  </clipPath>
                  <g clipPath={`url(#${clipId})`}>{el}</g>
                </g>
              ) : (
                <g key={i}>{el}</g>
              );
            if (s.det !== undefined)
              return wrap(
                <path
                  d={s.d}
                  fill="none"
                  stroke={s.keep ? s.fill : mixC(s.fill, "#1E1611", 0.32)}
                  strokeWidth={(s.det * Math.max(0.45, Math.min(1.3, pxf))).toFixed(2)}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={op}
                />,
              );
            if (s.cast) return wrap(<path d={s.d} fill={shade(s.fill)} opacity={op} filter={`url(#${uid}cu)`} />);
            const sh = s.sh ?? 1;
            if (sh <= 0) return wrap(<path d={s.d} fill={s.fill} opacity={op} />);
            const [bx0, by0, bx1, by1] = boxOf(s.d);
            const mx = bx0 - pad;
            const my = by0 - pad;
            const mw = bx1 - bx0 + 2 * pad;
            const mh = by1 - by0 + 2 * pad;
            const mid = `${uid}m${i}`;
            return wrap(
              <>
                <path d={s.d} fill={s.fill} opacity={op} />
                <mask id={mid} maskUnits="userSpaceOnUse" x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)}>
                  <path d={s.d} fill="#fff" />
                  <path d={s.d} fill="#000" transform={`translate(${n3(-off * sh)} ${n3(-off * sh * 1.05)})`} filter={`url(#${uid}su)`} />
                </mask>
                <rect x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)} mask={`url(#${mid})`} fill={shade(s.fill)} opacity={op} />
              </>,
            );
          })}
        </g>
      </g>
    </g>
  );
};

// ===================================================================================================================
// SHARED BUILDERS
// ===================================================================================================================
type Inks = Record<string, string>;
/** a figure transform: figure space -> figure space (lean, roll, rock ...) */
type Xf = (p: V3) => V3;
const dirOf = (xf: Xf, d: V3): V3 => sub3(xf(d), xf([0, 0, 0]));

/** the wind: a slow gusting value 0..1 and a flutter phase (pure in frame) */
export const windAt = (frame: number, seed = 0) => {
  const t = frame / FPS + seed * 3.1;
  const g = 0.55 + 0.25 * Math.sin(t * 0.9 + 0.4) + 0.12 * Math.sin(t * 2.3 + 1.7) + 0.08 * Math.sin(t * 4.1);
  return { g: c01(g), ph: t * 5.2 };
};

// ---- the head --------------------------------------------------------------------------------------------------------
type HeadSpec = {
  /** head centre in figure space (after all transforms) */
  c: V3;
  R: number;
  /** the head's own axes in figure space: forward, up (toward -y), her left */
  f: V3;
  up: V3;
  left: V3;
  inks: Inks;
  bun: { up: number; back: number; r: number };
  hairRho: number;
  brows?: number;
  uid: string;
};
const headShapes = (v: View, H: HeadSpec): Shape[] => {
  const S: Shape[] = [];
  const { c, R, f, up, left, inks } = H;
  const ys = 1.04;
  const sph = { c, R, ys };
  const dirH = (x: number, y: number, z: number): V3 => norm3(add3(add3(mul3(left, x), mul3(up, y)), mul3(f, z)));
  const ax = (k: [number, number, number]): [V3, V3, V3] => [mul3(left, R * k[0]), mul3(up, R * k[1]), mul3(f, R * k[2])];
  // the bun (a soft sphere at the back of the crown): drawn behind the head when it is on the far side, and again in
  // front as it comes round (its overlap is hair on hair, so the crossfade never shows a seam)
  const bunDir = dirH(0, Math.sin(H.bun.up * D2R), -Math.cos(H.bun.up * D2R) * H.bun.back);
  const bunC = add3(c, mul3(bunDir, R * 0.98));
  const bunAx: [V3, V3, V3] = [mul3(left, H.bun.r), mul3(up, H.bun.r * 0.9), mul3(f, H.bun.r)];
  const bunE = ellipsoidD(v, bunC, bunAx);
  const bunFront = sstep(-0.12, 0.12, (proj(v, bunC).d - proj(v, c).d) / R);
  const bunShapes = (op: number): Shape[] => {
    if (op <= 0.01) return [];
    // a twist line across the bun
    const p0 = pr2(v, add3(bunC, add3(mul3(left, -H.bun.r * 0.7), mul3(up, H.bun.r * 0.2))));
    const p1 = pr2(v, add3(bunC, add3(mul3(f, -H.bun.r * 0.5), mul3(up, H.bun.r * 0.45))));
    const p2 = pr2(v, add3(bunC, add3(mul3(left, H.bun.r * 0.7), mul3(up, -H.bun.r * 0.1))));
    return [
      { d: bunE.d, fill: inks.bun ?? inks.hair, op },
      { d: bunE.d, fill: inks.hairLine, det: 1.2, keep: true, op: 0.5 * op },
      { d: smoothOpen([p0, p1, p2]), fill: inks.hairLine, det: 1.4, keep: true, op: 0.7 * op },
    ];
  };
  S.push(...bunShapes(1 - bunFront));
  // the hair's volume: a soft puff behind the face, fuller at the crown
  const puffC = add3(c, add3(mul3(up, R * 0.1), mul3(f, -R * 0.07)));
  S.push({ d: ellipsoidD(v, puffC, ax([1.09, 1.03, 1.08])).d, fill: inks.hair });
  // the face / skull
  S.push({ d: ellipsoidD(v, c, ax([1, ys, 1])).d, fill: inks.skin });
  // the nose: a small bump that makes the profile's nose; a drawn comma on the front
  const noseC = add3(c, mul3(dirH(0, -0.42, 1), R * 0.93));
  const nf = proj(v, noseC).d - proj(v, c).d;
  if (nf > -R * 0.55) S.push({ d: ellipsoidD(v, noseC, [mul3(left, R * 0.13), mul3(up, R * 0.15), mul3(f, R * 0.14)]).d, fill: inks.skin, sh: 0 });
  // eyes, blush, the nose's comma (front)
  for (const s of [-1, 1]) {
    const e = onSphere(v, sph, dirH(s * Math.sin(21 * D2R), -Math.sin(19 * D2R), Math.cos(21 * D2R)));
    if (e.f > 0.04) S.push({ d: ellD(e.x, e.y, 4.3 * Math.sqrt(c01(e.f) * 0.85 + 0.15), 5.3), fill: inks.eye, sh: 0, op: sstep(0.04, 0.3, e.f) });
    const b = onSphere(v, sph, dirH(s * Math.sin(37 * D2R), -Math.sin(37 * D2R), Math.cos(37 * D2R)));
    if (b.f > 0.08) S.push({ d: ellD(b.x, b.y, 8 * Math.sqrt(c01(b.f)) + 1, 5), fill: inks.blush, sh: 0, op: 0.55 * sstep(0.08, 0.4, b.f) });
    if (H.brows && e.f > 0.1) {
      const b0 = onSphere(v, sph, dirH(s * Math.sin(12 * D2R), Math.sin((1 - H.brows) * D2R), Math.cos(12 * D2R)));
      const b1 = onSphere(v, sph, dirH(s * Math.sin(30 * D2R), Math.sin(-1 * D2R), Math.cos(30 * D2R)));
      S.push({ d: `M ${n2(b0.x)} ${n2(b0.y)} L ${n2(b1.x)} ${n2(b1.y)}`, fill: "#8C8070", det: 2.2, keep: true, op: 0.8 * sstep(0.1, 0.4, e.f) });
    }
  }
  const nc = onSphere(v, sph, dirH(0, -Math.sin(22 * D2R), 1));
  if (nc.f > 0.3) {
    const k = sstep(0.3, 0.8, nc.f);
    const x = nc.x;
    const y = nc.y;
    S.push({ d: `M ${n2(x - 3)} ${n2(y + 1)} C ${n2(x - 1)} ${n2(y - 3)} ${n2(x + 5)} ${n2(y - 2)} ${n2(x + 6)} ${n2(y + 6)} C ${n2(x + 6)} ${n2(y + 11)} ${n2(x)} ${n2(y + 12)} ${n2(x - 4)} ${n2(y + 9)} Z`, fill: inks.skinSh, sh: 0, op: k });
  }
  // the hair on the skull: a cap round the back of the crown (the front hairline an arc high on the forehead)
  const capAxis = dirH(0, Math.cos(40 * D2R), -Math.sin(40 * D2R));
  const cap = sphereCapPts(v, sph, capAxis, H.hairRho);
  if (cap) S.push({ d: smoothClosed(densify(cap, 6), 0.7), fill: inks.hair });
  // two soft strands swept back from the hairline toward the bun
  for (const s of [-1, 1]) {
    const pts: P2[] = [];
    let vis = 0;
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      const d = dirH(s * lerp(0.42, 0.12, u), lerp(0.42, 0.95, u), lerp(0.8, -0.25, u));
      const o = onSphere(v, sph, d, 0.5);
      if (o.f > 0.05) {
        pts.push([o.x, o.y]);
        vis++;
      }
    }
    if (vis >= 3) S.push({ d: smoothOpen(pts), fill: inks.hairLine, det: 1.2, keep: true, op: 0.45 });
  }
  S.push(...bunShapes(bunFront));
  return S;
};

// ---- the shawl (a triangle shawl over the shoulders) --------------------------------------------------------------------
type ShawlSpec = {
  xf: Xf;
  neckY: number;
  /** the lower edge: sides, front ends, back point (y, figure units) */
  sideY: number;
  frontY: number;
  backY: number;
  /** half widths: over the arms, and the depth front / back */
  a: number;
  bF: number;
  bB: number;
  wind: { g: number; ph: number; dir: [number, number] };
  /** the front opening: half angle at the neck, and how far down it runs (t) */
  open: { half: number; t: number; tipHalf: number };
  inks: Inks;
  frame: number;
  /** a soft irregular lower edge (figure units; 0 = smooth) */
  wobble?: number;
};
const shawlDrape = (sp: ShawlSpec) => {
  const edgeY = (phi: number) => {
    const c = Math.cos(phi * D2R);
    const r = phi * D2R;
    const wob = sp.wobble ? sp.wobble * (0.6 * Math.sin(3 * r + 1) + 0.4 * Math.sin(7 * r + 2)) : 0;
    return sp.sideY + (sp.backY - sp.sideY) * Math.pow(Math.max(0, -c), 2.6) + (sp.frontY - sp.sideY) * Math.pow(Math.max(0, c), 2.2) + wob;
  };
  const fn = (phi: number, t: number): V3 => {
    const y0 = sp.neckY;
    const y = lerp(y0, edgeY(phi), t);
    // over the shoulders: from the collar out to the arms, then hanging
    const sh = sstep(0, 0.32, t);
    const s = Math.sin(phi * D2R);
    const c = Math.cos(phi * D2R);
    const hang = c01((t - 0.3) / 0.7);
    const a = lerp(24, sp.a, sh) + 4 * hang;
    const b = c >= 0 ? lerp(22, sp.bF, sh) + 3 * hang : lerp(20, sp.bB, sh) - 10 * Math.pow(hang, 1.5) * Math.pow(-c, 2);
    let p: V3 = [a * s, y, b * c];
    // the wind: the lower part (the point most) streams a little and flutters
    const w = Math.pow(t, 2.2) * sp.wind.g * (1 + 1.4 * Math.max(0, -c));
    const fl = Math.sin(sp.wind.ph + phi * 0.05) * 0.6 + Math.sin(sp.wind.ph * 1.7 + phi * 0.11) * 0.4;
    p = [p[0] + sp.wind.dir[0] * w * (5 + 2.5 * fl), p[1] - w * 2.5 * (0.6 + 0.4 * fl), p[2] + sp.wind.dir[1] * w * (5 + 2.5 * fl)];
    return sp.xf(p);
  };
  return { D: drape(fn, 56, 12), edgeY };
};
const shawlShapes = (v: View, sp: ShawlSpec, inner: string): Shape[] => {
  const { D } = shawlDrape(sp);
  const S: Shape[] = [{ d: outlineD(v, D, 0.85), fill: sp.inks.shawl }];
  // the deeper border band just above the edge
  const band = lineOn(v, D, (u) => [u * 360, 0.9], 72);
  S.push(...visibleRuns(band, sp.inks.shawlBand, 2.3, 0.75));
  // the front opening: the shirt (or dress) showing between the shawl's two sides, down to where it is held
  const o = sp.open;
  const pts: [number, number][] = [];
  for (let k = 0; k <= 6; k++) pts.push([lerp(-o.half, -o.tipHalf, k / 6), lerp(0.01, o.t, k / 6)]);
  for (let k = 6; k >= 0; k--) pts.push([lerp(o.half, o.tipHalf, k / 6), lerp(0.01, o.t, k / 6)]);
  const P = patchOn(v, D, pts);
  if (P.facing > -0.15) S.push({ d: smoothClosed(P.pts, 0.6), fill: inner, op: sstep(-0.15, 0.2, P.facing), sh: 0.6 });
  // the fringe along the visible lower edge, stirring in the wind
  const fr: string[] = [];
  for (let k = 0; k < 90; k++) {
    const phi = k * 4;
    const ff = facingOn(v, D, phi, 1);
    if (ff < 0.08) continue;
    const p0 = D.fn(phi, 1);
    const sway = Math.sin(sp.wind.ph * 1.3 + k * 0.9) * 2.2 * sp.wind.g;
    const p1: V3 = [p0[0] + sp.wind.dir[0] * (3 + sway), p0[1] + 10, p0[2] + sp.wind.dir[1] * (3 + sway)];
    const a = pr2(v, p0);
    const b = pr2(v, p1);
    fr.push(`M ${n2(a[0])} ${n2(a[1])} L ${n2(b[0])} ${n2(b[1])}`);
  }
  if (fr.length) S.push({ d: fr.join(" "), fill: sp.inks.fringe, det: 1.3, keep: true, op: 0.85 });
  return S;
};
/** the visible runs of a line on a drape as det strokes */
const visibleRuns = (pts: { p: P2; f: number }[], fill: string, w: number, op: number, fMin = 0.12): Shape[] => {
  const out: Shape[] = [];
  let run: P2[] = [];
  let fs = 0;
  const flush = () => {
    if (run.length >= 2) out.push({ d: smoothOpen(run), fill, det: w, keep: true, op: op * sstep(fMin, fMin + 0.25, fs / run.length) });
    run = [];
    fs = 0;
  };
  for (const q of pts) {
    if (q.f > fMin) {
      run.push(q.p);
      fs += q.f;
    } else flush();
  }
  flush();
  return out;
};

// ---- arms -----------------------------------------------------------------------------------------------------------
const armShapes = (v: View, S0: V3, E: V3, W: V3, sleeve: string, skin: string, w: [number, number, number], handLen = 15): { sleeve: Shape; hand: Shape; depth: number; hand3: V3 } => {
  const t = tube3(v, [S0, E, W], [w[0], w[1], w[2]]);
  const fd = norm3(sub3(W, E));
  const H = add3(W, mul3(fd, handLen * 0.75));
  // the mitten: long along the forearm, flat across
  const side = norm3([fd[2], 0, -fd[0]]);
  const flat = norm3([-fd[1] * side[2], fd[0] * side[2] - fd[2] * side[0], fd[1] * side[0]]);
  const h = ellipsoidD(v, H, [mul3(fd, handLen), mul3(side, 10.5), mul3(flat, 8)]);
  return { sleeve: { d: t.d, fill: sleeve }, hand: { d: h.d, fill: skin }, depth: t.depth, hand3: H };
};

// ===================================================================================================================
// REBEKAH
// ===================================================================================================================
export type FootState = { p: V3; pitch: number; yaw: number };
export type RebekahPose = {
  yaw: number;
  elev: number;
  lean: number;
  roll: number;
  breath: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  brows: number;
  feet: { L: FootState; R: FootState };
  pelvis: { x: number; y: number; twist: number };
  hem: { dx: number; dz: number; twist: number; flare: number };
  armL: number;
  armR: number;
  hold: number;
  wind: { g: number; ph: number; dir: [number, number] };
  /** the ground under her in figure space: y(x, z) (default flat) */
  slope: [number, number];
  frame: number;
};
const ANKLE = 15;
const HIP_Y = -200;
const WAIST_Y = -234;
const restFeet = (): { L: FootState; R: FootState } => ({ L: { p: [14, -ANKLE, 2], pitch: 0, yaw: 6 }, R: { p: [-14, -ANKLE, -2], pitch: 0, yaw: -6 } });
/** body-local wind direction (xz) for a world wind blowing toward +X (screen right) at yaw */
export const windDirLocal = (yaw: number, worldDir: [number, number] = [1, 0.25]): [number, number] => {
  const c = Math.cos(yaw * D2R);
  const s = Math.sin(yaw * D2R);
  const [dX, dZ] = worldDir;
  const l = Math.hypot(dX, dZ) || 1;
  return [(dX * c + dZ * s) / l, (dX * s - dZ * c) / l];
};
export const breathOf = (frame: number) => 0.5 + 0.5 * Math.sin((frame / FPS / 4.2) * 2 * Math.PI - Math.PI / 2);
/** standing, breathing, holding her shawl, the wind in it */
export const rebekahStand = (frame: number, yaw = 35, o: Partial<RebekahPose> = {}): RebekahPose => {
  const w = windAt(frame);
  const t = frame / FPS;
  return {
    yaw,
    elev: 8,
    lean: 1,
    roll: 0.6 * Math.sin((t / 6.3) * 2 * Math.PI),
    breath: breathOf(frame),
    headYaw: 0,
    headPitch: 2,
    headRoll: 0.8 * Math.sin((t / 6.3) * 2 * Math.PI - 0.6),
    brows: 0,
    feet: restFeet(),
    pelvis: { x: 0.8 * Math.sin((t / 6.3) * 2 * Math.PI), y: 0, twist: 0 },
    hem: { dx: 0, dz: 0, twist: 0, flare: 0 },
    armL: 2,
    armR: 0,
    hold: 1,
    wind: { g: w.g, ph: w.ph, dir: windDirLocal(yaw) },
    slope: [0, 0],
    frame,
    ...o,
  };
};

export const buildRebekah = (pose: RebekahPose, inks = REBEKAH_INKS): Shape[] => {
  const v = makeView(pose.yaw, pose.elev);
  const gY = (x: number, z: number) => pose.slope[0] * x + pose.slope[1] * z;
  const br = pose.breath;
  // ---- the body transforms --------------------------------------------------------------------------------------------
  const pel: V3 = [pose.pelvis.x, HIP_Y + pose.pelvis.y, 0];
  const waist: V3 = [pose.pelvis.x, WAIST_Y + pose.pelvis.y, 0];
  const upper: Xf = (p) => {
    const q: V3 = [p[0] + pose.pelvis.x, p[1] + pose.pelvis.y, p[2]];
    return rotRoll(rotPitch(rotYaw(q, waist, pose.pelvis.twist * 0.4), waist, pose.lean), waist, pose.roll);
  };
  const S: Shape[] = [];
  // ---- the feet (behind the skirt) ------------------------------------------------------------------------------------
  const footShapes = (fs: FootState) => {
    const fy = fs.yaw * D2R;
    const fd: V3 = [Math.sin(fy), 0, Math.cos(fy)];
    const pitched = norm3([fd[0] * Math.cos(fs.pitch * D2R), -Math.sin(fs.pitch * D2R), fd[2] * Math.cos(fs.pitch * D2R)]);
    const side = norm3([fd[2], 0, -fd[0]]);
    const upv = norm3([-(pitched[1] * side[2]), pitched[2] * side[0] - pitched[0] * side[2], pitched[1] * side[0]]);
    const c = add3(add3(fs.p, mul3(pitched, 9)), [0, 7, 0]);
    const e = ellipsoidD(v, c, [mul3(pitched, 21), mul3(side, 9.5), mul3(upv, 8.5)]);
    return { s: { d: e.d, fill: inks.boots } as Shape, depth: e.depth };
  };
  const fL = footShapes(pose.feet.L);
  const fR = footShapes(pose.feet.R);
  // the ankles in dark stockings, up into the skirt: a foot that shows past the hem (a trailing foot downhill) stays
  // joined to her instead of floating as a dot
  const ankle = (fs: FootState, hx: number): Shape => {
    const top = lerp3(fs.p, [pel[0] + hx, pel[1], pel[2]], 0.3);
    return { d: tube3(v, [add3(fs.p, [0, 2, 0]), top], [12, 13]).d, fill: inks.stocking };
  };
  for (const [f, fs, hx] of (fL.depth < fR.depth
    ? [
        [fL, pose.feet.L, 14],
        [fR, pose.feet.R, -14],
      ]
    : [
        [fR, pose.feet.R, -14],
        [fL, pose.feet.L, 14],
      ]) as [typeof fL, FootState, number][]) {
    S.push(ankle(fs, hx));
    S.push(f.s);
  }
  // ---- the skirt -------------------------------------------------------------------------------------------------------
  const aL = pose.feet.L.p;
  const aR = pose.feet.R.p;
  const legAt = (a: V3, hip: V3, y: number): V3 => lerp3(hip, a, c01((y - hip[1]) / (a[1] - hip[1])));
  const hipL: V3 = [pel[0] + 14, pel[1], pel[2]];
  const hipR: V3 = [pel[0] - 14, pel[1], pel[2]];
  const toeOf = (fs: FootState): V3 => add3(fs.p, [Math.sin(fs.yaw * D2R) * 26, -10, Math.cos(fs.yaw * D2R) * 26]);
  const climb = sstep(0.12, 0.4, Math.abs(pose.slope[1]));
  const skirtFn = (phi: number, t: number): V3 => {
    const s = Math.sin(phi * D2R);
    const c = Math.cos(phi * D2R);
    const bell = Math.sin(Math.min(1, t / 0.24) * Math.PI * 0.5);
    let a = 44 + 15 * bell + 23 * t;
    let b = 34 + 12 * bell + 20 * t;
    const ycTop = waist[1] + 2;
    // the hem's centre follows the legs (lagged in the pose), twisting with the hips
    const cx = lerp(waist[0], pose.hem.dx, Math.pow(t, 1.3));
    const cz = lerp(0, pose.hem.dz, Math.pow(t, 1.3));
    const yApprox = lerp(ycTop, -ANKLE - 8, t);
    // the legs push the cloth: the ring always clears both legs
    const lL = legAt(aL, hipL, yApprox);
    const lR = legAt(aR, hipR, yApprox);
    const front = Math.max(lL[2], lR[2]) + 13 + 10 * t;
    const back = Math.min(lL[2], lR[2]) - 13 - 8 * t;
    a += pose.hem.flare * t;
    b += pose.hem.flare * 0.6 * t;
    // the cloth gives a little to the legs but never bells out: the push past the ring is soft-capped (a trailing
    // ankle shows below the back hem instead)
    const softcap = (e: number, E: number) => (e <= 0 ? 0 : E * Math.tanh(e / E));
    // on a climb the trailing leg reaches far down-slope: the cloth follows it further and hangs a little longer, so
    // the stocking only peeks at the hem
    const bF = b + softcap(0.65 * (front - cz - b), 28);
    const bB = b + softcap((0.65 + 0.35 * climb) * (cz - back - b), 28 + 60 * climb);
    const tw = pose.hem.twist * t * D2R;
    const lx = a * s;
    const lz = (c >= 0 ? bF : bB) * c;
    const x = cx + lx * Math.cos(tw) + lz * Math.sin(tw);
    const z = cz + lz * Math.cos(tw) - lx * Math.sin(tw);
    // height: the hem runs parallel to the ground, lifted where a foot pushes up under it
    let yHem = gY(x, z) - ANKLE - 7 + 7 * climb;
    for (const fs of [pose.feet.L, pose.feet.R]) {
      const toe = toeOf(fs);
      const top = Math.min(fs.p[1], toe[1]) - 9;
      const dd = Math.hypot(x - lerp(fs.p[0], toe[0], 0.5), z - lerp(fs.p[2], toe[2], 0.5));
      const k = 1 - sstep(16, 40, dd);
      if (top < yHem) yHem = lerp(yHem, top, k);
    }
    const y = lerp(ycTop, yHem, t);
    return [x, y, z];
  };
  const SK = drape(skirtFn, 56, 12);
  S.push({ d: outlineD(v, SK, 0.85), fill: inks.skirt });
  // folds: soft lines from the hips to the hem, a darker cast on the far side of each
  for (const phi0 of [-38, 8, 46, 140, 182, 222]) {
    const L = lineOn(v, SK, (u) => [phi0 + 6 * u + pose.hem.twist * 0.2 * u, lerp(0.22, 0.99, u)], 10);
    S.push(...visibleRuns(L, inks.skirtFold, 1.8, 0.5, 0.15));
  }
  // ---- the bodice (shirtwaist) -----------------------------------------------------------------------------------------
  const bodiceFn = (phi: number, t: number): V3 => {
    // t 0 = the neck .. 1 = the waist
    const s = Math.sin(phi * D2R);
    const c = Math.cos(phi * D2R);
    const y = lerp(-362, WAIST_Y - 2, t);
    const sh = sstep(0, 0.16, t);
    const bust = Math.exp(-(((t - 0.5) / 0.22) ** 2));
    const a = lerp(22, 56, sh) - 10 * sstep(0.55, 1, t) + 1.5 * br;
    const bf = lerp(20, 34, sh) + 10 * bust + 1.2 * br;
    const bb = lerp(20, 34, sh) - 2 * sstep(0.5, 1, t);
    return upper([a * s, y - 1.5 * br * (1 - t), (c >= 0 ? bf : bb) * c + 3 * bust * (c >= 0 ? 1 : 0)]);
  };
  const BD = drape(bodiceFn, 48, 10);
  // ---- the arms ---------------------------------------------------------------------------------------------------------
  const shL = upper([50, -340, -2]);
  const shR = upper([-50, -340, -2]);
  const swingL = pose.armL * D2R;
  const elL = upper([56, -340 + 74 * Math.cos(swingL), -2 + 74 * Math.sin(swingL)]);
  const wrL = upper([54, -340 + 74 * Math.cos(swingL) + 62 * Math.cos(swingL + 0.22), -2 + 74 * Math.sin(swingL) + 62 * Math.sin(swingL + 0.22)]);
  const swingR = pose.armR * D2R;
  const elRh = upper([-56, -340 + 74 * Math.cos(swingR), -2 + 74 * Math.sin(swingR)]);
  const wrRh = upper([-54, -340 + 74 * Math.cos(swingR) + 62 * Math.cos(swingR + 0.22), -2 + 74 * Math.sin(swingR) + 62 * Math.sin(swingR + 0.22)]);
  const elRk = upper([-52, -276, 20]);
  const wrRk = upper([-14, -300, 46]);
  const elR = lerp3(elRh, elRk, pose.hold);
  const wrR = lerp3(wrRh, wrRk, pose.hold);
  const armL = armShapes(v, shL, elL, wrL, inks.shirt, inks.skin, [30, 25, 21]);
  const armR = armShapes(v, shR, elR, wrR, inks.shirt, inks.skin, [30, 25, 21], 14);
  const bodyD = proj(v, upper([0, -300, 0])).d;
  // an arm is behind the body when its elbow is on the far side; crossfade over a short depth range
  const behind = (el: V3) => 1 - sstep(-14, 6, proj(v, el).d - bodyD);
  const bL = behind(elL);
  const bR = behind(elR);
  if (bL > 0.01) S.push({ ...armL.sleeve, op: bL }, { ...armL.hand, op: bL });
  if (bR > 0.01) S.push({ ...armR.sleeve, op: bR }, { ...armR.hand, op: bR });
  // the bodice, then the belt
  S.push({ d: outlineD(v, BD, 0.85), fill: inks.shirt });
  const beltFn = (phi: number, t: number): V3 => {
    const s = Math.sin(phi * D2R);
    const c = Math.cos(phi * D2R);
    return upper([46 * s, lerp(WAIST_Y - 8, WAIST_Y + 5, t), (c >= 0 ? 37 : 35) * c]);
  };
  S.push({ d: outlineD(v, drape(beltFn, 40, 2), 0.8), fill: inks.belt, sh: 0.5 });
  // arms on the near side (under the shawl: the shawl is drawn after them)
  if (bL < 0.99) S.push({ ...armL.sleeve, op: 1 - bL }, { ...armL.hand, op: 1 - bL });
  if (bR < 0.99) S.push({ ...armR.sleeve, op: 1 - bR });
  // the high collar
  const col = tube3(v, [upper([0, -352, 1]), upper([0, -378, 3])], [36, 33]);
  S.push({ d: col.d, fill: inks.shirt, sh: 0.6 });
  // ---- the shawl -------------------------------------------------------------------------------------------------------
  const sp: ShawlSpec = {
    xf: upper,
    neckY: -366,
    sideY: -290,
    frontY: -262,
    backY: -236,
    a: 74,
    bF: 52,
    bB: 46,
    wind: pose.wind,
    open: { half: 10, t: lerp(0.95, 0.42, pose.hold), tipHalf: lerp(10, 1, pose.hold) },
    inks,
    frame: pose.frame,
  };
  S.push(...shawlShapes(v, sp, inks.shirt));
  // the right hand holding the shawl at her chest: on top while it is in front of her chest, hidden behind her as she
  // turns away (a short crossfade as it passes the shawl's silhouette)
  const handFront = sstep(-8, 8, proj(v, armR.hand3).d - proj(v, upper([0, -300, 30])).d);
  const handVis = lerp(1 - bR, handFront, pose.hold);
  if (handVis > 0.01) S.push({ ...armR.hand, op: handVis });
  // ---- the head -------------------------------------------------------------------------------------------------------
  const neck: V3 = [0, -372, 2];
  const hxf: Xf = (p) => upper(rotRoll(rotPitch(rotYaw(p, neck, pose.headYaw), neck, pose.headPitch), neck, pose.headRoll));
  const hc = hxf([0, -416, 5]);
  S.push(
    ...headShapes(v, {
      c: hc,
      R: 49,
      f: norm3(dirOf(hxf, [0, 0, 1])),
      up: norm3(dirOf(hxf, [0, -1, 0])),
      left: norm3(dirOf(hxf, [1, 0, 0])),
      inks,
      bun: { up: 50, back: 1, r: 21 },
      hairRho: 101,
      brows: pose.brows,
      uid: "rb",
    }),
  );
  return S;
};

export const Rebekah: React.FC<{ pose: RebekahPose; at: P2; scale: number; uid: string; fog?: FolkFog | null; unitPx?: number; inks?: typeof REBEKAH_INKS }> = ({ pose, at, scale, uid, fog, unitPx, inks }) => (
  <RanchPaint shapes={buildRebekah(pose, inks)} at={at} scale={scale} uid={uid} fog={fog} unitPx={unitPx} />
);

// ===================================================================================================================
// WALKS (footprints planted in the world)
// ===================================================================================================================
export type WalkSpec = {
  /** the path, world XZ (a polyline; it is followed by arc length) */
  path: [number, number][];
  /** distance along the path at a frame (world units), monotone, 0 at the start */
  sAt: (frame: number) => number;
  /** the number of steps to the end of the path (the last brings the trailing foot alongside) */
  steps: number;
  /** ground height (world, up +) */
  ground: (X: number, Z: number) => number;
  firstFoot?: "L" | "R";
  /** half the gap between the feet (world units) */
  gap?: number;
  /** the facing: by default the path's direction (smoothed); override for a turn on the spot */
  yawAt?: (frame: number, pathYaw: number) => number;
  headAt?: (frame: number) => { yaw: number; pitch: number };
  /** the elevation of the camera above her, per frame (deg) */
  elevAt?: (frame: number) => number;
  /** the facing before she sets off (the path's own direction by default) */
  startYaw?: number;
};
type Fp = { foot: "L" | "R"; s: number; X: number; Z: number; yaw: number };
const pathOf = (pts: [number, number][]) => {
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = seg[seg.length - 1];
  const at = (s: number): { X: number; Z: number; dX: number; dZ: number } => {
    const ss = Math.max(0, Math.min(total, s));
    let i = 1;
    while (i < seg.length - 1 && seg[i] < ss) i++;
    const u = (ss - seg[i - 1]) / Math.max(1e-6, seg[i] - seg[i - 1]);
    const a = pts[i - 1];
    const b = pts[i];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { X: lerp(a[0], b[0], u), Z: lerp(a[1], b[1], u), dX: (b[0] - a[0]) / l, dZ: (b[1] - a[1]) / l };
  };
  /** the direction smoothed over a window (no kink at a vertex) */
  const dirAt = (s: number, w = 60) => {
    let dX = 0;
    let dZ = 0;
    for (let k = -4; k <= 4; k++) {
      const q = at(s + (k / 4) * w);
      const wt = 1 - Math.abs(k) / 5;
      dX += q.dX * wt;
      dZ += q.dZ * wt;
    }
    const l = Math.hypot(dX, dZ) || 1;
    return { dX: dX / l, dZ: dZ / l };
  };
  return { total, at, dirAt };
};
export const yawOfDir = (dX: number, dZ: number) => Math.atan2(dX, -dZ) / D2R;
const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

export const makeWalk = (spec: WalkSpec) => {
  const P = pathOf(spec.path);
  const total = P.total;
  const gapW = spec.gap ?? 9;
  const n = spec.steps;
  // steps land at a, a + L, ..., a + (n - 1) L = total; the first is a short one (a = 0.6 L)
  const L = total / (n - 0.4);
  const a0 = 0.6 * L;
  const first = spec.firstFoot ?? "R";
  const other = first === "L" ? "R" : "L";
  const leftOf = (s: number) => {
    const d = P.dirAt(s);
    return { lX: -d.dZ, lZ: d.dX, yaw: yawOfDir(d.dX, d.dZ) };
  };
  const startYaw = spec.startYaw ?? leftOf(0).yaw;
  const mk = (foot: "L" | "R", s: number, yawOverride?: number): Fp => {
    const q = P.at(s);
    const l = leftOf(s);
    const side = foot === "L" ? 1 : -1;
    return { foot, s, X: q.X + l.lX * gapW * side, Z: q.Z + l.lZ * gapW * side, yaw: yawOverride ?? l.yaw };
  };
  const prints: Record<"L" | "R", Fp[]> = { L: [], R: [] };
  // both feet start side by side at s = 0, turned to the start facing
  const sy = startYaw * D2R;
  const st = (foot: "L" | "R"): Fp => {
    const q = P.at(0);
    const side = foot === "L" ? 1 : -1;
    // her left at the start facing: (cos yaw, sin yaw) in world XZ
    return { foot, s: 0, X: q.X + Math.cos(sy) * gapW * side, Z: q.Z + Math.sin(sy) * gapW * side, yaw: startYaw };
  };
  prints.L.push(st("L"));
  prints.R.push(st("R"));
  for (let k = 0; k < n; k++) {
    const foot = k % 2 === 0 ? first : other;
    prints[foot].push(mk(foot, Math.min(total, a0 + k * L)));
  }
  // the trailing foot comes alongside at the end
  const lastFoot = (n - 1) % 2 === 0 ? first : other;
  const trail = lastFoot === "L" ? "R" : "L";
  prints[trail].push(mk(trail, total));
  // swing windows in body distance s: land at (print.s - dLand), lift a swing length earlier
  type Sw = { from: Fp; to: Fp; s0: number; s1: number };
  const swings: Record<"L" | "R", Sw[]> = { L: [], R: [] };
  for (const foot of ["L", "R"] as const) {
    const ps = prints[foot];
    for (let j = 1; j < ps.length; j++) {
      const isFirst = ps[j - 1].s === 0;
      const isLast = ps[j].s >= total - 1e-6 && j === ps.length - 1;
      const dLand = isFirst ? 0.25 * (ps[j].s - ps[j - 1].s) : isLast ? 0.08 * L : 0.6 * L;
      const s1 = ps[j].s - dLand;
      const sw = isFirst ? Math.max(0.02 * L, s1) : 0.8 * L;
      const s0 = Math.max(0, s1 - sw);
      swings[foot].push({ from: ps[j - 1], to: ps[j], s0, s1: Math.max(s0 + 1, s1) });
    }
  }
  const footAt = (foot: "L" | "R", s: number) => {
    const sw = swings[foot];
    let cur = prints[foot][0];
    for (const w of sw) {
      if (s >= w.s1) {
        cur = w.to;
        continue;
      }
      if (s > w.s0) {
        const u = (s - w.s0) / (w.s1 - w.s0);
        const e = u * u * (3 - 2 * u);
        const dy = wrap180(w.to.yaw - w.from.yaw);
        return {
          X: lerp(w.from.X, w.to.X, e),
          Z: lerp(w.from.Z, w.to.Z, e),
          yaw: w.from.yaw + dy * e,
          lift: Math.sin(Math.PI * u) * 22 * c01((w.to.s - w.from.s) / (0.5 * L)),
          pitch: -16 * Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u) + 14 * sstep(0.55, 0.9, u) * (1 - sstep(0.9, 1, u)),
          swing: u,
        };
      }
      break;
    }
    return { X: cur.X, Z: cur.Z, yaw: cur.yaw, lift: 0, pitch: 0, swing: -1 };
  };
  /** the body (hips) over the path: its world position and the gait phase */
  const bodyAt = (s: number) => {
    const q = P.at(s);
    return { X: q.X, Z: q.Z };
  };
  const all = [...prints.L, ...prints.R].filter((p) => p.s > 0).sort((p, q) => p.s - q.s);
  const walk = (frame: number) => {
    const s = Math.max(0, spec.sAt(frame));
    const b = bodyAt(s);
    const H = spec.ground(b.X, b.Z);
    const d = P.dirAt(s);
    const pathYaw = s <= 0.5 ? startYaw : (() => {
      // ease from the start facing into the path's facing over the first step
      const py = yawOfDir(d.dX, d.dZ);
      return startYaw + wrap180(py - startYaw) * sstep(0, a0 * 1.2, s);
    })();
    const yaw = spec.yawAt ? spec.yawAt(frame, pathYaw) : pathYaw;
    const yr = yaw * D2R;
    const toLocal = (X: number, Z: number, Hh: number, lift: number): V3 => {
      const dX = (X - b.X) / FIG_W;
      const dZ = (Z - b.Z) / FIG_W;
      return [dX * Math.cos(yr) + dZ * Math.sin(yr), -(Hh - H) / FIG_W - ANKLE - lift, dX * Math.sin(yr) - dZ * Math.cos(yr)];
    };
    const feetLocal = (sx: number) => {
      const o = {} as Record<"L" | "R", FootState & { swing: number }>;
      for (const foot of ["L", "R"] as const) {
        const f = footAt(foot, sx);
        o[foot] = { p: toLocal(f.X, f.Z, spec.ground(f.X, f.Z), f.lift), pitch: f.pitch, yaw: wrap180(f.yaw - yaw), swing: f.swing };
      }
      return o;
    };
    const ft = feetLocal(s);
    // the gait's rhythm: the nearest print the body passes over
    let near = all[0];
    for (const p of all) if (Math.abs(p.s - s) < Math.abs(near.s - s)) near = p;
    const moving = sstep(0, 0.4 * L, s) * (1 - sstep(total - 0.25 * L, total, s));
    const ph = (s - near.s) / L;
    const bob = -3.2 * Math.cos(2 * Math.PI * ph) * moving;
    const swaySide = near.foot === "L" ? 1 : -1;
    const sway = 2.6 * swaySide * Math.cos(Math.PI * ph) * moving;
    // the hem lags the legs by ~2.5 frames and flares with the stride
    const sLag = Math.max(0, spec.sAt(frame - 2.5));
    const fl = feetLocal(sLag);
    const midX = (fl.L.p[0] + fl.R.p[0]) / 2;
    const midZ = (fl.L.p[2] + fl.R.p[2]) / 2;
    const spread = Math.abs(ft.L.p[2] - ft.R.p[2]);
    // the slope under her along her facing (for the lean and the hem)
    const ahead = spec.ground(b.X + Math.sin(yr) * 40, b.Z - Math.cos(yr) * 40);
    const behindH = spec.ground(b.X - Math.sin(yr) * 40, b.Z + Math.cos(yr) * 40);
    const grade = (ahead - behindH) / 80;
    const leftH = spec.ground(b.X + Math.cos(yr) * 40, b.Z + Math.sin(yr) * 40);
    const rightH = spec.ground(b.X - Math.cos(yr) * 40, b.Z - Math.sin(yr) * 40);
    const gradeX = (leftH - rightH) / 80;
    const head = spec.headAt ? spec.headAt(frame) : { yaw: 0, pitch: 2 };
    const w = windAt(frame);
    const pose: RebekahPose = {
      ...rebekahStand(frame, yaw),
      elev: spec.elevAt ? spec.elevAt(frame) : 8,
      lean: 1 + Math.atan(Math.max(0, grade)) / D2R * 0.55 + 3 * moving,
      headYaw: head.yaw,
      headPitch: head.pitch,
      feet: { L: ft.L, R: ft.R },
      pelvis: { x: sway, y: bob, twist: 0 },
      hem: { dx: midX * 0.3 + sway * 0.6, dz: midZ * 0.3, twist: -0.05 * (fl.L.p[2] - fl.R.p[2]), flare: 3 * c01(spread / 140) },
      armL: 2 + c01(moving * 3) * Math.max(-20, Math.min(20, -0.16 * ft.L.p[2])),
      wind: { g: w.g, ph: w.ph, dir: windDirLocal(yaw) },
      slope: [-gradeX, -grade],
    };
    return { X: b.X, Z: b.Z, H, yaw, pose, s, moving };
  };
  return { walk, prints, swings, L, total };
};

// ===================================================================================================================
// THE FARM WOMAN AND HER ROCKING CHAIR
// ===================================================================================================================
export type FarmWomanPose = {
  yaw: number;
  elev: number;
  /** the chair's tip back (deg, + = back) */
  rock: number;
  breath: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  wind: { g: number; ph: number; dir: [number, number] };
  frame: number;
};
export const ROCKER_R = 330;
export const ROCKER_HALF_LEN = 132;
export const farmWomanPose = (frame: number, o: { yaw?: number; elev?: number; rockAmp?: number; rockPeriod?: number; headYaw?: number; headPitch?: number } = {}): FarmWomanPose => {
  const t = frame / FPS;
  const per = o.rockPeriod ?? 2.6;
  const yaw = o.yaw ?? 35;
  const w = windAt(frame, 2);
  return {
    yaw,
    elev: o.elev ?? 8,
    rock: (o.rockAmp ?? 3.2) * Math.sin((t / per) * 2 * Math.PI) + 1.2,
    breath: breathOf(frame),
    headYaw: o.headYaw ?? 0,
    headPitch: o.headPitch ?? 3,
    headRoll: 1 + 0.7 * Math.sin((t / 6.3) * 2 * Math.PI),
    wind: { g: w.g * 0.6, ph: w.ph, dir: windDirLocal(yaw) },
    frame,
  };
};
/** the rocking transform: tip back about the rockers' centre and roll along the floor */
const rockXf = (rock: number): Xf => {
  const C: V3 = [0, -ROCKER_R, 0];
  return (p) => {
    const q = rotPitch(p, C, -rock);
    return [q[0], q[1], q[2] - ROCKER_R * rock * D2R];
  };
};
type Item = { s: Shape[]; depth: number };
/** the chair as depth-sorted items (figure space, before the rock) */
const chairItems = (v: View, xf: Xf, inks = CHAIR_INKS): Item[] => {
  const items: Item[] = [];
  const stick = (pts: V3[], w: number[], fill = inks.wood) => {
    const t = tube3(v, pts.map(xf), w);
    items.push({ s: [{ d: t.d, fill, sh: 0.6 }], depth: t.depth });
  };
  const rockerY = (z: number) => -(ROCKER_R - Math.sqrt(ROCKER_R * ROCKER_R - z * z)) - 5;
  for (const x of [-58, 58]) {
    const pts: V3[] = [];
    const ws: number[] = [];
    for (let k = 0; k <= 10; k++) {
      const z = lerp(-ROCKER_HALF_LEN, ROCKER_HALF_LEN, k / 10);
      pts.push([x, rockerY(z), z]);
      ws.push(lerp(9, 12, Math.sin((k / 10) * Math.PI)));
    }
    stick(pts, ws, inks.woodDark);
    // legs
    stick([[x * 0.96, -120, 40], [x, rockerY(44) - 2, 44]], [12, 11]);
    stick([[x * 0.96, -120, -42], [x, rockerY(-46) - 2, -46]], [12, 11]);
    // the back post, leaning back, and the arm with its front post
    stick([[x * 0.92, -122, -44], [x * 0.86, -300, -62], [x * 0.8, -432, -84]], [13, 12, 11]);
    stick([[x * 1.02, -122, 42], [x * 1.04, -226, 46]], [11, 10]);
    stick([[x * 0.96, -232, -52], [x * 1.04, -230, 10], [x * 1.08, -226, 58]], [11, 13, 15], inks.woodLit);
  }
  // the crest rail and the back spindles
  stick([[-50, -428, -82], [-25, -436, -86], [0, -438, -87], [25, -436, -86], [50, -428, -82]], [18, 19, 19, 19, 18], inks.woodLit);
  stick([[-52, -350, -70], [0, -354, -74], [52, -350, -70]], [9, 9, 9]);
  for (const x of [-30, -10, 10, 30]) stick([[x, -128, -46], [x * 0.95, -300, -66], [x * 0.9, -424, -84]], [7, 6.5, 6.5]);
  // the seat: a slab (top face + front edge)
  const seat = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number) => {
    const cn = (x: number, y: number, z: number) => pr2(v, xf([x, y, z]));
    const top = [cn(x0, y0, z0), cn(x1, y0, z0), cn(x1, y0, z1), cn(x0, y0, z1)];
    const fr = [cn(x0, y0, z1), cn(x1, y0, z1), cn(x1, y1, z1), cn(x0, y1, z1)];
    const d = proj(v, xf([0, y0, (z0 + z1) / 2])).d;
    items.push({ s: [{ d: smoothClosed(densify(top, 10), 0.4), fill: inks.woodLit, sh: 0.4 }, { d: smoothClosed(densify(fr, 8), 0.4), fill: inks.wood, sh: 0.3 }], depth: d - 30 });
  };
  seat(-60, 60, -50, 48, -126, -114);
  return items;
};
export const RockingChair: React.FC<{ at: P2; scale: number; uid: string; yaw: number; elev?: number; rock?: number; fog?: FolkFog | null; unitPx?: number }> = ({ at, scale, uid, yaw, elev = 8, rock = 0, fog, unitPx }) => {
  const v = makeView(yaw, elev);
  const items = chairItems(v, rockXf(rock)).sort((a, b) => a.depth - b.depth);
  return <RanchPaint shapes={items.flatMap((i) => i.s)} at={at} scale={scale} uid={uid} fog={fog} unitPx={unitPx} />;
};

export const buildFarmWoman = (pose: FarmWomanPose, o: { chair?: boolean; inks?: typeof FARM_INKS } = {}): Shape[] => {
  const inks = o.inks ?? FARM_INKS;
  const v = makeView(pose.yaw, pose.elev);
  const rx = rockXf(pose.rock);
  const br = pose.breath;
  // the torso leans back with the chair (8 deg) about her hips
  const hip: V3 = [0, -140, -10];
  const body: Xf = (p) => rx(rotPitch(p, hip, -8));
  const BODY_D = proj(v, rx([0, -200, -10])).d;
  // ---- the legs: thighs in the lap, shins down to the feet on the floor (the feet stay put while she rocks) ----------
  const legs: Shape[] = [];
  const legD: { s: Shape[]; d: number }[] = [];
  for (const x of [-20, 20]) {
    const knee = rx([x, -146, 104]);
    const ankle: V3 = [x * 1.08, -15, 122];
    const sh = tube3(v, [knee, lerp3(knee, ankle, 0.5), ankle], [30, 25, 19]);
    const fd: V3 = [0, 0, 1];
    const shoe = ellipsoidD(v, [x * 1.08, -8, 133], [mul3(fd, 20), [9.5, 0, 0], [0, 8.5, 0]]);
    legD.push({ s: [{ d: sh.d, fill: inks.stocking }, { d: shoe.d, fill: inks.shoes }], d: sh.depth });
  }
  legD.sort((a, b) => a.d - b.d).forEach((q) => legs.push(...q.s));
  // ---- the dress over the lap: the hull of the hips, the thighs and the hem below the knees ----------------------------
  const lapPts: P2[] = [];
  const ring = (c: V3, ax1: V3, ax2: V3, n = 18) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      lapPts.push(pr2(v, rx(add3(c, add3(mul3(ax1, Math.cos(a)), mul3(ax2, Math.sin(a)))))));
    }
  };
  ring([0, -150, -6], [58, 0, 0], [0, 0, 44]);
  ring([0, -150, 40], [56, 0, 0], [0, 24, 0]);
  ring([0, -148, 100], [52, 0, 0], [0, 22, 0]);
  ring([0, -64, 112], [62, 0, 0], [0, 0, 26]);
  const lap: Shape = { d: smoothClosed(densify(hull(lapPts), 12), 0.8), fill: inks.dress };
  // the apron: a cloth lying ON the thighs (dipping a little between them), rolling over the knees and hanging down
  // the front of the shins to a soft, slightly wavy lower edge. It never stands off into the air.
  const apronAt = (u: number, t: number): V3 => {
    const dip = 5 * (1 - u * u);
    if (t <= 0.55) {
      const q = t / 0.55;
      return [u * lerp(34, 44, q), -177 + dip * sstep(0.15, 1, q), lerp(12, 104, q)];
    }
    if (t <= 0.72) {
      const q = (t - 0.55) / 0.17;
      const th = q * Math.PI * 0.5;
      return [u * 44, -147 - 30 * Math.cos(th) + dip * (1 - q), 104 + 30 * Math.sin(th)];
    }
    const q = (t - 0.72) / 0.28;
    const wave = 3.5 * Math.sin(u * 4.2 + 1.3) * q;
    return [u * lerp(44, 47, q), lerp(-147, -86, q) + wave, lerp(134, 131, q)];
  };
  const apLoop: V3[] = [];
  const NU = 10;
  const NT = 16;
  for (let i = 0; i <= NU; i++) apLoop.push(apronAt(-1 + (2 * i) / NU, 0));
  for (let j = 1; j <= NT; j++) apLoop.push(apronAt(1, j / NT));
  for (let i = NU - 1; i >= 0; i--) apLoop.push(apronAt(-1 + (2 * i) / NU, 1));
  for (let j = NT - 1; j >= 1; j--) apLoop.push(apronAt(-1, j / NT));
  const f0 = Math.cos(pose.yaw * D2R);
  const apron: Shape = { d: smoothClosed(apLoop.map((p) => pr2(v, rx(p))), 0.5), fill: inks.apron, op: sstep(-0.25, 0.15, f0) };
  const apronFolds: P2[][] = [-0.4, 0.3].map((u) => [0.74, 0.85, 0.97].map((t) => pr2(v, rx(apronAt(u, t)))));
  const fold = [pr2(v, rx([0, -150, 70])), pr2(v, rx([0, -148, 108])), pr2(v, rx([0, -80, 124]))];
  // ---- the torso (dress bodice) and the shawl -------------------------------------------------------------------------
  const bodiceFn = (phi: number, t: number): V3 => {
    const s = Math.sin(phi * D2R);
    const c = Math.cos(phi * D2R);
    const y = lerp(-296, -152, t);
    const sh = sstep(0, 0.18, t);
    const a = lerp(22, 54, sh) + 6 * sstep(0.5, 1, t) + 1.4 * br;
    const b = lerp(20, 36, sh) + 6 * Math.exp(-(((t - 0.5) / 0.25) ** 2)) + 4 * sstep(0.6, 1, t) + br;
    return body([a * s, y, b * c - 8]);
  };
  const BD = drape(bodiceFn, 44, 9);
  // arms: from the shoulders, elbows at the sides, hands folded in the lap
  const shL = body([48, -276, -8]);
  const shR = body([-48, -276, -8]);
  const elL = body([56, -206, 4]);
  const elR = body([-56, -206, 4]);
  const wrL = rx([16, -168, 54]);
  const wrR = rx([-14, -170, 60]);
  const armL = armShapes(v, shL, elL, wrL, inks.dress, inks.skin, [29, 25, 21], 14);
  const armR = armShapes(v, shR, elR, wrR, inks.dress, inks.skin, [29, 25, 21], 14);
  const sp: ShawlSpec = {
    xf: body,
    neckY: -288,
    sideY: -222,
    frontY: -244,
    backY: -172,
    a: 63,
    bF: 40,
    bB: 42,
    wind: pose.wind,
    open: { half: 18, t: 0.99, tipHalf: 30 },
    inks,
    frame: pose.frame,
    wobble: 5,
  };
  // the shawl's two ends, falling from her shoulders down her front over the upper arms to her lap: soft knitted
  // strips, widening a little, with a wavy fringed end, stirring in the wind
  const shawlEnd = (sg: number): { s: Shape[]; d: number; f: number } => {
    const wx = pose.wind.dir[0] * pose.wind.g;
    const sw = Math.sin(pose.wind.ph * 1.1 + sg) * 1.6 * pose.wind.g;
    const cl: V3[] = [
      [sg * 30, -290, 16],
      [sg * 42, -266, 34],
      [sg * 45, -234, 42],
      [sg * 43 + wx * 2, -202, 47 + sw],
      [sg * 40 + wx * 4, -170, 51 + sw * 1.6],
    ];
    const ws = [20, 32, 36, 37, 38];
    const outer: P2[] = [];
    const inner: P2[] = [];
    cl.forEach((c, i) => {
      const h = ws[i] / 2;
      outer.push(pr2(v, body([c[0] + sg * h, c[1], c[2] - 5])));
      inner.push(pr2(v, body([c[0] - sg * h, c[1], c[2] + 2])));
    });
    const last = cl[cl.length - 1];
    const hw = ws[ws.length - 1] / 2;
    const endPts: P2[] = [];
    for (let k = 0; k <= 6; k++) {
      const u = k / 6;
      const xx = last[0] + sg * lerp(hw, -hw, u);
      endPts.push(pr2(v, body([xx, last[1] + 5 * Math.sin(u * Math.PI) + 2.5 * Math.sin(u * 9 + sg), lerp(last[2] - 5, last[2] + 2, u)])));
    }
    const strip = [...outer, ...endPts.slice(1, -1), ...inner.slice().reverse()];
    const band = [0.15, 0.5, 0.85].map((u) => pr2(v, body([last[0] + sg * lerp(hw, -hw, u), last[1] - 9, lerp(last[2] - 5, last[2] + 2, u)])));
    const fr: string[] = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      const xx = last[0] + sg * lerp(hw, -hw, u);
      const a = body([xx, last[1] + 4 * Math.sin(u * Math.PI), lerp(last[2] - 5, last[2] + 2, u)]);
      const b = add3(a, [wx * 3 + Math.sin(pose.wind.ph * 1.3 + k) * 1.5, 10, 0]);
      const pa = pr2(v, a);
      const pb = pr2(v, b);
      fr.push(`M ${n2(pa[0])} ${n2(pa[1])} L ${n2(pb[0])} ${n2(pb[1])}`);
    }
    const f = facing(v, dirOf(body, [sg * 0.35, -0.1, 0.93]));
    const op = sstep(-0.1, 0.25, f);
    return {
      s: [
        { d: smoothClosed(strip, 0.55), fill: inks.shawl, op },
        { d: smoothOpen(band), fill: inks.shawlBand, det: 2.2, keep: true, op: 0.75 * op },
        { d: fr.join(" "), fill: inks.fringe, det: 1.2, keep: true, op: 0.85 * op },
      ],
      d: proj(v, body(cl[2])).d,
      f,
    };
  };
  // shift the shawl down to her seated torso: its neck ring sits on her collar
  const hxfN: V3 = [0, -296, -8];
  const hxf: Xf = (p) => body(rotRoll(rotPitch(rotYaw(p, hxfN, pose.headYaw), hxfN, pose.headPitch), hxfN, pose.headRoll));
  const head = headShapes(v, {
    c: hxf([0, -340, -4]),
    R: 47,
    f: norm3(dirOf(hxf, [0, 0, 1])),
    up: norm3(dirOf(hxf, [0, -1, 0])),
    left: norm3(dirOf(hxf, [1, 0, 0])),
    inks,
    bun: { up: 18, back: 1, r: 18 },
    hairRho: 100,
    brows: 1.5,
    uid: "fw",
  });
  const neck = tube3(v, [body([0, -282, -6]), body([0, -306, -4])], [30, 28]);
  // ---- assemble ------------------------------------------------------------------------------------------------------
  const bL = 1 - sstep(-14, 6, proj(v, elL).d - BODY_D);
  const bR = 1 - sstep(-14, 6, proj(v, elR).d - BODY_D);
  const her: Shape[] = [];
  if (bL > 0.01) her.push({ ...armL.sleeve, op: bL });
  if (bR > 0.01) her.push({ ...armR.sleeve, op: bR });
  her.push(...legs, lap, apron);
  for (const fl of apronFolds) her.push({ d: smoothOpen(fl), fill: inks.apronLine, det: 1.1, keep: true, op: 0.3 * apron.op! });
  void fold;
  her.push({ d: outlineD(v, BD, 0.85), fill: inks.dress });
  her.push({ d: neck.d, fill: inks.skin, sh: 0.5 });
  if (bL < 0.99) her.push({ ...armL.sleeve, op: 1 - bL });
  if (bR < 0.99) her.push({ ...armR.sleeve, op: 1 - bR });
  her.push(...shawlShapes(v, sp, inks.dress));
  const ends = [shawlEnd(1), shawlEnd(-1)].sort((a, b) => a.d - b.d);
  for (const e of ends) her.push(...e.s);
  her.push(armL.hand, armR.hand);
  her.push(...head);
  if (o.chair === false) return her;
  const ch = chairItems(v, rx);
  // chair parts behind her body's centre go first, the near ones after (with a margin so she always sits in it)
  const back = ch.filter((i) => i.depth < BODY_D + 30).sort((a, b) => a.depth - b.depth);
  const front = ch.filter((i) => i.depth >= BODY_D + 30).sort((a, b) => a.depth - b.depth);
  return [...back.flatMap((i) => i.s), ...her, ...front.flatMap((i) => i.s)];
};
export const FarmWoman: React.FC<{ pose: FarmWomanPose; at: P2; scale: number; uid: string; fog?: FolkFog | null; unitPx?: number; chair?: boolean }> = ({ pose, at, scale, uid, fog, unitPx, chair = true }) => (
  <RanchPaint shapes={buildFarmWoman(pose, { chair })} at={at} scale={scale} uid={uid} fog={fog} unitPx={unitPx} />
);

// ===================================================================================================================
// SHADOWS AND THE CAMERA ANGLE
// ===================================================================================================================
/** a soft contact shadow under a figure standing (or a chair) at world X, Z on the ground at height Y (world) */
export const FolkShadowW: React.FC<{ A: AirWorld; X: number; Z: number; Y?: number; kind?: "stand" | "seated"; uid: string; amt?: number }> = ({ A, X, Z, Y = 0, kind = "stand", uid, amt = 0.8 }) =>
  kind === "stand" ? <AirShadow A={A} X={X} Z={Z} Y={Y} w={58} d={34} uid={uid} amt={amt} /> : <AirShadow A={A} X={X} Z={Z + 20} Y={Y} w={82} d={70} uid={uid} amt={amt} />;
/** the camera's elevation above a figure's middle (deg): eye height E (world, up +), the figure's ground H, the depth
 *  distance from the camera to the figure (world) */
export const elevOf = (E: number, H: number, dist: number, midH = 150) => Math.atan2(E - (H + midH), Math.max(1, dist)) / D2R;
