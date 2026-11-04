// ---------------------------------------------------------------------------
// StarlinkLinksDrones (kofman-starlink, cut 19). ChinaTalk style (newsprint) (styles/chinatalk.md; kit API in
// generated/components/kits/chinatalk/chinatalkVintage.md).
// Opaque 1080x1920, 24 fps, 227 frames.
//
// CHECK LINE: "Starlink is the link that ties a Ukrainian unit to its drones and ground robots — without it they
// sit dead."
//
// THE LINE: "And if it wasn't for that [Starlink], it's difficult to see how Ukrainian units would have cheap
// expendable comms that then allow you to connect drones, UGVs."
// WORD -> FRAME: And -1 · if 1 · it 7 · wasn't 12 · for 19 · that 23 (ends 32) · it's 36 · difficult 43 · to 48 ·
// see 54 · how 60 · Ukrainian 68 · units 77 · would 84 · have 89 · cheap 93 · expendable 104 · comms 117 · that 127 ·
// then 130 · allow 133 · you 144 · to 154 · connect 166 · drones 183 · UGVs 207 (ends 224) · cut back 227.
// DURATION: the slot 19.000 -> 28.4583 s = 9.458 s x 24 = 227 frames (f0..f226).
//
// THE MOTION: a newspaper figure. A halftone clipping of a Ukrainian soldier setting up a Starlink dish (picture
// window 880 world px, the whole clipping in frame on every frame with >= 40 px of paper each side) fills ~91 % of the
// frame width at k 1.08 (the camera already drifting on f0), the row of two drones and one tracked ground robot waiting
// below in ink tint. On "that" a red Starlink dot grows on the middle of the dish's white face (f23-31) and twinkles
// (UplinkPulse twinkle, no rings: from f29 every 34 f it swells and soaks to RED_HI, cut B's flash, always inside the
// face); the head label STARLINK lands beside where the trunk will run (f26). One gentle settle (keyed f30 -> f84,
// settled ~f90, k 1.0) brings the row up.
// On "cheap expendable comms" one red wet line is written from the dot straight down through the caption zone to a
// junction (f94 -> f121) and leaves a seal there (f120-129). With no pause the side branches are written out of the
// seal (from f126/f127, a steady, gently slowing pace, the bead always on the tip of a visible line) and the short
// drop follows (from f144): the drop touches the right drone at f172, the left branch the left drone at f184 and the
// right branch the robot's mast at f207, while a RED_HI highlight runs down the trunk every 30 f from f134. Each device floods red from its point of contact (contact = the bead's front edge meets
// the silhouette; the flood's first seep shows on that frame). Labels DRONES (f184) and UGVs (f208). f212-226:
// settled and living (uplink pulse, a RED_HI highlight running down the lines every 30 f, a slow linear camera creep).
// Start = grey unlinked devices; end = all red and linked.
// RED = Starlink (the dish, the link, and what it links). Nothing else is red.
//
// BANDS: per-frame check f0-f226: STARLINK's caps 852-962, the cutline 780-876, DRONES / UGVs bottom <= 1824 (from
// f176); the clipping's side paper >= 46 px and top >= 50 px (sway included).
//
// SOURCES: photograph Wikimedia Commons "UA Support Forces Starlink 01.jpg", Support Forces of Ukraine Command,
// CC BY 4.0, 2022-07-21, https://commons.wikimedia.org/wiki/File:UA_Support_Forces_Starlink_01.jpg
// (public/kofman-starlink/ua_support_forces_starlink_2022.jpg, 1200x900; dish face centroid measured on the full
// image at (u 0.385, v 0.57)). Drone: Phosphor "drone" fill (MIT). UGV: drawn for this clip (starlinkShared.tsx).
// No numbers on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BEAD_RATIO,
  Bead,
  CUTLINE_BAND,
  INK_LO,
  Label,
  PHOTO_BORDER,
  Pictogram,
  RED,
  RED_HI,
  RED_WET,
  RedGroup,
  Seal,
  VStage,
  VintagePhoto,
  WET_DRY_F,
  WET_LEN,
  WetLine,
  clamp01,
  cumLen,
  enterU,
  lerp,
  mixHex,
  paperShadow,
  photoPoint,
  pointAtLen,
  redW,
  runVCamera,
  shootEase,
  smoothstep,
  subPathD,
} from "../kits/chinatalk/chinatalkVintage";
import type { Pt, VCamKey } from "../kits/chinatalk/chinatalkVintage";
import { DRONE_D, UGV_D, UplinkPulse } from "./starlinkShared";

