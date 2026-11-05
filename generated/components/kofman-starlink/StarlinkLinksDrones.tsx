// ---------------------------------------------------------------------------
// StarlinkLinksDrones (kofman-starlink, cut 19), TAKE 3. ChinaTalk style (newsprint) (styles/chinatalk.md; kit API in
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
// THE MOTION (take 3: push -> track -> pull, the active thing always near the middle of the stage):
// f0 the halftone clipping of a Ukrainian soldier setting up a Starlink dish fills the stage width (~800 px, k ~2.1),
// the camera already pushing slowly in towards the dish; on "that" a red Starlink dot grows on the dish's white face and
// twinkles (no rings). f30-92 one pull-back reveals the hub: the clipping, STARLINK under it (f40) and the dead devices
// in one tight row below (two drones tilted on the ground, one stopped tracked robot, ink tint). On "cheap" the trunk
// shoots straight down out of the dish to a junction just above the row (f93-107, shootEase) and the camera pushes in
// after it, down onto the dead drones (k ~1.8, ~315 px each by f160). Then it tracks device to device as each comes
// alive: a branch shoots from the junction into drone 1 (touch f172; it floods, lifts off, levels and hovers), a smooth
// pan to drone 2 (touch f184), a pan to the robot (touch f207; it floods and rolls forward, done ~f220, then idles
// with a slight track shimmy). f205-226 the camera pulls out to the whole live network, centred, RED_HI highlights
// running along every link, the dish twinkling. Labels DRONES (f186), UGVs (f208).
// Start = grey dead devices; end = all red, live and linked. RED = Starlink (the dish, the link, and what it links).
//
// STAGE: readable things (cutline, labels) never in the caption bands (y 1080-1250, 1360-1460); the devices stay above
// y 1040; the open (f0-30) and the resolved end view (f215-226) keep >= 120 px of paper to every frame edge; during
// the push-in the far parts of the stage leave the frame (labels fade at the edge, kit edgeFactor). Per-frame check in
// the scratch tools (band3.ts).
//
// SOURCES: photograph Wikimedia Commons "UA Support Forces Starlink 01.jpg", Support Forces of Ukraine Command,
// CC BY 4.0, 2022-07-21, https://commons.wikimedia.org/wiki/File:UA_Support_Forces_Starlink_01.jpg
// (public/kofman-starlink/ua_support_forces_starlink_2022.jpg, 1200x900). Drone: Phosphor "drone" fill (MIT). UGV:
// drawn for this clip (starlinkShared.tsx). No numbers on screen.
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

// --- the clipping (the hub) -------------------------------------------------------
const PHOTO_SRC = "kofman-starlink/ua_support_forces_starlink_2022.jpg";
const NATURAL = { w: 1200, h: 900 };
/** a 380x292 window (4:3-ish), a static 1.3 zoom about the left edge (take 1's crop: the whole soldier and dish,
 *  source x 0-923, y 62-754); the dish dot sits at 0.45 of the width */
const PHOTO_W = 380;
const PHOTO_H = 292;
const PHOTO_FOCUS = { x: 0, y: 0.3 };
const PHOTO_ZOOM = 1.3;
const CUTLINE = "Starlink, 2022";
/** the Starlink dot: the middle of the dish's white face (source x 414.5, y 485 of 1200x900), clear of the soldier */
const DISH_UV = { u: 414.5 / 1200, v: 485 / 900 };
/** the trunk leaves the dot down the dish's white face (its long axis runs down and right) and crosses the photo's
 *  foot at source x 575 (left of the soldier's right hand), then drops straight: clear of the cutline on its left */
