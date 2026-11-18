// ---------------------------------------------------------------------------
// rulesShared — the shared pieces of "toto - if i could write the rules" (Cheeky Pint S4E01; cut 3 OpenUnderTheCap,
// cut 22 OneCarRunsAway). Cheeky Pint picture-book world (styles/cheeky-pint.md, palette B1): every colour, shadow
// recipe and bloom is stoutShared's / museShared's, imported, never restated. Builder A owns this file; after
// notes/RULES_READY.md, existing exports keep their meaning (new names only, logged in notes/SHARED_CHANGES.md).
//
// EXPORTS
//   CardCar      a plain picture-book F1 card car, SIDE VIEW facing right, on champShared's true-scale F1 proportions
//                (5.62 m, wheelbase 3.60 m, 0.72 m tyres): flat matte card fills with a top-lit ramp per part, ink
//                tyres, no outlines, no text. `tone` picks a muted team-neutral body tone (CAR_TONES); never amber.
//   WildCar      the same car plus the free-reign parts, each on its own 0..1 prop (all amber, with the kit's bloom):
//                  wing    a tall STILT REAR WING (1968 Lotus/Ferrari): it rises out of the engine cover on two struts
//                          (0 = hidden inside the bodywork, 1 = the plank high over the rear axle)
//                  wing2   a second, higher plank rising off the first on the same struts (the "bigger wing")
//                  fan     a big REAR FAN (Brabham BT46B): it slides out from behind the rear tyre to the tail
//                  wheels  an extra pair of SMALL FRONT WHEELS (Tyrrell P34): it slides out from behind the front tyre
//                fanSpin (deg) turns the blades, fanSpeed (deg/frame) blurs them.
//   carSil       the union silhouette (world px) of a car, for one UnionShadow
//   CAR, CAR_TONES, carPoint   geometry (metres), tones, a car-metre -> world point helper
//   Engineer     a standing picture-book crew member (cabinCast's face: big round head, dot eye, blush, nose bump),
//                team shirt, F1 radio headset with a boom mic; overalls when spec.overalls. Facing left or right.
//   ENGINEER, ENGINEERS, EngineerPose, restPose   the rig (rig px), the three crew specs, the pose type
//   IdeaBubble   a small amber idea bubble (thought bubble with two tail dots back to the head) holding a tiny ink
//                sketch of one part: "wing" | "fan" | "wheels".
//
// UNITS. World px, y down, M = 400 world px per metre (champShared). A car's (x, y) is the GROUND point straight below
// its cockpit (the driver's helmet centre), as champShared's F1Outline: so an F1Outline at the same (x, y) traces it.
// Car geometry is in METRES, y up, x forward from the cockpit. `k` = the camera's screen px per world px on the car's
// plane (bloom and hot edges are SCREEN px). `lift` raises the whole car (stands, a jack) in world px; the shadow stays
// on the ground. An Engineer's (x, y) is the ground point between its feet; `size` = world px per rig px.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR, EDGE, AmberGradient, ELEVATION, bloomFilter, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, type SilItem } from "../kits/cheeky-pint/museShared";
import { F1, M, type P2 } from "../toto-champion-eight/champShared";
import { CLOTH, HAIR, SKIN, solveArm } from "../scott-free-wifi/cabinCast";