export const FPS = 24;
export const DURATION = 227;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the clipping -------------------------------------------------------------
const PHOTO_SRC = "kofman-starlink/ua_support_forces_starlink_2022.jpg";
const NATURAL = { w: 1200, h: 900 };
/** the picture window (world px). A static 1.3 zoom about the left edge brings the dish to the
 *  clipping's middle (x 540) and keeps the cutline, which starts at the left, clear of the trunk. */
const PHOTO = { x: 100, y: 94, w: 880, h: 677 };
const PHOTO_FOCUS = { x: 0, y: 0.3 };
const PHOTO_ZOOM = 1.3;
const CUTLINE = "Starlink dish, Ukraine, 2022";
/** the Starlink dot: the middle of the dish's white face, between its left edge (source x 387) and its dark stripe
 *  (x 442) at source y 485, clear of the soldier's knee (x >= 455 there) and hands (y >= 690); measured on the full
 *  1200x900 image */
const DISH_UV = { u: 414.5 / 1200, v: 485 / 900 };
export const DISH = photoPoint(PHOTO, NATURAL, DISH_UV.u, DISH_UV.v, PHOTO_FOCUS, PHOTO_ZOOM);
const CLIP_Y1 = PHOTO.y + PHOTO.h + PHOTO_BORDER + CUTLINE_BAND;

// --- labels -------------------------------------------------------------------
/** STARLINK sits under the clipping, just right of the trunk */
const HEAD = { x: DISH.x + 30, y: CLIP_Y1 + 52 };
const HEAD_F = 26;

// --- the row of devices (waiting below the caption bands) -------------------------
const ROW_Y = 1645;
const DRONE_PX = 206;
const UGV_PX = 228;
type DevDef = { id: string; d: string; x: number; size: number; box: Pt; contact: number; ph: [number, number, number] };
/** box: the contact point in the 256 box (a drone's upper rotor guard apex, the robot's mast head) */
const DRONE_R = { x: 76, y: 32 };
const DRONE_L = { x: 180, y: 32 };
/** the right drone sits so its upper-left guard is right under the trunk */
const D2_X = DISH.x - (DRONE_R.x - 128) * (DRONE_PX / 256);
const DEV_DEFS: DevDef[] = [
  { id: "d2", d: DRONE_D, x: D2_X, size: DRONE_PX, box: DRONE_R, contact: 172, ph: [0.4, 2.1, 4.4] },
  { id: "d1", d: DRONE_D, x: D2_X - 280, size: DRONE_PX, box: DRONE_L, contact: 184, ph: [1.7, 0.3, 2.9] },
  { id: "ugv", d: UGV_D, x: D2_X + 268, size: UGV_PX, box: { x: 72, y: 42 }, contact: 207, ph: [3.1, 5.2, 0.8] },
];
const LABEL_Y = 1798;

// --- the link -------------------------------------------------------------------
/** the junction just above the row */
const J: Pt = { x: DISH.x, y: 1484 };
const TRUNK_T0 = 93;
const TRUNK_T1 = 126;
/** the junction seal grows as the bead arrives */
const JSEAL_F = 120;
const SEAL_GROW_F = 9;
/** the dish's Starlink dot grows on "that" */
const DISH_DOT_F = 23;
/** its radius, SCREEN px at k 1; it grows over SEAL_GROW_F, then twinkles (swells to ~2.1x and soaks to RED_HI, no
 *  ring) every DISH_PERIOD frames from DISH_TWINKLE_F; at its largest it stays inside the dish's white face */
const DISH_DOT_PX = 11;
const DISH_TWINKLE_F = 29;
const DISH_PERIOD = 34;
/** branches start writing right after the junction seal (one continuous motion): the two long ones at once, the
 *  short drop to the right drone a little later so all three still touch on their words */