const EXIT_U = 575 / 1200;
/** the trunk's x below the clipping (the junction's x) */
export const TRUNK_X = 352;
const PHOTO_Y = 314;
const exitRel = photoPoint({ x: 0, y: 0, w: PHOTO_W, h: PHOTO_H }, NATURAL, EXIT_U, 0.5, PHOTO_FOCUS, PHOTO_ZOOM).x;
const PHOTO_X = TRUNK_X - exitRel;
export const PHOTO = { x: PHOTO_X, y: PHOTO_Y, w: PHOTO_W, h: PHOTO_H };
export const DISH = photoPoint(PHOTO, NATURAL, DISH_UV.u, DISH_UV.v, PHOTO_FOCUS, PHOTO_ZOOM);
/** the clipping's footprint (margin and cutline band included) */
export const CLIP = {
  x0: PHOTO.x - PHOTO_BORDER,
  y0: PHOTO.y - PHOTO_BORDER,
  x1: PHOTO.x + PHOTO.w + PHOTO_BORDER,
  y1: PHOTO.y + PHOTO.h + PHOTO_BORDER + CUTLINE_BAND,
};
/** the cutline's line box (left-aligned in the band, Source Serif Italic 30; ~180 px for "Starlink, 2022") */
export const CUT_BOX = { x0: PHOTO.x + 2, x1: PHOTO.x + 2 + 190, y0: PHOTO.y + PHOTO.h + 10, y1: PHOTO.y + PHOTO.h + 10 + 35 };

// --- labels -------------------------------------------------------------------
/** STARLINK under the clipping, starting just right of the trunk */
export const HEAD = { x: TRUNK_X + 28, y: CLIP.y1 + 40 };
export const HEAD_F = 52;
export const DRONES_F = 186;
export const UGVS_F = 208;

// --- the junction and the row ---------------------------------------------------------
export const J: Pt = { x: TRUNK_X, y: 780 };
/** the device row: a drone's upper guard apex sits this far below the junction; all feet on one floor */
const APEX_Y = 826;
export const FLOOR = 980;
export const LABEL_Y = 1000;

// --- the devices --------------------------------------------------------------------
const DRONE_PX = 176;
const UGV_PX = 216;
type Kind = "drone" | "ugv";
type DevDef = {
  id: string;
  kind: Kind;
  d: string;
  size: number;
  /** resting centre x */
  x: number;
  /** resting tilt (deg) */
  tilt: number;
  /** the contact point in the 256 box (a drone's upper guard apex towards the junction, the robot's mast top) */
  box: Pt;
  contact: number;
  /** prints in (ink) on this frame */
  inF: number;
  ph: [number, number, number];
};
const DEV_DEFS: DevDef[] = [
  { id: "d1", kind: "drone", d: DRONE_D, size: DRONE_PX, x: 225, tilt: -9, box: { x: 180, y: 32 }, contact: 172, inF: 69, ph: [1.7, 0.3, 2.9] },
  { id: "d2", kind: "drone", d: DRONE_D, size: DRONE_PX, x: 480, tilt: 8, box: { x: 76, y: 32 }, contact: 184, inF: 72, ph: [0.4, 2.1, 4.4] },
  { id: "ugv", kind: "ugv", d: UGV_D, size: UGV_PX, x: 790, tilt: 0, box: { x: 72, y: 42 }, contact: 207, inF: 75, ph: [3.1, 5.2, 0.8] },
];

// --- device life ----------------------------------------------------------------------
/** a drone lifts this far (world px) over LIFT_F, starting LIFT_AFTER frames after its touch, levelling as it goes,
 *  then hovers: a bob of BOB px every BOB_P frames and a slight sway of the tilt */
const LIFT = 13;
const LIFT_AFTER = 5;
const LIFT_F = 14;
const BOB = 3.5;
const BOB_P = 30;
const SWAY_DEG = 1.6;
/** the robot rolls forward ROLL px over ROLL_F (done ~f220), then idles with a slight track shimmy */
const ROLL = 40;
const ROLL_AFTER = 2;
const ROLL_F = 11;
const SHIMMY = 1.4;
const SHIMMY_P = 5;
/** a device prints in (fade + a short settle) over this many frames */
const PRINT_F = 12;
const PRINT_DROP = 12;