export { M, F1 };
export type { P2 };
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const D2R = Math.PI / 180;
const uidOf = (raw: string) => `rs${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const LIGHT_TINT = "#FFF4E2";
const topOf = (c: string, t = 0.14) => mixHex(c, LIGHT_TINT, t);
const footOf = (c: string, t = 0.16) => mixHex(c, COLOR.shadow, t);
const ease = (u: number) => smoothstep(clamp01(u));

/** maps every coordinate pair of an absolute M/L/C/Q/Z path (metres, y up) through T */
const mapPath = (d: string, T: (x: number, y: number) => P2) => {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let out = "";
  let nums: number[] = [];
  const flush = () => {
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const p = T(nums[i], nums[i + 1]);
      out += `${i ? " " : ""}${f3(p[0])} ${f3(p[1])}`;
    }
    nums = [];
  };
  for (const t of tokens) {
    if (/[MLCQZ]/.test(t)) {
      flush();
      out += t;
    } else nums.push(parseFloat(t));
  }
  flush();
  return out;
};
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;

// ===========================================================================
// THE CAR
// ===========================================================================
/** car geometry, metres from the cockpit ground point (y up). Body, axles and tyres are champShared's F1. */
export const CAR = {
  rearAxle: F1.rearAxle, // -1.45
  frontAxle: F1.frontAxle, // +2.15
  tyreR: F1.tyreR, // 0.36
  rimR: F1.rimR,
  tail: F1.rearWing, // -2.41
  nose: F1.frontWing, // +3.21
  /** the car's middle along x (the camera aims here to centre the whole car) */
  mid: (F1.rearWing + F1.frontWing) / 2,
  helmet: F1.cockpit, // (0, 0.67)
  helmetR: 0.16,
  /** the stilt wing: the plank's centre x, chord, its rest (hidden) and raised heights (plank centre, m) */
  wing: { x: -1.3, chord: 1.5, thick: 0.28, y0: 0.34, y1: 2.5, y2: 3.2, struts: [-1.72, -0.9] as const },
  /** the fan: from behind the engine cover out past the tail (clipped at the tail line, x < -2.0) */
  fan: { from: [-1.45, 0.56] as P2, to: [-2.8, 0.56] as P2, r: 0.52, tailX: -2.0 },
  /** the extra small front wheel: from behind the front tyre to just behind it (a second front axle, Tyrrell P34) */
  wheels: { from: [F1.frontAxle, 0.37] as P2, to: [1.5, 0.33] as P2, r: 0.33 },
} as const;
/** a car-metre point -> world px for a car at (x, y) lifted by `lift` world px */
export const carPoint = (x: number, y: number, mx: number, my: number, lift = 0): P2 => [x + mx * M, y - my * M - lift];

/** muted team-neutral body tones (card, never amber). cream = the subject car. */
export const CAR_TONES = {
  cream: COLOR.cream,
  oat: "#E2CFAA",
  sage: "#A3A77A",
  denim: "#8C94A0",
  terracotta: "#C98A6C",
  plum: "#A57F8A",
} as const;
export type CarTone = keyof typeof CAR_TONES;
/** each body tone's trim (the engine-cover fin and the nose band) */
const TRIM: Record<CarTone, string> = {
  cream: CLOTH.sage,
  oat: CLOTH.rust,
  sage: "#6F7448",
  denim: "#5E6675",
  terracotta: "#8E4F37",
  plum: "#71515B",
};

// the body (metres, y up): roll hoop -> airbox -> engine cover -> gearbox -> diffuser -> floor -> chassis -> under the
// nose -> nose tip -> nose top -> chassis top -> the cockpit rim
const BODY =
  "M-0.25 0.6 L-0.27 0.72 C-0.29 0.86 -0.33 0.95 -0.42 0.955 C-0.55 0.962 -0.7 0.932 -0.85 0.862 C-1.15 0.72 -1.5 0.56 -1.85 0.47 " +
  "L-2.02 0.44 C-2.07 0.42 -2.08 0.36 -2.06 0.3 L-2.0 0.12 C-1.95 0.07 -1.85 0.05 -1.7 0.05 L1.25 0.05 C1.32 0.05 1.36 0.1 1.38 0.18 " +
  "C1.55 0.26 1.95 0.3 2.3 0.27 C2.6 0.24 2.85 0.2 3.0 0.19 C3.07 0.19 3.09 0.25 3.03 0.275 C2.75 0.37 2.35 0.47 1.9 0.535 " +
  "C1.4 0.6 0.9 0.64 0.55 0.645 C0.45 0.645 0.38 0.62 0.3 0.6 Z";
/** the sidepod (a shade panel: inlet lip, downwash to the rear tyre, undercut) */
const SIDEPOD = "M0.4 0.585 C-0.1 0.565 -0.7 0.47 -1.25 0.33 C-1.1 0.2 -0.6 0.14 0.0 0.13 L0.44 0.14 C0.37 0.26 0.35 0.42 0.4 0.585 Z";
/** the trim: an engine-cover fin and a band along the nose */
const FIN = "M-0.5 0.93 C-1.0 0.86 -1.6 0.72 -2.0 0.62 L-2.0 0.5 C-1.6 0.56 -1.0 0.7 -0.48 0.82 Z";
const NOSE_BAND = "M1.0 0.6 C1.6 0.56 2.3 0.44 2.88 0.27 L2.95 0.215 C2.4 0.33 1.7 0.43 1.02 0.5 Z";
/** the cockpit opening (dark), the airbox mouth */
const COCKPIT = "M-0.24 0.6 L0.42 0.6 C0.38 0.63 0.34 0.64 0.3 0.64 L-0.22 0.64 Z";
const AIRBOX = "M-0.29 0.84 C-0.31 0.9 -0.35 0.93 -0.43 0.935 L-0.42 0.87 C-0.37 0.865 -0.33 0.855 -0.29 0.84 Z";
/** the halo (a stroke) */
const HALO = "M0.56 0.64 C0.53 0.74 0.47 0.84 0.36 0.872 C0.2 0.905 -0.05 0.905 -0.2 0.87 C-0.27 0.85 -0.3 0.8 -0.295 0.72";
/** the front wing: main plane + endplate; the nose pylon */
const FRONT_WING = "M2.6 0.06 C2.6 0.035 2.63 0.03 2.68 0.03 L3.16 0.03 C3.2 0.03 3.22 0.05 3.22 0.08 L3.22 0.2 C3.22 0.225 3.2 0.23 3.18 0.23 L3.13 0.23 C3.11 0.23 3.1 0.22 3.1 0.2 L3.1 0.14 L2.66 0.13 C2.62 0.13 2.6 0.1 2.6 0.06 Z";
const PYLON = "M2.78 0.13 L2.86 0.13 L2.92 0.21 L2.84 0.22 Z";
/** the low rear wing (the endplate face, its top flap) and its pylon */
const REAR_WING = "M-2.41 0.68 C-2.41 0.65 -2.39 0.64 -2.36 0.64 L-2.03 0.64 C-2.0 0.64 -1.98 0.66 -1.98 0.69 L-1.98 0.9 C-1.98 0.925 -2.0 0.935 -2.03 0.935 L-2.36 0.935 C-2.39 0.935 -2.41 0.92 -2.41 0.89 Z";
const REAR_FLAP = "M-2.41 0.84 L-1.98 0.86 L-1.98 0.9 C-1.98 0.925 -2.0 0.935 -2.03 0.935 L-2.36 0.935 C-2.39 0.935 -2.41 0.92 -2.41 0.89 Z";
const REAR_PYLON = "M-2.12 0.44 L-2.04 0.44 L-2.08 0.65 L-2.16 0.65 Z";

const TYRE = COLOR.inkDark;
const TYRE_WALL = mixHex(COLOR.inkDark, COLOR.board, 0.16);
const RIM = mixHex(COLOR.board, COLOR.cream, 0.45);
const RIM_SLOT = mixHex(COLOR.inkDark, COLOR.board, 0.3);
const DARK_OPEN = mixHex(COLOR.inkDark, COLOR.board, 0.18);
const HALO_TONE = mixHex(COLOR.inkDark, COLOR.board, 0.42);
const AMBER_INK = mixHex(COLOR.amberFoot, COLOR.inkDark, 0.62);

export type CardCarProps = {
  /** the ground point below the cockpit (world px) */
  x: number;
  y: number;
  /** camera k on the car's plane (bloom and hot edges are screen px) */
  k: number;
  tone?: CarTone;
  /** 0..1 toward board (context), by tone never opacity */
  dim?: number;
  /** distance rolled (world px): the hubs turn by it; wheelSpeed (world px / frame) blurs the spokes */
  wheelSpin?: number;
  wheelSpeed?: number;
  /** the body on its tyres (world px, + = up): the tyres stay put */
  bob?: number;
  /** the whole car raised (world px): on stands, on a jack */
  lift?: number;
  /** a driver's helmet in the cockpit (a helmet tone), or none (an empty seat) */
  driver?: string | null;
  shadow?: boolean;
};
export type WildCarProps = CardCarProps & {
  wing?: number;
  wing2?: number;
  fan?: number;
  wheels?: number;
  fanSpin?: number;
  fanSpeed?: number;
  /** the amber band (world y0, y1): amberBandFor(cam) of the car's plane */
  amberBand: [number, number];
};

/** a hub: tyre, wall, rim with three spokes turned by `ang` (deg); `blur` 0..1 spins the spokes into a disc */
const CarWheel: React.FC<{ c: P2; r: number; rim: number; ang: number; blur: number; dim: number; rimFill?: string; hot?: string; lw?: number }> = ({ c, r, rim, ang, blur, dim, rimFill, hot, lw = 0 }) => {
  const tone = (col: string) => mixHex(col, COLOR.boardFoot, dim * 0.25);
  const spokes = [0, 120, 240].map((a) => {
    const t = (ang + a) * D2R;
    return `M${f3(c[0])} ${f3(c[1])}L${f3(c[0] + Math.cos(t) * rim * 0.86)} ${f3(c[1] + Math.sin(t) * rim * 0.86)}`;
  });
  return (
    <g>
      <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(r)} fill={TYRE} />
      <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(r * 0.86)} fill={TYRE_WALL} />
      <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(rim)} fill={rimFill ?? tone(RIM)} />
      {hot ? <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(rim)} fill="none" stroke={hot} strokeWidth={f3(lw)} /> : null}
      <g opacity={f3(1 - 0.85 * clamp01(blur))}>
        {spokes.map((d, i) => (
          <path key={i} d={d} stroke={rimFill ? AMBER_INK : tone(RIM_SLOT)} strokeWidth={f3(rim * 0.24)} strokeLinecap="round" />
        ))}
      </g>
      {blur > 0.01 ? <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(rim * 0.8)} fill="none" stroke={rimFill ? AMBER_INK : tone(RIM_SLOT)} strokeOpacity={f3(0.28 * clamp01(blur))} strokeWidth={f3(rim * 0.5)} /> : null}
      <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(rim * 0.22)} fill={rimFill ? AMBER_INK : tone(mixHex(RIM, COLOR.cream, 0.4))} />
    </g>
  );
};

/** the union silhouette of a car (body, wings, tyres; the wild parts when out), world px */
export const carSil = (p: CardCarProps & Partial<WildCarProps>): SilItem[] => {
  const lift = p.lift ?? 0;
  const bob = p.bob ?? 0;
  const T = (mx: number, my: number) => carPoint(p.x, p.y, mx, my, lift + bob);
  const Tw = (mx: number, my: number) => carPoint(p.x, p.y, mx, my, lift);
  const R = CAR.tyreR * M;
  const out: SilItem[] = [
    { d: mapPath(BODY, T) },
    { d: mapPath(FRONT_WING, T) },
    { d: mapPath(REAR_WING, T) },
    { d: circleD(...Tw(CAR.rearAxle, CAR.tyreR), R) },
    { d: circleD(...Tw(CAR.frontAxle, CAR.tyreR), R) },
  ];
  const w = clamp01(p.wing ?? 0);
  if (w > 0.02) {
    const g = wingGeom(clamp01(p.wing ?? 0), clamp01(p.wing2 ?? 0));
    out.push({ d: mapPath(g.plank1, T) });
    if (g.show2) out.push({ d: mapPath(g.plank2, T) });
    for (const s of g.struts) out.push({ d: `M${f3(T(s[0], s[1])[0])} ${f3(T(s[0], s[1])[1])}L${f3(T(s[0], s[2])[0])} ${f3(T(s[0], s[2])[1])}`, stroke: 0.05 * M });
  }
  const fn = clamp01(p.fan ?? 0);
  if (fn > 0.02) {
    const c = fanCentre(fn);
    out.push({ d: circleD(...T(c[0], c[1]), CAR.fan.r * M) });
  }
  const wh = clamp01(p.wheels ?? 0);
  if (wh > 0.02) {
    const c = wheelsCentre(wh);
    out.push({ d: circleD(...Tw(c[0], c[1]), CAR.wheels.r * M) });
  }
  return out;
};

/** an aerofoil plank (metres) centred at (cx, cy), chord c, thickness t, nose down by `aoa` deg (facing right) */
const plankD = (cx: number, cy: number, c: number, t: number, aoa = 7) => {
  const pts: P2[] = [];
  const n = 18;
  // a cambered teardrop: thick at a quarter chord from the leading edge (front = +x)
  for (let i = 0; i <= n; i++) {
    const u = i / n; // 0 = leading edge .. 1 = trailing edge
    const th = t * 2.2 * Math.sqrt(u) * (1 - u) * (1 - 0.15 * u);
    pts.push([c / 2 - u * c, th * 0.55]);
  }
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    const th = t * 2.2 * Math.sqrt(u) * (1 - u) * (1 - 0.15 * u);
    pts.push([c / 2 - u * c, -th * 0.45]);
  }
  const a = -aoa * D2R; // the nose (front, +x) down
  const rot = pts.map(([x, y]): P2 => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  return `M${rot.map((q) => `${f3(q[0])} ${f3(q[1])}`).join(" L")} Z`;
};
/** the stilt wing at `w` (rise), `w2` (second tier): planks (metres) and struts [x, y bottom, y top] */
const wingGeom = (w: number, w2: number) => {
  const W = CAR.wing;
  const y1 = lerp(W.y0, W.y1, ease(w));
  const y2 = lerp(y1, W.y2, ease(w2));
  const show2 = w2 > 0.002;
  const top = show2 ? y2 : y1;
  // the struts meet the plank's underside; they run from inside the engine cover (y 0.3) to the top plank
  const struts = W.struts.map((sx) => [sx, 0.3, top - 0.02] as [number, number, number]);
  return {
    y1,
    y2,
    show2,
    plank1: plankD(W.x, y1, W.chord, W.thick),
    plank2: plankD(W.x - 0.04, y2, W.chord * 0.92, W.thick * 0.95),
    struts,
  };
};
const fanCentre = (u: number): P2 => {
  const e = ease(u);
  // a short arc: back along the tail and up (it clears the rear tyre, then rises to the gearbox's height)
  const a = CAR.fan.from;
  const b = CAR.fan.to;
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], Math.pow(e, 1.6))];
};
const wheelsCentre = (u: number): P2 => {
  const e = ease(u);
  const a = CAR.wheels.from;
  const b = CAR.wheels.to;
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
};

/** THE CAR (CardCar and WildCar share it). Side view, facing right. */
const CarBody: React.FC<WildCarProps & { wild: boolean }> = (p) => {
  const uid = uidOf(useId());
  const lift = p.lift ?? 0;
  const bob = p.bob ?? 0;
  const k = p.k;
  const tone = p.tone ?? "cream";
  const dim = clamp01(p.dim ?? 0);
  const base = mixHex(CAR_TONES[tone], COLOR.board, dim);
  const trim = mixHex(TRIM[tone], COLOR.board, dim * 0.55);
  const T = (mx: number, my: number) => carPoint(p.x, p.y, mx, my, lift + bob);
  const Tw = (mx: number, my: number) => carPoint(p.x, p.y, mx, my, lift);
  const top = T(0, 0.96)[1];
  const foot = T(0, 0.05)[1];
  const R = CAR.tyreR * M;
  const rimR = CAR.rimR * M;
  const spin = (r: number) => (((p.wheelSpin ?? 0) / r) * 180) / Math.PI;
  const blur = (r: number) => clamp01((Math.abs(p.wheelSpeed ?? 0) / r / D2R - 24) / 24);
  const wing = p.wild ? clamp01(p.wing ?? 0) : 0;
  const wing2 = p.wild ? clamp01(p.wing2 ?? 0) : 0;
  const fan = p.wild ? clamp01(p.fan ?? 0) : 0;
  const wheels = p.wild ? clamp01(p.wheels ?? 0) : 0;
  const band = p.amberBand ?? [top - 400, foot + 400];
  const hot = EDGE.HOT / k;
  const bloom = { filter: bloomFilter(k) };
  // contact shadows fade as the car lifts off the ground
  const ct = ELEVATION.rest.contact;
  const contactA = ct ? ct.a * (1 - smoothstep(clamp01(lift / (0.12 * M)))) : 0;
  const shadowLift = clamp01(lift / (0.35 * M));
  // --- the stilt wing (behind the body: it rises out of the engine cover) ---
  const wg = wing > 0.002 ? wingGeom(wing, wing2) : null;
  const strutW = 0.06 * M;
  // --- the fan ---
  const fc = fan > 0.002 ? T(...fanCentre(fan)) : null;
  const fr = CAR.fan.r * M;
  const fanBlur = clamp01((Math.abs(p.fanSpeed ?? 0) - 9) / 14);
  // --- the extra wheel ---
  const wc = wheels > 0.002 ? Tw(...wheelsCentre(wheels)) : null;
  const wr = CAR.wheels.r * M;
  const helmet = T(CAR.helmet[0], CAR.helmet[1]);
  const hr = CAR.helmetR * M;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(foot)}>
          <stop offset="0" stopColor={topOf(base)} />
          <stop offset="1" stopColor={footOf(base)} />
        </linearGradient>
        <linearGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(foot)}>
          <stop offset="0" stopColor={topOf(trim, 0.1)} />
          <stop offset="1" stopColor={footOf(trim, 0.12)} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <clipPath id={`${uid}fc`}>
          <rect x={f3(T(CAR.fan.tailX, 0)[0] - 3 * M)} y={f3(T(0, 2.5)[1])} width={f3(3 * M)} height={f3(3 * M)} />
        </clipPath>
      </defs>
      {p.shadow === false ? null : (
        <g>
          <UnionShadow sil={carSil({ ...p, lift: 0, bob: 0 }).map((q) => ({ ...q, tf: `translate(0 ${f3(0)})` }))} s={3.2 + 3 * shadowLift} elevation="rest" lift={shadowLift} />
          {contactA > 0.01
            ? [CAR.rearAxle, CAR.frontAxle, ...(wc ? [wheelsCentre(wheels)[0]] : [])].map((ax, i) => (
                <ellipse
                  key={i}
                  cx={f3(p.x + ax * M + (ct?.dx ?? 1) * 3)}
                  cy={f3(p.y)}
                  rx={f3((i === 2 ? wr : R) * 0.9)}
                  ry={f3(0.02 * M)}
                  fill={COLOR.shadow}
                  opacity={f3(contactA)}
                  style={{ filter: `blur(${f3((ct?.blur ?? 2.5) * 3)}px)` }}
                />
              ))
            : null}
        </g>
      )}
      {/* the stilt wing: struts and planks, behind the body (they rise out of it) */}
      {wg ? (
        <g style={bloom}>
          {wg.struts.map((s, i) => {
            const a = T(s[0], s[1]);
            const b = T(s[0], s[2]);
            return <path key={i} d={`M${f3(a[0])} ${f3(a[1])}L${f3(b[0])} ${f3(b[1])}`} stroke={COLOR.amberFoot} strokeWidth={f3(strutW)} strokeLinecap="round" />;
          })}
          {wg.show2 ? <path d={mapPath(wg.plank2, T)} fill={`url(#${uid}a)`} /> : null}
          {wg.show2 ? <path d={mapPath(wg.plank2, T)} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(hot)} strokeDasharray="0.5 0.5" pathLength={1} /> : null}
          <path d={mapPath(wg.plank1, T)} fill={`url(#${uid}a)`} />
          <path d={mapPath(wg.plank1, T)} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(hot)} strokeDasharray="0.5 0.5" pathLength={1} />
        </g>
      ) : null}
      {/* the fan: behind the body, clipped at the tail line (it slides out from behind the gearbox) */}
      {fc ? (
        <g clipPath={`url(#${uid}fc)`}><g style={bloom}>
          {/* its mount to the gearbox */}
          <path d={`M${f3(T(-2.0, 0.36)[0])} ${f3(T(-2.0, 0.36)[1])}L${f3(fc[0])} ${f3(fc[1])}`} stroke={COLOR.amberFoot} strokeWidth={f3(0.07 * M)} strokeLinecap="round" />
          <circle cx={f3(fc[0])} cy={f3(fc[1])} r={f3(fr)} fill={`url(#${uid}a)`} />
          <circle cx={f3(fc[0])} cy={f3(fc[1])} r={f3(fr * 0.8)} fill={mixHex(COLOR.amberFoot, COLOR.inkDark, 0.35)} />
          <g opacity={f3(1 - 0.8 * fanBlur)}>
            {[0, 90, 180, 270].map((a) => {
              const t = ((p.fanSpin ?? 0) + a) * D2R;
              const L = fr * 0.74;
              const W = fr * 0.26;
              const tip: P2 = [fc[0] + Math.cos(t) * L, fc[1] + Math.sin(t) * L];
              const side: P2 = [Math.cos(t + Math.PI / 2) * W, Math.sin(t + Math.PI / 2) * W];
              const mid: P2 = [fc[0] + Math.cos(t) * L * 0.55, fc[1] + Math.sin(t) * L * 0.55];
              return (
                <path
                  key={a}
                  d={`M${f3(fc[0])} ${f3(fc[1])}Q${f3(mid[0] + side[0])} ${f3(mid[1] + side[1])} ${f3(tip[0])} ${f3(tip[1])}Q${f3(mid[0] - side[0] * 0.2)} ${f3(mid[1] - side[1] * 0.2)} ${f3(fc[0])} ${f3(fc[1])}Z`}
                  fill={COLOR.amberTop}
                />
              );
            })}
          </g>
          {fanBlur > 0.01 ? <circle cx={f3(fc[0])} cy={f3(fc[1])} r={f3(fr * 0.5)} fill="none" stroke={COLOR.amberTop} strokeOpacity={f3(0.5 * fanBlur)} strokeWidth={f3(fr * 0.5)} /> : null}
          <circle cx={f3(fc[0])} cy={f3(fc[1])} r={f3(fr * 0.16)} fill={AMBER_INK} />
          <circle cx={f3(fc[0])} cy={f3(fc[1])} r={f3(fr - hot / 2)} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(hot)} strokeDasharray="0.42 0.58" strokeDashoffset={0.45} pathLength={1} />
        </g></g>
      ) : null}
      {/* the low rear wing and its pylon */}
      <path d={mapPath(REAR_PYLON, T)} fill={footOf(base, 0.3)} />
      <path d={mapPath(REAR_WING, T)} fill={`url(#${uid}b)`} />
      <path d={mapPath(REAR_FLAP, T)} fill={`url(#${uid}t)`} />
      {/* the body, sidepod, trim */}
      <path d={mapPath(BODY, T)} fill={`url(#${uid}b)`} />
      <path d={mapPath(SIDEPOD, T)} fill={footOf(base, 0.1)} />
      <path d={mapPath(FIN, T)} fill={`url(#${uid}t)`} />
      <path d={mapPath(NOSE_BAND, T)} fill={`url(#${uid}t)`} />
      <path d={mapPath(COCKPIT, T)} fill={DARK_OPEN} />
      <path d={mapPath(AIRBOX, T)} fill={DARK_OPEN} />
      {/* the front wing and pylon */}
      <path d={mapPath(PYLON, T)} fill={footOf(base, 0.3)} />
      <path d={mapPath(FRONT_WING, T)} fill={`url(#${uid}b)`} />
      {/* the driver's helmet (when driven) */}
      {p.driver ? (
        <g>
          <circle cx={f3(helmet[0])} cy={f3(helmet[1])} r={f3(hr)} fill={topOf(p.driver)} />
          <path d={`M${f3(helmet[0] - hr * 0.1)} ${f3(helmet[1] - hr * 0.42)}L${f3(helmet[0] + hr * 0.98)} ${f3(helmet[1] - hr * 0.42)}L${f3(helmet[0] + hr * 0.92)} ${f3(helmet[1] + hr * 0.12)}L${f3(helmet[0] + hr * 0.05)} ${f3(helmet[1] + hr * 0.12)}Z`} fill={DARK_OPEN} />
        </g>
      ) : null}
      {/* the halo */}
      <path d={mapPath(HALO, T)} fill="none" stroke={HALO_TONE} strokeWidth={f3(0.05 * M)} strokeLinecap="round" strokeLinejoin="round" />
      {/* the extra small front wheel: over the body, under the front tyre (it slides out from behind it) */}
      {wc ? (
        <g style={bloom}>
          {/* the second front axle's wishbones: hub up to the nose's floor, so it reads as an axle, not a spare */}
          {[-0.3, 0.3].map((dx, i) => {
            const b = T(wheelsCentre(wheels)[0] + dx, 0.5);
            return <path key={i} d={`M${f3(wc[0])} ${f3(wc[1])}L${f3(b[0])} ${f3(b[1])}`} stroke={DARK_OPEN} strokeWidth={f3(0.045 * M)} strokeLinecap="round" />;
          })}
          <CarWheel c={wc} r={wr} rim={wr * 0.64} ang={spin(wr)} blur={blur(wr)} dim={0} rimFill={`url(#${uid}a)`} hot={COLOR.amberHot} lw={hot} />
        </g>
      ) : null}
      {/* the tyres (outermost) */}
      <CarWheel c={Tw(CAR.rearAxle, CAR.tyreR)} r={R} rim={rimR} ang={spin(R)} blur={blur(R)} dim={dim} />
      <CarWheel c={Tw(CAR.frontAxle, CAR.tyreR)} r={R} rim={rimR} ang={spin(R)} blur={blur(R)} dim={dim} />
    </g>
  );
};