const BRANCH_T0: Record<string, number> = { d1: 126, ugv: 127, d2: 144 };
/** a branch's soft start (frames to reach its steady writing speed) */
const BRANCH_RAMP = 4;
/** the branch pace: g(u) = a (1 - (1 - u)^2) + (1 - a) u */
const BRANCH_EASE = 0.3;
const branchG = (u: number) => BRANCH_EASE * (1 - (1 - u) * (1 - u)) + (1 - BRANCH_EASE) * u;
/** a branch's bead comes out from under the junction seal over this run (world px), so it is only fully there once
 *  a stretch of written line shows behind it: it never reads as a loose dot */
const EMERGE = 48;
/** how far the tip runs on into the silhouette past the contact point, world px */
const SEAT_IN = 9;

// --- the camera -------------------------------------------------------------------
// The whole clipping (margin and cutline) stays inside the frame with >= 40 px of paper each side on every frame:
// at k 1.08 it is 981 px wide (91 %), 50 px of paper each side (minus the 5 px sway). One gentle settle f30 -> f84 to
// k 1.0, then a slow creep; already drifting (down the page, ~0.5 px/f) on f0. Per-frame band check in the report.
const CAM_KEYS: VCamKey[] = [
  { f: -24, x: 540, y: 872, k: 1.08 },
  { f: 30, x: 540, y: 900, k: 1.074, ease: "linear" },
  { f: 84, x: 540, y: 960, k: 1.0 },
  { f: DURATION - 1, x: 540, y: 966, k: 1.022, ease: "linear" },
];
export const camAt = runVCamera(CAM_KEYS, DURATION);

// --- helpers --------------------------------------------------------------------
const invOf = (ease: (u: number) => number) => (e: number) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < e) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
const shootInv = invOf(shootEase);
const cubic = (a: Pt, b: Pt, c: Pt, d: Pt, n = 48): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push({
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    });
  }
  return pts;
};

/** One line written by a bead. The trunk (contact null) shoots: shootEase from t0 to t1. A branch writes in one
 *  continuous stroke: a soft start over BRANCH_RAMP frames, then a gently slowing pace (BRANCH_EASE: 1.3x its mean
 *  speed leaving the junction, 0.7x at the touch) so its bead's front edge touches the silhouette on `contact`
 *  (len = sTouch, still moving), then it decelerates evenly into its seat (len = L). v = its speed at the touch. */