const easeOutCubic = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
const easeOutBack = (u: number) => {
  const t = clamp01(u);
  const c = 1.3;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
type Pose = { x: number; y: number; rot: number };
const rotP = (p: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return { x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) };
};
/** the world contact point of a device in a pose */
const contactOf = (def: DevDef, p: Pose): Pt => {
  const sc = def.size / 256;
  const o = rotP({ x: (def.box.x - 128) * sc, y: (def.box.y - 128) * sc }, p.rot);
  return { x: p.x + o.x, y: p.y + o.y };
};
/** the resting centre y: a drone's contact apex on APEX_Y, the robot's track foot on FLOOR */
const restY = (def: DevDef) => {
  const sc = def.size / 256;
  if (def.kind === "ugv") return FLOOR - (216 - 128) * sc;
  const o = rotP({ x: (def.box.x - 128) * sc, y: (def.box.y - 128) * sc }, def.tilt);
  return APEX_Y - o.y;
};
export const poseAt = (def: DevDef, S: number): Pose => {
  const y0 = restY(def);
  const pr = 1 - easeOutCubic((S - def.inF) / PRINT_F);
  if (def.kind === "drone") {
    const t = S - def.contact - LIFT_AFTER;
    const u = clamp01(t / LIFT_F);
    const lift = LIFT * easeOutBack(u);
    const hover = smoothstep(t / LIFT_F);
    const bob = t > 0 ? -BOB * hover * Math.cos((2 * Math.PI * t) / BOB_P) : 0;
    const sway = t > 0 ? SWAY_DEG * Math.sin((2 * Math.PI * t) / (BOB_P * 1.3) + def.ph[0]) * hover : 0;
    return { x: def.x, y: y0 - lift + bob - PRINT_DROP * pr, rot: def.tilt * (1 - easeOutCubic(u * 1.15)) + sway };
  }
  const t = S - def.contact - ROLL_AFTER;
  const r = smoothstep(t / ROLL_F);
  const idle = smoothstep((t - ROLL_F) / 4);
  const shimmy = t > ROLL_F ? SHIMMY * idle * Math.sin((2 * Math.PI * (t - ROLL_F)) / SHIMMY_P) : 0;
  const bump = t > ROLL_F ? 0.6 * idle * Math.sin((2 * Math.PI * (t - ROLL_F)) / (SHIMMY_P * 0.5)) : 0;
  return { x: def.x + ROLL * r + shimmy, y: y0 - PRINT_DROP * pr + bump, rot: 0 };
};
export const devTransform = (def: DevDef, p: Pose) =>
  `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)})${p.rot ? ` rotate(${p.rot.toFixed(3)})` : ""} scale(${(def.size / 256).toFixed(5)}) translate(-128 -128)`;

type Dev = DevDef & { sc: number; rest: Pose; c0: Pt; rEnd: number };
export const DEVS: Dev[] = DEV_DEFS.map((def) => {
  const sc = def.size / 256;
  const rest = { x: def.x, y: restY(def), rot: def.tilt };
  const far = Math.max(...[0, 256].flatMap((qx) => [0, 256].map((qy) => Math.hypot(qx - def.box.x, qy - def.box.y)))) * sc;
  return { ...def, sc, rest, c0: contactOf(def, rest), rEnd: far + 8 };
});
const devById = (id: string) => DEVS.find((d) => d.id === id) as Dev;
const D1 = devById("d1");
const D2 = devById("d2");
const UGV = devById("ugv");

// --- strokes: every segment shoots (shootEase: launches fast, settles) -------------------
/** how far the tip runs on into the silhouette past the contact point, world px */
const SEAT_IN = 8;
/** a stroke's bead comes out from under the dish dot / the junction seal over this run (world px) */
const EMERGE = 34;
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
/** One written line: len(S) = L shootEase((S - t0) / T). A branch's bead front edge meets the silhouette on `contact`
 *  (len = sTouch); t0 is placed so it does. */
type Stroke = { id: string; pts: Pt[]; cum: number[]; L: number; sTouch: number; t0: number; T: number; contact: number };
const makeStroke = (id: string, pts: Pt[], T: number, opts: { t0: number } | { contact: number }): Stroke => {
  const cum = cumLen(pts);
  const L = cum[cum.length - 1];
  if ("t0" in opts) return { id, pts, cum, L, sTouch: L, t0: opts.t0, T, contact: opts.t0 + T };
  const sTouch = L - SEAT_IN - BEAD_RATIO * redW(1.8);
  const t0 = opts.contact - T * shootInv(sTouch / L);
  return { id, pts, cum, L, sTouch, t0, T, contact: opts.contact };
};
export const strokeLen = (s: Stroke, S: number) => (S <= s.t0 ? 0 : s.L * shootEase((S - s.t0) / s.T));
export const strokeTimeAt = (s: Stroke, at: number) => s.t0 + s.T * shootInv(clamp01(at / s.L));
const strokeDone = (s: Stroke, S: number) => S >= s.t0 + s.T;