/** a plain card car (other teams; and the cut-3 car before its parts arrive) */
export const CardCar: React.FC<CardCarProps> = (p) => <CarBody {...p} amberBand={[0, 1]} wild={false} />;
/** the free-reign car: CardCar + the amber wild parts */
export const WildCar: React.FC<WildCarProps> = (p) => <CarBody {...p} wild />;

// ===========================================================================
// F1Car — THE car of both cuts (rev 1): a real modern (2022+) F1 side profile, a flat picture-book card car
// ===========================================================================
// Geometry: champShared's approved true-scale outline (F1_FWD / F1_BACK, copied here as fills, never edited there):
// 5.62 m, wheelbase 3.60 m, 18-inch wheels (0.72 m tyres) with flat wheel covers, halo, airbox, sidepod with its
// inlet and undercut, floor and diffuser, a multi-element front wing under the nose, the rear wing on a swan-neck
// pylon with the beam wing below. Matte fills, top-lit; carbon parts in a dark board-ink. Faces right.
// `upgrade` {frontWing, sidepod, rearWing} 0..1: the engineers' new part is fitted IN PLACE: the old part lifts a few
// centimetres out of its seat, reshapes into the new one (the new flap slides out from behind the endplate), warms
// to amber (bloom, hot top edge) and seats with a small settle. Nothing scales from nothing.