type Stroke = { id: string; pts: Pt[]; cum: number[]; L: number; sTouch: number; t0: number; T: number; v: number; contact: number; D: number };
const makeStroke = (id: string, pts: Pt[], t0: number, contact: number | null, t1: number | null, beadR: number): Stroke => {
  const cum = cumLen(pts);
  const L = cum[cum.length - 1];
  if (contact === null) return { id, pts, cum, L, sTouch: L, t0, T: (t1 as number) - t0, v: 0, contact: -1, D: 0 };
  const sTouch = L - SEAT_IN - beadR;
  const T = contact - t0 - BRANCH_RAMP / 2;
  const v = (sTouch * (1 - BRANCH_EASE)) / T;
  return { id, pts, cum, L, sTouch, t0, T, v, contact, D: (2 * (L - sTouch)) / v };
};
const strokeLen = (s: Stroke, S: number) => {
  if (s.contact < 0) return s.L * shootEase((S - s.t0) / s.T);
  const t = S - s.t0;
  if (t <= 0) return 0;
  if (S <= s.contact) return s.sTouch * branchG((t < BRANCH_RAMP ? (t * t) / (2 * BRANCH_RAMP) : t - BRANCH_RAMP / 2) / s.T);
  const tau = Math.min(S - s.contact, s.D);
  return s.sTouch + s.v * tau - (s.v * tau * tau) / (2 * s.D);
};
/** the frame the tip passed run length `at` */
const strokeTimeAt = (s: Stroke, at: number) => {
  if (s.contact < 0) return s.t0 + s.T * shootInv(clamp01(at / s.L));
  let lo = s.t0;
  let hi = s.contact + s.D;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (strokeLen(s, mid) < at) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

// --- devices and their branches ---------------------------------------------------
type Dev = DevDef & { y: number; sc: number; c: Pt; transform: string; rEnd: number; stroke: Stroke };
const buildDev = (def: DevDef): Dev => {
  const sc = def.size / 256;
  const c = { x: def.x + (def.box.x - 128) * sc, y: ROW_Y + (def.box.y - 128) * sc };
  // the branch: from the junction, down and across on a smooth S, arriving vertically into the contact
  const seat = { x: c.x, y: c.y + SEAT_IN };
  const dy = seat.y - J.y;
  // the side branches leave the junction on a diagonal (the kink sits under the junction seal), so they part from the
  // straight drop at once
  const sgn = Math.sign(c.x - J.x);
  const pts =
    Math.abs(c.x - J.x) < 1
      ? [J, seat]
      : cubic(J, { x: J.x + sgn * Math.min(Math.abs(seat.x - J.x) * 0.3, 64), y: J.y + dy * 0.3 }, { x: seat.x, y: seat.y - dy * 0.95 }, seat);
  const beadR = BEAD_RATIO * redW(camAt(def.contact).k);
  // the flood's final radius: the farthest corner of the 256 box from the contact
  const far = Math.max(...[0, 256].flatMap((bx) => [0, 256].map((by) => Math.hypot(bx - def.box.x, by - def.box.y)))) * sc;
  return {
    ...def,
    y: ROW_Y,
    sc,
    c,
    transform: `translate(${def.x.toFixed(3)} ${ROW_Y}) scale(${sc.toFixed(5)}) translate(-128 -128)`,
    rEnd: far + 8,
    stroke: makeStroke(def.id, pts, BRANCH_T0[def.id], def.contact, null, beadR),
  };
};
export const DEVS: Dev[] = DEV_DEFS.map(buildDev);
export const TRUNK = makeStroke("trunk", [DISH, J], TRUNK_T0, null, TRUNK_T1, 0);

// --- the flood (TechnologyAllocates' soak, from the point of contact) -------------------
const FLOOD_F = 16;
const FLOOD_LEAD = 0.5;
const FEATHER = 2.2;
const WOBBLE_N = [2, 3, 5, 9];
const WOBBLE = [0.02, 0.02, 0.012, 0.006];
const SOAK_P = 1.6;
const soak = (u: number) => 1 - Math.pow(1 - clamp01(u), SOAK_P);
const soakInv = (e: number) => 1 - Math.pow(1 - clamp01(e), 1 / SOAK_P);
const WET_STOPS = 18;
const blobD = (cx: number, cy: number, r: number, ph: [number, number, number]) => {
  const n = 160;
  const phase = [ph[0], ph[1], ph[2], ph[0] + ph[1]];
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let w = 1;
    for (let j = 0; j < WOBBLE.length; j++) w += WOBBLE[j] * Math.sin(WOBBLE_N[j] * a + phase[j]);
    parts.push(`${i ? "L" : "M"}${(cx + r * w * Math.cos(a)).toFixed(2)} ${(cy + r * w * Math.sin(a)).toFixed(2)}`);
  }
  return parts.join("") + "Z";
};
const ID = "sld";
const HALF = 0.62;