/** the trunk: straight down from the dish dot to the junction */
export const TRUNK_T0 = 93;
const TRUNK_T = 14;
const PHOTO_FOOT = PHOTO.y + PHOTO.h;
export const TRUNK = makeStroke(
  "trunk",
  [
    ...cubic(DISH, { x: DISH.x + (TRUNK_X - DISH.x) * 0.45, y: DISH.y + (PHOTO_FOOT - DISH.y) * 0.75 }, { x: TRUNK_X, y: PHOTO_FOOT - 18 }, { x: TRUNK_X, y: PHOTO_FOOT + 40 }, 40),
    J,
  ],
  TRUNK_T,
  { t0: TRUNK_T0 },
);
/** the junction seal grows as the trunk's bead arrives */
const JSEAL_F = TRUNK_T0 + 9;
const SEAL_GROW_F = 9;

/** branches leave the junction sideways (the kink is under the seal) and drop into their contact */
const branchPts = (c: Pt, lane = J.y): Pt[] => {
  const seat = { x: c.x, y: c.y + SEAT_IN };
  const dx = seat.x - J.x;
  const sgn = Math.sign(dx);
  const dy = seat.y - lane;
  return cubic(J, { x: J.x + sgn * Math.min(Math.abs(dx) * 0.55, 140), y: lane }, { x: seat.x, y: lane + Math.min(dy * 0.15, 6) }, seat, 60);
};
export const BRANCHES = [
  { d: D1, s: makeStroke(D1.id, branchPts(D1.c0), 15, { contact: D1.contact }) },
  { d: D2, s: makeStroke(D2.id, branchPts(D2.c0), 13, { contact: D2.contact }) },
  { d: UGV, s: makeStroke(UGV.id, branchPts(UGV.c0), 16, { contact: UGV.contact }) },
];

/** the live shape of a written branch whose end is tied to a device that has moved off its rest pose: the tail
 *  within `tail` world px of the end follows the device (smooth falloff), the rest stays put */
type Live = { pts: Pt[]; cum: number[]; L: number };
const liveOf = (s: Stroke, d: Dev, S: number, tail: number): Live => {
  const c = contactOf(d, poseAt(d, S));
  const off = { x: c.x - d.c0.x, y: c.y - d.c0.y };
  if (Math.abs(off.x) < 0.01 && Math.abs(off.y) < 0.01) return { pts: s.pts, cum: s.cum, L: s.L };
  const pts = s.pts.map((q, i) => {
    const w = smoothstep(1 - (s.L - s.cum[i]) / tail);
    return { x: q.x + off.x * w, y: q.y + off.y * w };
  });
  const cum = cumLen(pts);
  return { pts, cum, L: cum[cum.length - 1] };
};
const TAIL = 130;
export const liveBranch = (i: number, S: number) => liveOf(BRANCHES[i].s, BRANCHES[i].d, S, Math.min(TAIL, BRANCHES[i].s.L));

// --- the dish dot ----------------------------------------------------------------------
const DISH_DOT_F = 23;
const DISH_DOT_PX = 11;
const DISH_TWINKLE_F = 29;
const DISH_PERIOD = 34;
const JSEAL_LEAD = 1;

// --- the camera -------------------------------------------------------------------------
// One keyed track (the house follower lags ~8-10 f, so keys lead): f0 the clipping fills the stage width (k ~2.1),
// pushing slowly in towards the dish -> f30-92 one pull-back to the hub (k ~1.05) -> f93-160 it pushes in after the
// trunk, down onto the dead drones (k ~1.8) -> it tracks drone 1 (f172), drone 2 (f184), the robot (f207) -> f205-226
// it pulls out to the whole live network, centred (k ~0.97). A key's (x, y) is the WORLD point held at screen
// (540, ACT_Y).
const ACT_Y = 650;
const key = (f: number, x: number, y: number, k: number, ease?: "linear"): VCamKey => ({ f, x, y: y + (960 - ACT_Y) / k, k, ease });
const CAM_KEYS: VCamKey[] = [
  key(-24, 312, 505, 1.86),
  key(24, 302, 508, 1.92, "linear"),
  key(76, 511, 622, 0.99),
  key(102, 500, 668, 1.0),
  key(148, 352, 880, 1.8),
  key(161, 237, 884, 1.86),
  key(170, 245, 884, 1.86),
  key(180, 472, 884, 1.86),
  key(186, 480, 884, 1.86),
  key(198, 700, 888, 1.8),
  key(204, 760, 892, 1.78),
  key(215, 511, 640, 0.97),
  key(DURATION - 1, 511, 638, 0.963, "linear"),
];
export const camAt = runVCamera(CAM_KEYS, DURATION);

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
const HALF = 0.75;