/** the body tones of the rev-1 cars: the hero cream (with a stout-dark accent) and four muted rivals */
export const F1_TONES = {
  cream: COLOR.cream,
  denim: "#5F6B7C",
  terracotta: "#B4704F",
  green: "#5E7250",
  plum: "#7C5866",
} as const;
export type F1Tone = keyof typeof F1_TONES;
const F1_ACCENT: Record<F1Tone, string> = {
  cream: mixHex(COLOR.inkDark, COLOR.board, 0.22),
  denim: "#3F4856",
  terracotta: "#7C4630",
  green: "#3F4E35",
  plum: "#553A44",
};
const CARBON = mixHex(COLOR.inkDark, COLOR.board, 0.3);
const CARBON_LIT = mixHex(COLOR.inkDark, COLOR.board, 0.5);

/** the body (closed, metres, y up): cockpit rim -> chassis -> nose -> under the nose -> floor -> diffuser -> gearbox ->
 *  engine cover -> airbox / roll hoop -> back to the cockpit rim. On F1_FWD / F1_BACK. */
const F1B_BODY =
  "M0.3 0.61 C0.42 0.615 0.5 0.63 0.56 0.64 C0.9 0.64 1.4 0.6 1.9 0.535 C2.35 0.48 2.72 0.36 2.98 0.265 C3.03 0.245 3.05 0.22 3.03 0.2 " +
  "L2.95 0.19 C2.7 0.26 2.4 0.32 2.05 0.37 C1.75 0.38 1.5 0.33 1.36 0.24 C1.3 0.2 1.27 0.13 1.26 0.09 C1.25 0.05 1.22 0.03 1.16 0.03 " +
  "L-1.0 0.03 L-1.55 0.045 C-1.75 0.08 -1.92 0.16 -2.02 0.26 L-2.04 0.405 L-1.98 0.45 " +
  "C-1.85 0.46 -1.65 0.5 -1.45 0.58 C-1.2 0.7 -0.95 0.85 -0.67 0.932 C-0.57 0.958 -0.47 0.962 -0.41 0.948 " +
  "C-0.33 0.925 -0.31 0.82 -0.29 0.7 C-0.28 0.64 -0.26 0.6 -0.2 0.6 Z";