const DevDefs: React.FC<{ d: Dev }> = ({ d }) => {
  const h = d.size * HALF;
  return (
    <defs>
      <clipPath id={`${ID}-${d.id}-shape`}>
        <path d={d.d} transform={d.transform} />
      </clipPath>
      <mask id={`${ID}-${d.id}-outside`} maskUnits="userSpaceOnUse" x={d.x - h} y={d.y - h} width={2 * h} height={2 * h}>
        <rect x={d.x - h} y={d.y - h} width={2 * h} height={2 * h} fill="#FFFFFF" />
        <path d={d.d} transform={d.transform} fill="#000000" />
      </mask>
    </defs>
  );
};
const Soaked: React.FC<{ d: Dev; S: number; fill: string }> = ({ d, S, fill }) => {
  const u = (S - d.contact + FLOOD_LEAD) / FLOOD_F;
  if (u <= 0) return null;
  const h = d.size * HALF;
  return (
    <g clipPath={`url(#${ID}-${d.id}-shape)`}>
      {u < 1 ? (
        <path d={blobD(d.c.x, d.c.y, d.rEnd * soak(u), d.ph)} fill={fill} style={{ filter: `blur(${FEATHER}px)` }} />
      ) : (
        <rect x={d.x - h} y={d.y - h} width={2 * h} height={2 * h} fill={fill} />
      )}
    </g>
  );
};
const FloodShadow: React.FC<{ d: Dev; S: number; k: number }> = ({ d, S, k }) => {
  if (S - d.contact + FLOOD_LEAD <= 0) return null;
  return (
    <g mask={`url(#${ID}-${d.id}-outside)`}>
      <g style={{ filter: paperShadow(k) }}>
        <Soaked d={d} S={S} fill={RED} />
      </g>
    </g>
  );
};
const Flood: React.FC<{ d: Dev; S: number }> = ({ d, S }) => {
  const t = S - d.contact + FLOOD_LEAD;
  if (t <= 0) return null;
  const r = d.rEnd * soak(t / FLOOD_F);
  const wetOn = t < FLOOD_F + WET_DRY_F;
  const stops: React.ReactNode[] = [];
  if (wetOn) {
    for (let i = 0; i <= WET_STOPS; i++) {
      const frac = i / WET_STOPS;
      const age = Math.max(0, t - FLOOD_F * soakInv(frac));
      const behind = Math.max(0, r - frac * d.rEnd);
      const wet = (1 - smoothstep(age / WET_DRY_F)) * (1 - smoothstep(behind / WET_LEN));
      stops.push(<stop key={i} offset={frac.toFixed(4)} stopColor={mixHex(RED, RED_WET, wet)} />);
    }
  }
  return (
    <g>
      {wetOn ? (
        <defs>
          <radialGradient id={`${ID}-${d.id}-wet`} gradientUnits="userSpaceOnUse" cx={d.c.x.toFixed(2)} cy={d.c.y.toFixed(2)} r={d.rEnd.toFixed(2)}>
            {stops}
          </radialGradient>
        </defs>
      ) : null}
      <Soaked d={d} S={S} fill={wetOn ? `url(#${ID}-${d.id}-wet)` : RED} />
    </g>
  );
};

// --- the lines ----------------------------------------------------------------------
/** A written line; its bead drains into the silhouette (or under the junction seal) after the touch. */
const LinkLine: React.FC<{ s: Stroke; S: number; k: number; drainFrom: number; drainLen: number; emerge?: number }> = ({
  s,
  S,
  k,
  drainFrom,
  drainLen,
  emerge = 0,
}) => {
  if (S <= s.t0) return null;
  const len = strokeLen(s, S);
  const w = redW(k);
  const full = BEAD_RATIO * w;
  const drain = clamp01((len - drainFrom) / drainLen);
  const tip = pointAtLen(s.pts, s.cum, len);
  return (
    <g>
      <WetLine id={`${ID}-${s.id}`} points={s.pts} len={len} k={k} ageAt={(at) => S - strokeTimeAt(s, at)} shadow={false} />
      {drain < 1 ? <Bead id={`${ID}-${s.id}-bead`} x={tip.x} y={tip.y} k={k} r={lerp(full, w / 2, drain)} opacity={(1 - smoothstep(drain)) * (emerge > 0 ? smoothstep((len - 12) / emerge) : 1)} /> : null}
    </g>
  );
};