const DevDefs: React.FC<{ d: Dev; p: Pose }> = ({ d, p }) => {
  const h = d.size * HALF;
  const tf = devTransform(d, p);
  return (
    <defs>
      <clipPath id={`${ID}-${d.id}-shape`}>
        <path d={d.d} transform={tf} />
      </clipPath>
      <mask id={`${ID}-${d.id}-outside`} maskUnits="userSpaceOnUse" x={p.x - h} y={p.y - h} width={2 * h} height={2 * h}>
        <rect x={p.x - h} y={p.y - h} width={2 * h} height={2 * h} fill="#FFFFFF" />
        <path d={d.d} transform={tf} fill="#000000" />
      </mask>
    </defs>
  );
};
const Soaked: React.FC<{ d: Dev; p: Pose; c: Pt; S: number; fill: string }> = ({ d, p, c, S, fill }) => {
  const u = (S - d.contact + FLOOD_LEAD) / FLOOD_F;
  if (u <= 0) return null;
  const h = d.size * HALF;
  return (
    <g clipPath={`url(#${ID}-${d.id}-shape)`}>
      {u < 1 ? (
        <path d={blobD(c.x, c.y, d.rEnd * soak(u), d.ph)} fill={fill} style={{ filter: `blur(${FEATHER}px)` }} />
      ) : (
        <rect x={p.x - h} y={p.y - h} width={2 * h} height={2 * h} fill={fill} />
      )}
    </g>
  );
};
const FloodShadow: React.FC<{ d: Dev; p: Pose; c: Pt; S: number; k: number }> = ({ d, p, c, S, k }) => {
  if (S - d.contact + FLOOD_LEAD <= 0) return null;
  return (
    <g mask={`url(#${ID}-${d.id}-outside)`}>
      <g style={{ filter: paperShadow(k) }}>
        <Soaked d={d} p={p} c={c} S={S} fill={RED} />
      </g>
    </g>
  );
};
const Flood: React.FC<{ d: Dev; p: Pose; c: Pt; S: number }> = ({ d, p, c, S }) => {
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
          <radialGradient id={`${ID}-${d.id}-wet`} gradientUnits="userSpaceOnUse" cx={c.x.toFixed(2)} cy={c.y.toFixed(2)} r={d.rEnd.toFixed(2)}>
            {stops}
          </radialGradient>
        </defs>
      ) : null}
      <Soaked d={d} p={p} c={c} S={S} fill={wetOn ? `url(#${ID}-${d.id}-wet)` : RED} />
    </g>
  );
};

// --- the lines ----------------------------------------------------------------------
/** A written line; its bead drains into the silhouette (or under the junction seal) at the end. Once it is fully
 *  written it is drawn on its live shape (its end follows the device it is tied to). */
const LinkLine: React.FC<{ s: Stroke; live: Live; S: number; k: number; drainFrom: number; drainLen: number }> = ({ s, live, S, k, drainFrom, drainLen }) => {
  if (S <= s.t0) return null;
  const len = strokeLen(s, S);
  const done = strokeDone(s, S);
  const w = redW(k);
  const full = BEAD_RATIO * w;
  const drain = clamp01((len - drainFrom) / drainLen);
  const pts = done ? live.pts : s.pts;
  const cum = done ? live.cum : s.cum;
  const drawn = done ? live.L : len;
  const tip = pointAtLen(pts, cum, drawn);
  return (
    <g>
      <WetLine id={`${ID}-${s.id}`} points={pts} len={drawn} k={k} ageAt={(at) => S - strokeTimeAt(s, Math.min(at, s.L))} shadow={false} />
      {drain < 1 ? (
        <Bead id={`${ID}-${s.id}-bead`} x={tip.x} y={tip.y} k={k} r={lerp(full, w / 2, drain)} opacity={(1 - smoothstep(drain)) * smoothstep((len - 8) / EMERGE)} />
      ) : null}
    </g>
  );
};