/** the floor plank and the diffuser (carbon) */
const F1B_FLOOR = "M1.2 0.03 L-1.55 0.045 C-1.75 0.08 -1.92 0.16 -2.02 0.26 L-2.1 0.25 C-1.98 0.15 -1.8 0.1 -1.6 0.085 L1.2 0.075 Z";
/** the beam wing and the rear wing's swan-neck pylon (carbon) */
const F1B_BEAM = "M-2.24 0.415 C-2.26 0.43 -2.25 0.452 -2.22 0.455 L-2.04 0.46 L-2.03 0.41 Z";
const F1B_SWAN = "M-1.97 0.45 C-1.96 0.6 -1.98 0.72 -2.06 0.8 L-2.12 0.79 C-2.04 0.71 -2.02 0.6 -2.03 0.45 Z";
/** the cockpit opening, the airbox mouth, the sidepod inlet (dark) */
const F1B_COCKPIT = "M-0.2 0.6 L0.3 0.61 C0.36 0.615 0.4 0.625 0.44 0.64 L-0.22 0.645 Z";
const F1B_AIRBOX = "M-0.3 0.83 C-0.33 0.88 -0.37 0.905 -0.44 0.91 L-0.43 0.86 C-0.38 0.855 -0.34 0.845 -0.3 0.83 Z";
/** the accent: a stout-dark band along the nose and down the engine cover (the hero's livery) */
const F1B_ACCENT_NOSE = "M1.0 0.6 C1.6 0.565 2.3 0.47 2.9 0.29 L2.98 0.24 C2.4 0.37 1.7 0.47 1.02 0.53 Z";
const F1B_ACCENT_COVER = "M-0.62 0.9 C-0.95 0.8 -1.3 0.64 -1.95 0.47 L-1.97 0.43 C-1.4 0.56 -0.95 0.72 -0.6 0.83 Z";
/** the halo (stroke) and a mirror */
const F1B_HALO = "M0.56 0.64 C0.53 0.74 0.47 0.84 0.36 0.872 C0.2 0.905 -0.05 0.905 -0.2 0.87 C-0.27 0.85 -0.3 0.8 -0.295 0.72";
/** paired shapes (same commands): the standard part and the engineers' new one; morphed by the fit */
const F1P = {
  // the sidepod panel: inlet lip -> undercut to the floor -> downwash ramp to the rear tyre
  sidepod: [
    "M0.26 0.585 C0.25 0.5 0.27 0.38 0.31 0.31 C0.1 0.22 -0.3 0.16 -0.78 0.13 L-1.0 0.14 C-0.95 0.22 -1.0 0.3 -1.06 0.34 C-0.6 0.45 -0.1 0.55 0.26 0.585 Z",
    "M0.3 0.6 C0.31 0.53 0.33 0.45 0.37 0.4 C0.15 0.27 -0.25 0.18 -0.8 0.15 L-1.08 0.16 C-1.1 0.24 -1.16 0.3 -1.22 0.33 C-0.7 0.48 -0.15 0.58 0.3 0.6 Z",
  ],
  sidepodInlet: [
    "M0.26 0.585 L0.33 0.585 C0.32 0.5 0.33 0.4 0.36 0.33 L0.31 0.31 C0.27 0.38 0.25 0.5 0.26 0.585 Z",
    "M0.3 0.6 L0.38 0.6 C0.37 0.54 0.38 0.47 0.41 0.42 L0.37 0.4 C0.33 0.45 0.31 0.53 0.3 0.6 Z",
  ],
  // the front wing: endplate, main plane, flap, and the new second flap (hidden behind the endplate when standard)
  fwEnd: [
    "M2.98 0.06 C2.98 0.04 3.0 0.032 3.03 0.032 L3.17 0.032 C3.2 0.032 3.215 0.05 3.215 0.075 L3.2 0.19 C3.19 0.205 3.17 0.21 3.15 0.21 L3.02 0.2 C2.99 0.2 2.98 0.185 2.98 0.16 Z",
    "M2.9 0.06 C2.9 0.04 2.93 0.032 2.97 0.032 L3.18 0.032 C3.21 0.032 3.23 0.05 3.23 0.08 L3.22 0.24 C3.21 0.27 3.18 0.28 3.15 0.275 L2.95 0.25 C2.92 0.245 2.9 0.23 2.9 0.2 Z",
  ],
  fwMain: [
    "M2.6 0.07 C2.6 0.05 2.63 0.04 2.68 0.04 L3.0 0.04 L3.0 0.075 L2.66 0.09 C2.62 0.09 2.6 0.085 2.6 0.07 Z",
    "M2.52 0.07 C2.52 0.05 2.55 0.04 2.6 0.04 L2.95 0.04 L2.95 0.08 L2.58 0.095 C2.54 0.095 2.52 0.088 2.52 0.07 Z",
  ],
  fwFlap: [
    "M2.68 0.115 C2.68 0.1 2.7 0.095 2.74 0.095 L3.0 0.09 L3.0 0.13 L2.72 0.135 C2.69 0.135 2.68 0.127 2.68 0.115 Z",
    "M2.58 0.125 C2.58 0.11 2.6 0.105 2.64 0.105 L2.95 0.1 L2.95 0.14 L2.62 0.145 C2.59 0.145 2.58 0.137 2.58 0.125 Z",
  ],
  fwFlap2: [
    "M2.96 0.16 C2.96 0.15 2.97 0.148 2.98 0.148 L3.0 0.147 L3.0 0.178 L2.98 0.18 C2.965 0.18 2.96 0.172 2.96 0.16 Z",
    "M2.66 0.18 C2.66 0.165 2.68 0.16 2.72 0.16 L2.95 0.155 L2.95 0.195 L2.7 0.2 C2.67 0.2 2.66 0.192 2.66 0.18 Z",
  ],
  // the rear wing: endplate (the plate seen side-on) and its two element slots
  rwEnd: [
    "M-2.41 0.93 L-2.41 0.7 C-2.41 0.58 -2.37 0.49 -2.3 0.44 L-2.06 0.43 C-2.1 0.5 -2.08 0.6 -2.0 0.65 C-1.96 0.68 -1.94 0.72 -1.94 0.76 C-1.95 0.84 -1.99 0.9 -2.08 0.925 L-2.36 0.935 C-2.39 0.935 -2.41 0.935 -2.41 0.93 Z",
    "M-2.45 0.98 L-2.45 0.7 C-2.45 0.56 -2.4 0.47 -2.32 0.42 L-2.04 0.41 C-2.08 0.5 -2.06 0.6 -1.98 0.65 C-1.93 0.68 -1.9 0.73 -1.9 0.78 C-1.91 0.88 -1.96 0.95 -2.06 0.975 L-2.4 0.99 C-2.43 0.99 -2.45 0.99 -2.45 0.98 Z",
  ],
  rwMain: [
    "M-2.36 0.79 C-2.25 0.77 -2.1 0.775 -1.98 0.8 L-1.99 0.83 C-2.1 0.81 -2.25 0.805 -2.36 0.82 Z",
    "M-2.39 0.8 C-2.26 0.775 -2.08 0.78 -1.95 0.81 L-1.96 0.845 C-2.08 0.82 -2.26 0.815 -2.39 0.835 Z",
  ],
  rwFlap: [
    "M-2.36 0.865 C-2.27 0.85 -2.15 0.86 -2.05 0.885 L-2.07 0.91 C-2.16 0.89 -2.27 0.885 -2.36 0.895 Z",
    "M-2.39 0.9 C-2.28 0.88 -2.14 0.895 -2.02 0.93 L-2.05 0.965 C-2.15 0.935 -2.28 0.925 -2.39 0.94 Z",
  ],
} as const;
/** interpolates two paths with the same commands */
const lerpD = (a: string, b: string, t: number) => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const na = a.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const nb = b.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let i = 0;
  return a.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, () => {
    const v = lerp(parseFloat(na[i]), parseFloat(nb[i]), t);
    i++;
    return f3(v);
  });
};
/** a fit's phases (u 0..1): lift out of the seat, reshape, warm to amber, seat with a settle */
export const f1Fit = (u: number) => {
  const c = clamp01(u);
  const lift = Math.sin(Math.PI * clamp01(c / 0.75)) * (c < 0.75 ? 1 : 0) - 0.25 * Math.sin(Math.PI * clamp01((c - 0.75) / 0.25));
  return { lift, shape: smoothstep(clamp01((c - 0.12) / 0.55)), warm: smoothstep(clamp01((c - 0.3) / 0.55)) };
};
export type F1Upgrade = { frontWing?: number; sidepod?: number; rearWing?: number };
export type F1CarProps = {
  /** the ground point below the cockpit (world px) */
  x: number;
  y: number;
  /** camera k on the car's plane (bloom, hot edges: screen px) */
  k: number;
  /** the amber band (world y0, y1): amberBandFor(cam) of the car's plane */
  amberBand: [number, number];
  tone?: F1Tone;
  upgrade?: F1Upgrade;
  /** distance rolled (world px): the covers' marks turn by it */
  wheelSpin?: number;
  /** the body on its tyres (world px, + = up) */
  bob?: number;
  /** a driver's helmet tone, or none (an empty cockpit) */
  driver?: string | null;
  shadow?: boolean;
  /** 0..1 toward board (context), by tone never opacity */
  dim?: number;
};
/** the union silhouette of an F1Car (world px) for one UnionShadow */
export const f1CarSil = (p: Pick<F1CarProps, "x" | "y">): SilItem[] => {
  const T = (mx: number, my: number) => carPoint(p.x, p.y, mx, my);
  const R = F1.tyreR * M;
  return [
    { d: mapPath(F1B_BODY, T) },
    { d: mapPath(F1P.fwEnd[0], T) },
    { d: mapPath(F1P.fwMain[0], T) },
    { d: mapPath(F1P.rwEnd[0], T) },
    { d: circleD(...T(F1.rearAxle, F1.tyreR), R) },
    { d: circleD(...T(F1.frontAxle, F1.tyreR), R) },
  ];
};
export const F1Car: React.FC<F1CarProps> = (p) => {
  const uid = uidOf(useId());
  const tone = p.tone ?? "cream";
  const dim = clamp01(p.dim ?? 0);
  const dimC = (c: string) => mixHex(c, COLOR.boardFoot, dim * 0.35);
  const base = dimC(F1_TONES[tone]);
  const bob = p.bob ?? 0;
  const T = (mx: number, my: number) => carPoint(p.x, p.y, mx, my, bob);
  const Tw = (mx: number, my: number) => carPoint(p.x, p.y, mx, my, 0);
  const up = p.upgrade ?? {};
  const fits = { fw: f1Fit(up.frontWing ?? 0), sp: f1Fit(up.sidepod ?? 0), rw: f1Fit(up.rearWing ?? 0) };
  const hot = EDGE.HOT / p.k;
  const R = F1.tyreR * M;
  /** a part's transform: the lift (metres) along its direction */
  const off = (lift: number, dx: number, dy: number) => `translate(${f3(lift * dx * M)} ${f3(-lift * dy * M)})`;
  const carbon = dimC(CARBON);
  const carbonLit = dimC(CARBON_LIT);
  const amber = `url(#${uid}a)`;
  /** a part drawn in its standard fill, then the amber fill warming over it, with the hot top edge once warm */
  const part = (d: string, std: string, warm: number, key: string) => (
    <g key={key}>
      <path d={d} fill={std} />
      {warm > 0.001 ? (
        <g opacity={f3(warm)}>
          <path d={d} fill={amber} />
          <path d={d} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(hot)} strokeLinejoin="round" clipPath={`url(#${uid}top)`} />
        </g>
      ) : null}
    </g>
  );
  const wheel = (ax: number, i: number) => {
    const c = Tw(ax, F1.tyreR);
    const spin = (p.wheelSpin ?? 0) / R; // radians
    const cover = F1.rimR * M * 1.08;
    const marks = [0, 1, 2].map((j) => {
      const a = spin + (j * Math.PI * 2) / 3 + i;
      return <circle key={j} cx={f3(c[0] + Math.cos(a) * cover * 0.62)} cy={f3(c[1] + Math.sin(a) * cover * 0.62)} r={f3(cover * 0.09)} fill={carbonLit} />;
    });
    const wall = [0, 1].map((j) => {
      const a = spin * 1 + j * Math.PI + 0.6 + i;
      const r0 = R * 0.9;
      const a0 = a - 0.35;
      const a1 = a + 0.35;
      return <path key={j} d={`M${f3(c[0] + Math.cos(a0) * r0)} ${f3(c[1] + Math.sin(a0) * r0)}A${f3(r0)} ${f3(r0)} 0 0 1 ${f3(c[0] + Math.cos(a1) * r0)} ${f3(c[1] + Math.sin(a1) * r0)}`} fill="none" stroke={mixHex(COLOR.inkDark, COLOR.cream, 0.28)} strokeWidth={f3(R * 0.05)} strokeLinecap="round" />;
    });
    return (
      <g key={`w${i}`}>
        <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(R)} fill={dimC(TYRE)} />
        <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(R * 0.95)} fill="none" stroke={dimC(TYRE_WALL)} strokeWidth={f3(R * 0.04)} />
        {wall}
        <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(cover)} fill={dimC(mixHex(CARBON, COLOR.cream, 0.28))} />
        <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(cover * 0.94)} fill="none" stroke={carbonLit} strokeWidth={f3(cover * 0.05)} />
        {marks}
        <circle cx={f3(c[0])} cy={f3(c[1])} r={f3(cover * 0.16)} fill={dimC(F1_ACCENT[tone])} />
      </g>
    );
  };
  const top = T(0, F1.airboxTop)[1];
  const foot = T(0, 0)[1];
  const helmet = T(0, 0.68);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(foot)}>
          <stop offset="0" stopColor={topOf(base)} />
          <stop offset="1" stopColor={footOf(base, 0.12)} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={p.amberBand[0]} y1={p.amberBand[1]} />
        {/* the hot top edge: only the upper half of each amber part's outline */}
        <clipPath id={`${uid}top`}>
          <rect x={f3(p.x - 4 * M)} y={f3(p.y - 2 * M)} width={f3(8 * M)} height={f3(1.6 * M)} />
        </clipPath>
      </defs>
      {p.shadow !== false ? <UnionShadow sil={f1CarSil(p)} s={3.2} elevation="rest" lift={0} /> : null}
      {/* the rear wing, its pylon and the beam wing sit behind the body's tail */}
      <path d={mapPath(F1B_SWAN, T)} fill={carbon} />
      <path d={mapPath(F1B_BEAM, T)} fill={carbon} />
      <g transform={off(0.08 * fits.rw.lift, 0, 1)} style={fits.rw.warm > 0.01 ? { filter: bloomFilter(p.k) } : undefined}>
        {part(mapPath(lerpD(F1P.rwEnd[0], F1P.rwEnd[1], fits.rw.shape), T), base, fits.rw.warm, "rwE")}
        <path d={mapPath(lerpD(F1P.rwMain[0], F1P.rwMain[1], fits.rw.shape), T)} fill={fits.rw.warm > 0.5 ? AMBER_INK : carbon} />
        <path d={mapPath(lerpD(F1P.rwFlap[0], F1P.rwFlap[1], fits.rw.shape), T)} fill={fits.rw.warm > 0.5 ? AMBER_INK : carbon} />
      </g>
      {/* the body, the floor and diffuser */}
      <path d={mapPath(F1B_BODY, T)} fill={`url(#${uid}b)`} />
      <path d={mapPath(F1B_FLOOR, T)} fill={carbon} />
      <path d={mapPath(F1B_ACCENT_COVER, T)} fill={dimC(F1_ACCENT[tone])} />
      <path d={mapPath(F1B_ACCENT_NOSE, T)} fill={dimC(F1_ACCENT[tone])} />
      {/* the sidepod */}
      <g transform={off(0.06 * fits.sp.lift, 0, -0.4)} style={fits.sp.warm > 0.01 ? { filter: bloomFilter(p.k) } : undefined}>
        {part(mapPath(lerpD(F1P.sidepod[0], F1P.sidepod[1], fits.sp.shape), T), footOf(base, 0.1), fits.sp.warm, "sp")}
        <path d={mapPath(lerpD(F1P.sidepodInlet[0], F1P.sidepodInlet[1], fits.sp.shape), T)} fill={DARK_OPEN} />
      </g>
      {/* the cockpit, the airbox mouth, the driver, the halo, a mirror */}
      <path d={mapPath(F1B_COCKPIT, T)} fill={DARK_OPEN} />
      <path d={mapPath(F1B_AIRBOX, T)} fill={DARK_OPEN} />
      {p.driver ? (
        <g>
          <circle cx={f3(helmet[0])} cy={f3(helmet[1])} r={f3(0.15 * M)} fill={p.driver} />
          <path d={`M${f3(helmet[0] - 0.01 * M)} ${f3(helmet[1] - 0.06 * M)}L${f3(helmet[0] + 0.15 * M)} ${f3(helmet[1] - 0.06 * M)}L${f3(helmet[0] + 0.14 * M)} ${f3(helmet[1] + 0.02 * M)}L${f3(helmet[0] + 0.01 * M)} ${f3(helmet[1] + 0.02 * M)}Z`} fill={DARK_OPEN} />
        </g>
      ) : null}
      <path d={mapPath(F1B_HALO, T)} fill="none" stroke={carbon} strokeWidth={f3(0.045 * M)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${f3(T(0.66, 0.66)[0])} ${f3(T(0.66, 0.66)[1])}L${f3(T(0.72, 0.72)[0])} ${f3(T(0.72, 0.72)[1])}`} stroke={carbon} strokeWidth={f3(0.02 * M)} />
      <ellipse cx={f3(T(0.74, 0.74)[0])} cy={f3(T(0.74, 0.74)[1])} rx={f3(0.07 * M)} ry={f3(0.035 * M)} fill={carbon} />
      {/* the front wing (under the nose): the new second flap slides out from behind the endplate */}
      <g transform={off(0.06 * fits.fw.lift, 0.5, 0.6)} style={fits.fw.warm > 0.01 ? { filter: bloomFilter(p.k) } : undefined}>
        {part(mapPath(lerpD(F1P.fwFlap2[0], F1P.fwFlap2[1], fits.fw.shape), T), carbon, fits.fw.warm, "f2")}
        {part(mapPath(lerpD(F1P.fwFlap[0], F1P.fwFlap[1], fits.fw.shape), T), carbon, fits.fw.warm, "f1")}
        {part(mapPath(lerpD(F1P.fwMain[0], F1P.fwMain[1], fits.fw.shape), T), carbon, fits.fw.warm, "fm")}
        {part(mapPath(lerpD(F1P.fwEnd[0], F1P.fwEnd[1], fits.fw.shape), T), base, fits.fw.warm, "fe")}
      </g>
      {/* the tyres, outermost */}
      {wheel(F1.rearAxle, 0)}
      {wheel(F1.frontAxle, 1)}
    </g>
  );
};

// ===========================================================================
// THE ENGINEERS
// ===========================================================================
/** the standing rig (rig px, y down, origin = the ground between the feet), drawn FACING LEFT (cabinCast's face) */
export const ENGINEER = {
  R: 76,
  hip: [0, -132] as P2,
  /** hip-local (before the lean) */
  shoulder: [-12, -140] as P2,
  farShoulder: [10, -145] as P2,
  neck: [-4, -158] as P2,
  head: [-10, -232] as P2,
  upper: 78,
  fore: 74,
  armW: 32,
  hand: 14,
  /** the whole figure's height (ground to the head top), rig px */
  height: 132 + 232 + 76,
} as const;
/** the torso (hip-local): a bean, front (left) a touch fuller */
const TORSO = "M-50 6C-62 -56 -66 -128 -52 -166C-40 -194 28 -196 44 -170C58 -132 58 -60 48 6Z";
export type EngineerSpec = {
  skin: string;
  hair: string;
  hairStyle: "crop" | "bun" | "cap" | "curly";
  /** team shirt, its trim (a shoulder yoke), trousers */
  shirt: string;
  trim: string;
  pants: string;
  /** overalls: trousers in the shirt tone */
  overalls?: boolean;
  headset: string;
  glasses?: boolean;
};
/** the team: one shirt (sage with a cream yoke), different people */
export const ENGINEERS: Record<"lead" | "mech" | "designer", EngineerSpec> = {
  lead: { skin: SKIN.tan, hair: HAIR.ink, hairStyle: "crop", shirt: CLOTH.sage, trim: CLOTH.cream, pants: CLOTH.slate, headset: "#5A4537" },
  mech: { skin: SKIN.light, hair: HAIR.auburn, hairStyle: "bun", shirt: CLOTH.sage, trim: CLOTH.cream, pants: CLOTH.sage, overalls: true, headset: "#5A4537" },
  designer: { skin: SKIN.deep, hair: HAIR.chestnut, hairStyle: "curly", shirt: CLOTH.sage, trim: CLOTH.cream, pants: CLOTH.denim, headset: "#5A4537", glasses: true },
};
export type EngineerPose = {
  /** upper body about the hip (deg, + = leaning back, away from the facing) */
  lean: number;
  /** the head about the neck (deg, + = chin up) */
  tilt: number;
  /** the near hand / far hand target, HIP-local rig px (x toward the facing is negative) */
  hand: P2;
  farHand: P2;
  smile: number;
  /** 0 a dot eye .. 1 a happy closed arc */
  happy: number;
  blink: number;
  /** the whole body bob (rig px, + = up): breathing, a little hop */
  bob?: number;
};
export const restPose = (o: Partial<EngineerPose> = {}): EngineerPose => ({ lean: 0, tilt: 0, hand: [-22, 4], farHand: [14, 2], smile: 0.3, happy: 0, blink: 0, ...o });

const rot = (p: P2, deg: number, o: P2 = [0, 0]): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
/** where the head centre lands (WORLD px) for an engineer: for bubbles and eye lines */
export const engineerHead = (x: number, y: number, size: number, face: 1 | -1, pose: EngineerPose): P2 => {
  const H = ENGINEER.hip;
  const hl = rot([ENGINEER.head[0], ENGINEER.head[1]], pose.lean);
  const lx = H[0] + hl[0];
  const ly = H[1] + hl[1] - (pose.bob ?? 0);
  return [x + (face === 1 ? -lx : lx) * size, y + ly * size];
};

export const Engineer: React.FC<{
  x: number;
  y: number;
  /** world px per rig px */
  size: number;
  /** +1 faces right, -1 faces left */
  face: 1 | -1;
  spec: EngineerSpec;
  pose: EngineerPose;
  /** 0..1 toward board (context), by tone */
  dim?: number;
  shadow?: boolean;
}> = ({ x, y, size, face, spec, pose, dim = 0, shadow = true }) => {
  const uid = uidOf(useId());
  const R = ENGINEER.R;
  const col = (c: string) => mixHex(c, COLOR.board, clamp01(dim) * 0.55);
  const skin = col(spec.skin);
  const shirt = col(spec.shirt);
  const pants = col(spec.overalls ? spec.shirt : spec.pants);
  const hair = col(spec.hair);
  const trim = col(spec.trim);
  const set = col(spec.headset);
  const bob = pose.bob ?? 0;
  const lean = pose.lean;
  const H = ENGINEER.hip;
  // hip-local -> rig (through the lean about the hip)
  const L = (p: P2): P2 => {
    const q = rot(p, lean);
    return [H[0] + q[0], H[1] + q[1] - bob];
  };
  const S = L(ENGINEER.shoulder);
  const FS = L(ENGINEER.farShoulder);
  const hand: P2 = [H[0] + pose.hand[0], H[1] + pose.hand[1] - bob];
  const farHand: P2 = [H[0] + pose.farHand[0], H[1] + pose.farHand[1] - bob];
  const arm = solveArm(S, hand, ENGINEER.upper, ENGINEER.fore, -1);
  const farArm = solveArm(FS, farHand, ENGINEER.upper, ENGINEER.fore, -1);
  const headC = L(ENGINEER.head);
  const neck = L(ENGINEER.neck);
  const headTf = `translate(${f3(headC[0])} ${f3(headC[1])}) rotate(${f3(lean - pose.tilt)})`;
  const smile = clamp01(pose.smile);
  const happy = clamp01(pose.happy);
  const blinkK = 1 - 0.88 * clamp01(pose.blink);
  const eye: P2 = [-0.5 * R, -0.08 * R];
  const mouth = `M${f3(-0.88 * R)} ${f3(0.44 * R - 1)}Q${f3(-0.75 * R)} ${f3(0.44 * R + 1 + 9 * smile)} ${f3(-0.58 * R)} ${f3(0.44 * R - 2 - 4 * smile)}`;
  const hairD = (() => {
    const crown = `M${f3(-0.98 * R)} ${f3(-0.36 * R)}C${f3(-0.9 * R)} ${f3(-1.1 * R)} ${f3(0.6 * R)} ${f3(-1.3 * R)} ${f3(1.02 * R)} ${f3(-0.2 * R)}C${f3(1.08 * R)} ${f3(0.25 * R)} ${f3(0.9 * R)} ${f3(0.55 * R)} ${f3(0.62 * R)} ${f3(0.66 * R)}C${f3(0.4 * R)} ${f3(0.3 * R)} ${f3(0.3 * R)} ${f3(-0.1 * R)} ${f3(0.1 * R)} ${f3(-0.4 * R)}C${f3(-0.3 * R)} ${f3(-0.56 * R)} ${f3(-0.7 * R)} ${f3(-0.5 * R)} ${f3(-0.98 * R)} ${f3(-0.36 * R)}Z`;
    if (spec.hairStyle === "bun") return [crown, circleD(0.7 * R, -0.82 * R, 0.34 * R)];
    if (spec.hairStyle === "curly") return [crown, ...[232, 258, 284, 310, 336, 2, 28].map((a) => circleD(Math.cos(a * D2R) * R * 0.98, Math.sin(a * D2R) * R * 0.98, 0.27 * R))];
    return [crown];
  })();
  // the headset: band over the crown, the ear cup (head-local), the boom mic to the mouth
  const cup: P2 = [0.12 * R, 0.08 * R];
  const band = `M${f3(cup[0])} ${f3(cup[1] - 0.3 * R)}Q${f3(0.24 * R)} ${f3(-0.78 * R)} ${f3(0.16 * R)} ${f3(-1.04 * R)}`;
  const boom = `M${f3(cup[0] - 0.1 * R)} ${f3(cup[1] + 0.2 * R)}C${f3(-0.2 * R)} ${f3(0.72 * R)} ${f3(-0.58 * R)} ${f3(0.72 * R)} ${f3(-0.82 * R)} ${f3(0.58 * R)}`;
  const legTop = H[1] - bob + 4;
  const grad = (id: string, c: string, y0: number, y1: number) => (
    <linearGradient id={`${uid}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
      <stop offset="0" stopColor={topOf(c, 0.12)} />
      <stop offset="1" stopColor={footOf(c, 0.14)} />
    </linearGradient>
  );
  const far = (c: string) => footOf(c, 0.2);
  return (
    <g transform={`translate(${f3(x)} ${f3(y)}) scale(${f3(face === 1 ? -size : size)} ${f3(size)})`}>
      <defs>
        {grad("sk", skin, -60, 60)}
        {grad("hr", hair, -80, 60)}
        {grad("sh", shirt, H[1] - 200, H[1] + 10)}
        {grad("pt", pants, H[1], 0)}
      </defs>
      {shadow ? <ellipse cx={8} cy={0} rx={82} ry={9} fill={COLOR.shadow} opacity={0.32} style={{ filter: "blur(5px)" }} /> : null}
      {/* far leg + shoe, far arm (behind) */}
      <rect x={-6} y={f3(legTop)} width={40} height={f3(-legTop - 14)} rx={14} fill={far(pants)} />
      <path d="M-34 0C-36 -16 -22 -22 -6 -22L30 -22C38 -22 40 -12 40 -4L40 0Z" fill={far("#4A3326")} />
      <path d={`M${f3(FS[0])} ${f3(FS[1])}L${f3(farArm.E[0])} ${f3(farArm.E[1])}L${f3(farArm.W[0])} ${f3(farArm.W[1])}`} stroke={far(shirt)} strokeWidth={ENGINEER.armW - 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={f3(farArm.W[0])} cy={f3(farArm.W[1])} r={ENGINEER.hand} fill={far(skin)} />
      {/* near leg + shoe */}
      <rect x={-40} y={f3(legTop)} width={42} height={f3(-legTop - 12)} rx={14} fill={`url(#${uid}pt)`} />
      <path d="M-74 0C-76 -18 -60 -26 -40 -26L-4 -26C4 -26 6 -14 6 -4L6 0Z" fill="#4A3326" />
      {/* torso (the team shirt, its cream yoke), turned by the lean about the hip */}
      <g transform={`translate(${f3(H[0])} ${f3(H[1] - bob)}) rotate(${f3(lean)}) scale(1 0.86)`}>
        <path d={TORSO} fill={`url(#${uid}sh)`} />
        <path d="M-56 -150C-46 -186 30 -192 47 -158C26 -150 -30 -144 -56 -150Z" fill={trim} />
        <path d="M-40 -176C-28 -168 -12 -168 0 -178" stroke={footOf(trim, 0.3)} strokeWidth={5} fill="none" strokeLinecap="round" />
        {spec.overalls ? <path d="M-58 -40L52 -40L50 -26L-58 -26Z" fill={footOf(shirt, 0.22)} /> : null}
      </g>
      {/* the head */}
      <g transform={headTf}>
        {spec.hairStyle === "bun" ? <path d={hairD[1]} fill={`url(#${uid}hr)`} /> : null}
        <path d={circleD(0, 0, R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R)} fill={`url(#${uid}sk)`} />
        <circle cx={-0.42 * R} cy={0.3 * R} r={0.14 * R} fill="#D9846E" opacity={0.32} />
        <g opacity={f3(1 - happy)}>
          <ellipse cx={eye[0]} cy={eye[1]} rx={0.095 * R} ry={f3(0.095 * R * blinkK)} fill={COLOR.inkDark} />
        </g>
        {happy > 0.001 ? (
          <path
            d={`M${f3(eye[0] - 0.13 * R)} ${f3(eye[1] + 0.03 * R)}Q${f3(eye[0])} ${f3(eye[1] - 0.14 * R)} ${f3(eye[0] + 0.13 * R)} ${f3(eye[1] + 0.03 * R)}`}
            stroke={COLOR.inkDark}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
            opacity={f3(happy)}
          />
        ) : null}
        <path d={mouth} stroke={mixHex(COLOR.inkDark, skin, 0.25)} strokeWidth={3.6} strokeLinecap="round" fill="none" />
        {hairD.map((d, i) => (spec.hairStyle === "bun" && i === 1 ? null : <path key={i} d={d} fill={`url(#${uid}hr)`} />))}
        {spec.glasses ? (
          <g stroke={COLOR.inkDark} strokeWidth={3.4} fill="none" strokeLinecap="round">
            <circle cx={eye[0] - 0.03 * R} cy={eye[1] + 0.02 * R} r={0.24 * R} />
            <path d={`M${f3(eye[0] + 0.21 * R)} ${f3(eye[1] - 0.02 * R)}L${f3(0.02 * R)} ${f3(-0.02 * R)}`} />
          </g>
        ) : null}
        {/* the radio headset */}
        <path d={band} stroke={set} strokeWidth={9} fill="none" strokeLinecap="round" />
        <path d={boom} stroke={set} strokeWidth={5} fill="none" strokeLinecap="round" />
        <circle cx={f3(-0.84 * R)} cy={f3(0.57 * R)} r={f3(0.09 * R)} fill={set} />
        <rect x={f3(cup[0] - 0.27 * R)} y={f3(cup[1] - 0.36 * R)} width={f3(0.56 * R)} height={f3(0.72 * R)} rx={f3(0.22 * R)} fill={set} />
        <rect x={f3(cup[0] - 0.1 * R)} y={f3(cup[1] - 0.18 * R)} width={f3(0.22 * R)} height={f3(0.36 * R)} rx={f3(0.09 * R)} fill={mixHex(set, CLOTH.cansLight, 0.35)} />
      </g>
      {/* the near arm: sleeve (short: the forearm bare), hand */}
      <path d={`M${f3(S[0])} ${f3(S[1])}L${f3(arm.E[0])} ${f3(arm.E[1])}`} stroke={shirt} strokeWidth={ENGINEER.armW} strokeLinecap="round" fill="none" />
      <path d={`M${f3(arm.E[0])} ${f3(arm.E[1])}L${f3(arm.W[0])} ${f3(arm.W[1])}`} stroke={skin} strokeWidth={24} strokeLinecap="round" fill="none" />
      <circle cx={f3(arm.E[0])} cy={f3(arm.E[1])} r={ENGINEER.armW / 2} fill={shirt} />
      <circle cx={f3(arm.W[0])} cy={f3(arm.W[1])} r={ENGINEER.hand} fill={mixHex(skin, COLOR.shadow, 0.06)} />
      <g data-neck={`${f3(neck[0])},${f3(neck[1])}`} />
    </g>
  );
};