// --- the travelling highlight: leaves the dish every PULSE_P frames, runs down the trunk and on along every
// drawn branch at a constant speed
const PULSE_P = 30;
const PULSE_T0 = 134;
const PULSE_SPEED = 40;
const PULSE_LEN = 90;
const PULSE_STEPS = 12;
const Highlight: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const w = redW(k);
  const out: React.ReactNode[] = [];
  const nHi = Math.floor((S - PULSE_T0) / PULSE_P);
  for (let n = nHi; n >= Math.max(0, nHi - 2); n--) {
    const head = (S - (PULSE_T0 + n * PULSE_P)) * PULSE_SPEED;
    if (head <= 0) continue;
    // route: the trunk, then each branch (only what is drawn)
    const routes: { s: Stroke; off: number; drawn: number }[] = [{ s: TRUNK, off: 0, drawn: strokeLen(TRUNK, S) }];
    for (const d of DEVS) routes.push({ s: d.stroke, off: TRUNK.L, drawn: S > d.stroke.t0 ? strokeLen(d.stroke, S) : 0 });
    for (const r of routes) {
      const a = head - PULSE_LEN - r.off;
      const b = head - r.off;
      const s0 = Math.max(0, a);
      const s1 = Math.min(r.drawn, b);
      if (s1 - s0 < 0.5) continue;
      for (let i = 0; i < PULSE_STEPS; i++) {
        const q0 = a + (PULSE_LEN * i) / PULSE_STEPS;
        const q1 = a + (PULSE_LEN * (i + 1)) / PULSE_STEPS;
        const c0 = Math.max(s0, q0);
        const c1 = Math.min(s1, q1);
        if (c1 - c0 < 0.2) continue;
        const mid = (i + 0.5) / PULSE_STEPS;
        const op = 0.75 * Math.sin(Math.PI * mid) ** 1.5;
        out.push(
          <path
            key={`${n}-${r.s.id}-${i}`}
            d={subPathD(r.s.pts, r.s.cum, c0, c1)}
            fill="none"
            stroke={RED_HI}
            strokeOpacity={op.toFixed(4)}
            strokeWidth={(w * 0.92).toFixed(3)}
            strokeLinecap="butt"
          />,
        );
      }
    }
  }
  return <g>{out}</g>;
};

const StarlinkLinksDrones: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const dotGrow = clamp01((S - DISH_DOT_F) / SEAL_GROW_F);
  const jGrow = clamp01((S - JSEAL_F) / SEAL_GROW_F);
  const trunkBead = BEAD_RATIO * redW(k);
  return (
    <VStage
      S={S}
      cam={cam}
      photos={<VintagePhoto src={PHOTO_SRC} box={PHOTO} focus={PHOTO_FOCUS} zoom={PHOTO_ZOOM} cutline={CUTLINE} />}
    >
      {DEVS.map((d) => (
        <DevDefs key={d.id} d={d} />
      ))}
      {/* the waiting devices: solid, ink tint */}
      {DEVS.map((d) => (
        <Pictogram key={d.id} d={d.d} x={d.x} y={d.y} size={d.size} rung={INK_LO} />
      ))}
      {DEVS.map((d) => (
        <FloodShadow key={d.id} d={d} S={S} k={k} />
      ))}
      <RedGroup k={k}>
        <LinkLine s={TRUNK} S={S} k={k} drainFrom={TRUNK.L - trunkBead * 1.2} drainLen={trunkBead * 1.2} emerge={EMERGE} />
        {DEVS.map((d) => (
          <LinkLine key={d.id} s={d.stroke} S={S} k={k} drainFrom={d.stroke.sTouch} drainLen={SEAT_IN + 2} emerge={EMERGE} />
        ))}
        <Seal x={J.x} y={J.y} k={k} grow={jGrow} />
        {dotGrow > 0 ? (
          <UplinkPulse x={DISH.x} y={DISH.y} k={k} S={S} r={DISH_DOT_PX} grow={dotGrow} start={DISH_TWINKLE_F} period={DISH_PERIOD} twinkle rings={false} />
        ) : null}
      </RedGroup>
      <Highlight S={S} k={k} />
      {DEVS.map((d) => (
        <Flood key={d.id} d={d} S={S} />
      ))}
      <Label text="Starlink" x={HEAD.x} y={HEAD.y} k={k} size="head" anchor="start" appear={enterU(S, HEAD_F)} />
      <Label text="Drones" x={(DEVS[0].x + DEVS[1].x) / 2} y={LABEL_Y} k={k} size="word" appear={enterU(S, 184)} />
      <Label text="UGVs" x={DEVS[2].x} y={LABEL_Y} k={k} size="word" transformCase="none" appear={enterU(S, 208)} />
    </VStage>
  );
};

export default StarlinkLinksDrones;