// --- the travelling highlight: leaves the dish every PULSE_P frames, runs down the trunk and on along every drawn
// branch at a constant speed
const PULSE_P = 26;
const PULSE_T0 = 110;
const PULSE_SPEED = 30;
const PULSE_LEN = 70;
const PULSE_STEPS = 12;
type Route = { id: string; live: Live; off: number; drawn: number };
const Highlight: React.FC<{ S: number; k: number; routes: Route[] }> = ({ S, k, routes }) => {
  const w = redW(k);
  const out: React.ReactNode[] = [];
  const nHi = Math.floor((S - PULSE_T0) / PULSE_P);
  for (let n = nHi; n >= Math.max(0, nHi - 3); n--) {
    const head = (S - (PULSE_T0 + n * PULSE_P)) * PULSE_SPEED;
    if (head <= 0) continue;
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
            key={`${n}-${r.id}-${i}`}
            d={subPathD(r.live.pts, r.live.cum, c0, c1)}
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
  const poses = DEVS.map((d) => poseAt(d, S));
  const cs = DEVS.map((d, i) => contactOf(d, poses[i]));
  const lives = BRANCHES.map((_, i) => liveBranch(i, S));
  const trunkLive: Live = { pts: TRUNK.pts, cum: TRUNK.cum, L: TRUNK.L };
  const routes: Route[] = [
    { id: "trunk", live: trunkLive, off: 0, drawn: strokeLen(TRUNK, S) },
    ...BRANCHES.map((b, i) => ({
      id: b.d.id,
      live: strokeDone(b.s, S) ? lives[i] : { pts: b.s.pts, cum: b.s.cum, L: b.s.L },
      off: TRUNK.L,
      drawn: strokeDone(b.s, S) ? lives[i].L : strokeLen(b.s, S),
    })),
  ];
  const trunkBead = BEAD_RATIO * redW(k);
  return (
    <VStage
      S={S}
      cam={cam}
      photos={<VintagePhoto src={PHOTO_SRC} box={PHOTO} focus={PHOTO_FOCUS} zoom={PHOTO_ZOOM} cutline={CUTLINE} />}
    >
      {DEVS.map((d, i) => (
        <DevDefs key={d.id} d={d} p={poses[i]} />
      ))}
      {/* the dead devices: solid, ink tint, printing in as the hub comes into view */}
      {DEVS.map((d, i) => (
        <Pictogram key={d.id} d={d.d} x={poses[i].x} y={poses[i].y} size={d.size} rotate={poses[i].rot} rung={INK_LO * smoothstep((S - d.inF) / PRINT_F)} />
      ))}
      {DEVS.map((d, i) => (
        <FloodShadow key={d.id} d={d} p={poses[i]} c={cs[i]} S={S} k={k} />
      ))}
      <RedGroup k={k}>
        <LinkLine s={TRUNK} live={trunkLive} S={S} k={k} drainFrom={TRUNK.L - trunkBead * 1.2} drainLen={trunkBead * 1.2} />
        {BRANCHES.map((b, i) => (
          <LinkLine key={b.d.id} s={b.s} live={lives[i]} S={S} k={k} drainFrom={b.s.sTouch} drainLen={SEAT_IN + 2} />
        ))}
        <Seal x={J.x} y={J.y} k={k} grow={Math.max(jGrow, clamp01((S - (BRANCHES[0].s.t0 - JSEAL_LEAD)) / SEAL_GROW_F))} />
        {dotGrow > 0 ? (
          <UplinkPulse x={DISH.x} y={DISH.y} k={k} S={S} r={DISH_DOT_PX} grow={dotGrow} start={DISH_TWINKLE_F} period={DISH_PERIOD} twinkle rings={false} />
        ) : null}
      </RedGroup>
      <Highlight S={S} k={k} routes={routes} />
      {DEVS.map((d, i) => (
        <Flood key={d.id} d={d} p={poses[i]} c={cs[i]} S={S} />
      ))}
      <Label text="Starlink" x={HEAD.x} y={HEAD.y} k={k} size="head" anchor="start" appear={enterU(S, HEAD_F)} />
      <Label text="Drones" x={(D1.x + D2.x) / 2} y={LABEL_Y} k={k} size="word" appear={enterU(S, DRONES_F)} />
      <Label text="UGVs" x={UGV.x + ROLL / 2} y={LABEL_Y} k={k} size="word" transformCase="none" appear={enterU(S, UGVS_F)} />
    </VStage>
  );
};

export default StarlinkLinksDrones;