// ===========================================================================
// THE IDEA BUBBLE
// ===========================================================================
export type IdeaKind = "wing" | "fan" | "wheels" | "frontWing" | "sidepod" | "rearWing";
/** the tiny ink sketch inside a bubble (unit radius, centred) */
/** the bold icons (IdeaBubble bold): fewer, fatter shapes that survive at phone size */
const boldSketchOf = (kind: IdeaKind, spin = 0): { d: string; fill?: boolean }[] => {
  // rev 1: the three real parts the engineers upgrade
  if (kind === "frontWing")
    return [
      // the nose coming down to a three-element wing and its endplate
      { d: "M-0.72 -0.5 C-0.3 -0.42 0.1 -0.3 0.3 -0.16" },
      { d: "M-0.62 0.36 L0.3 0.36 M-0.5 0.14 L0.3 0.14 M-0.36 -0.06 L0.3 -0.06" },
      { d: "M0.3 -0.3 L0.62 -0.3 C0.66 -0.3 0.68 -0.27 0.68 -0.23 L0.68 0.44 C0.68 0.48 0.66 0.5 0.62 0.5 L0.36 0.5 C0.32 0.5 0.3 0.48 0.3 0.44 Z", fill: true },
    ];
  if (kind === "sidepod")
    return [
      // a car's side with its sidepod filled
      { d: "M-0.74 0.22 L0.74 0.22 M-0.6 0.22 C-0.6 -0.1 -0.3 -0.3 0.0 -0.32 C0.3 -0.32 0.6 -0.1 0.74 0.0" },
      { d: "M-0.42 0.1 C-0.3 -0.12 -0.05 -0.2 0.22 -0.18 C0.2 -0.06 0.24 0.04 0.32 0.1 Z", fill: true },
    ];
  if (kind === "rearWing")
    return [
      // a tall endplate with two element slots, on its pylon
      { d: "M-0.5 -0.56 L0.36 -0.56 C0.5 -0.56 0.56 -0.46 0.56 -0.34 C0.56 -0.1 0.4 0.1 0.2 0.16 L-0.5 0.16 Z", fill: true },
      { d: "M0.0 0.16 L0.0 0.62 M-0.4 0.62 L0.4 0.62" },
    ];
  if (kind === "wing")
    return [
      // a car body, two thick stilts, a fat plank high up
      { d: "M-0.66 0.5 L0.7 0.5 C0.74 0.34 0.56 0.26 0.22 0.24 L-0.56 0.2 C-0.68 0.24 -0.7 0.38 -0.66 0.5 Z", fill: true },
      { d: "M-0.42 0.22 L-0.42 -0.3 M-0.06 0.22 L-0.06 -0.3" },
      { d: "M-0.72 -0.34 C-0.36 -0.62 0.14 -0.6 0.34 -0.42 C0 -0.28 -0.4 -0.26 -0.72 -0.34 Z", fill: true },
    ];
  if (kind === "fan") {
    // a fat five-blade fan (petals round a hub): reads as a fan, not a steering wheel
    const blades = [0, 72, 144, 216, 288].map((a) => {
      const t = (a + spin) * D2R;
      const tip: P2 = [Math.cos(t) * 0.66, Math.sin(t) * 0.66];
      const l: P2 = [Math.cos(t - 0.62) * 0.46, Math.sin(t - 0.62) * 0.46];
      const r: P2 = [Math.cos(t + 0.3) * 0.5, Math.sin(t + 0.3) * 0.5];
      return { d: `M0 0 Q${f3(l[0])} ${f3(l[1])} ${f3(tip[0])} ${f3(tip[1])} Q${f3(r[0])} ${f3(r[1])} 0 0 Z`, fill: true };
    });
    return [...blades, { d: circleD(0, 0, 0.17), fill: true }];
  }
  // two equal wheels on one axle: rings with a dot hub, joined by a short bar
  return [
    { d: "M-0.34 0 L0.34 0" },
    { d: circleD(-0.36, 0, 0.27) },
    { d: circleD(0.36, 0, 0.27) },
    { d: circleD(-0.36, 0, 0.08), fill: true },
    { d: circleD(0.36, 0, 0.08), fill: true },
    ...[-0.36, 0.36].map((cx) => ({ d: [90, 210, 330].map((a) => `M${f3(cx)} 0L${f3(cx + Math.cos((a + spin) * D2R) * 0.22)} ${f3(Math.sin((a + spin) * D2R) * 0.22)}`).join("") })),
  ];
};
const sketchOf = (kind: IdeaKind, spin = 0): { d: string; fill?: boolean }[] => {
  if (kind === "frontWing" || kind === "sidepod" || kind === "rearWing") return boldSketchOf(kind, spin);
  if (kind === "wing")
    return [
      // a small car with a plank high on two stilts
      { d: "M-0.6 0.42 L0.62 0.42 C0.66 0.32 0.5 0.26 0.2 0.24 L-0.52 0.2 C-0.62 0.22 -0.64 0.34 -0.6 0.42 Z", fill: true },
      { d: "M-0.4 0.22 L-0.4 -0.32 M-0.08 0.22 L-0.08 -0.32" },
      { d: "M-0.62 -0.38 C-0.3 -0.48 0.08 -0.46 0.2 -0.36 C-0.1 -0.3 -0.4 -0.3 -0.62 -0.38 Z", fill: true },
    ];
  if (kind === "fan") {
    const blades = [0, 90, 180, 270].map((a) => {
      const t = (a + spin) * D2R;
      const tx = Math.cos(t) * 0.5;
      const ty = Math.sin(t) * 0.5;
      const sx = Math.cos(t + 1.2) * 0.22;
      const sy = Math.sin(t + 1.2) * 0.22;
      return { d: `M0 0 Q${f3(sx + tx * 0.5)} ${f3(sy + ty * 0.5)} ${f3(tx)} ${f3(ty)} Q${f3(tx * 0.4)} ${f3(ty * 0.4)} 0 0 Z`, fill: true };
    });
    return [{ d: circleD(0, 0, 0.62) }, ...blades];
  }
  return [
    // one big wheel and two small ones under a nose
    { d: "M-0.7 -0.06 L0.7 -0.12 C0.74 -0.22 0.6 -0.28 0.3 -0.28 L-0.62 -0.24 C-0.72 -0.22 -0.74 -0.12 -0.7 -0.06 Z", fill: true },
    { d: circleD(-0.42, 0.22, 0.26), fill: true },
    { d: circleD(0.16, 0.28, 0.17), fill: true },
    { d: circleD(0.52, 0.28, 0.17), fill: true },
  ];
};

export const IdeaBubble: React.FC<{
  /** centre (world px), radius (world px) */
  x: number;
  y: number;
  r: number;
  kind: IdeaKind;
  k: number;
  amberBand: [number, number];
  /** the thinker's head (world px): two tail dots run from the bubble toward it; `tail` 0..1 how much of the tail */
  from?: P2 | null;
  tail?: number;
  /** squash (0..1): the bubble being absorbed into a part (it narrows to its centre) */
  absorb?: number;
  /** the sketch's fan blades turn (deg) */
  spin?: number;
  /** a gentle wobble (deg) */
  wobble?: number;
  /** bold icons and a thinner paper ring, for bubbles that must read at phone size (default false: the original look) */
  bold?: boolean;
}> = ({ x, y, r, kind, k, amberBand, from = null, tail = 1, absorb = 0, spin = 0, wobble = 0, bold = false }) => {
  const uid = uidOf(useId());
  const ab = clamp01(absorb);
  if (ab >= 0.999) return null;
  const s = 1 - smoothstep(ab);
  const hot = EDGE.HOT / k;
  const ink = COLOR.inkDark;
  const paper = mixHex(COLOR.amberHot, COLOR.cream, 0.55);
  const dots: React.ReactNode[] = [];
  if (from && tail > 0.01) {
    const dx = from[0] - x;
    const dy = from[1] - y;
    const d = Math.hypot(dx, dy);
    const ux = dx / Math.max(1, d);
    const uy = dy / Math.max(1, d);
    const t = clamp01(tail);
    [
      { at: r * 1.32, rr: r * 0.2 },
      { at: r * 1.78, rr: r * 0.12 },
    ].forEach((q, i) => {
      if (q.at + q.rr > d - r * 0.3) return;
      const vis = clamp01(t * 2 - i * 0.6);
      if (vis <= 0.01) return;
      dots.push(<circle key={i} cx={f3(x + ux * q.at)} cy={f3(y + uy * q.at)} r={f3(q.rr * vis)} fill={`url(#${uid}a)`} />);
    });
  }
  return (
    <g style={{ filter: bloomFilter(k) }}>
      <defs>
        <AmberGradient id={`${uid}a`} y0={amberBand[0]} y1={amberBand[1]} />
      </defs>
      {dots}
      <g transform={`translate(${f3(x)} ${f3(y)}) rotate(${f3(wobble)}) scale(${f3(s * (1 + 0.12 * ab))} ${f3(s)})`}>
        <circle r={f3(r)} fill={`url(#${uid}a)`} />
        <circle r={f3(r * (bold ? 0.84 : 0.8))} fill={paper} />
        <path d={`M${f3(-r * 0.62)} ${f3(-r * 0.78)}A${f3(r - hot)} ${f3(r - hot)} 0 0 1 ${f3(r * 0.62)} ${f3(-r * 0.78)}`} fill="none" stroke={COLOR.amberHot} strokeWidth={f3(hot)} strokeLinecap="round" />
        <g transform={`scale(${f3(r * (bold ? 0.8 : 0.72))})`}>
          {(bold ? boldSketchOf : sketchOf)(kind, spin).map((q, i) => (
            <path key={i} d={q.d} fill={q.fill ? ink : "none"} stroke={ink} strokeWidth={f3(bold ? 0.15 : 0.075)} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>
      </g>
    </g>
  );
};
