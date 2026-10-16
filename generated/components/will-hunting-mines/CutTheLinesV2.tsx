import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  DepthGroup,
  DynamicCable,
  GhostLine,
  InFog,
  PLATFORM,
  depthDistM,
  fogAt,
  fogHex,
  platformPoint,
  OCEAN,
  OceanStage,
  SCENE_BC,
  SIZE_M,
  STROKE_PX,
  SonarFan,
  UlyssesVehicle,
  bloomFilter,
  clamp01,
  easeOutCubic,
  hash01,
  lerp,
  makeView,
  mappingAt,
  project,
  smoothstep,
  unproject,
  useOcean,
  vehicleGeometry,
  MAKO,
  type Cam,
  type GhostLineProps,
  type OceanView,
} from "../kits/cheeky-pint/oceanShared";
import { CABLE } from "./OceanFrames";
import { SNAG_GHOST, SNAG_GHOST_2, SNAG_GHOST_3 } from "./GhostLines";
import { ARC_HIT, HOR, S_C, SNAG, SNAG_ARC, TANGLE, TANGLE_C, TIME0 as TIME0_C, solve as solveC } from "./CableInspection";

/**
 * CutTheLinesV2 — Cheeky Pint S4E02 (Will O'Brien, Ulysses), the cold-review revision of CutTheLines
 * (the continuation of CableInspection). 1080x1920, opaque, 24000/1001 fps, 107 frames (91 + 16 tail).
 *
 * Check line: after this cut the viewer can say "Ulysses' drone cuts the snagged fishing net free off
 * the floating-wind cable."
 *
 * The motion: it opens on CableInspection's settled end (the Mako over the tangle, the bracket on it).
 * The bracket lets go (each corner slides a little out while its arms retract) as the belly hatch
 * opens and the cutter unfolds; the camera pushes in low and big on the wraps. The shear's jaw comes
 * down on the wraps (CONTACT f23) and they part in a quick sequence from the pivot to the tip (f23.6 -
 * f26.6), cut ends springing apart, a small puff of silt off each cut. The freed net, its lines and
 * the cut loops are taken by the current, down and away, out of frame and into the deep haze. Then
 * the camera rises and pulls back along the clean cable to the floating platform: its columns breaking
 * the bright surface, the cable hanging off it, the Mako small above the bare cable. A living hold.
 *
 *   f    | words                              | picture
 *   0    | (we're) building f3                | CableInspection's end state: Mako over the tangle, bracket, fan
 *   3-8  | an implement f6-10                 | the belly hatch swings open
 *   4-22 | implement / that will f15-21       | the arm unfolds out of the hull; the camera pushes in (E 15.7 -> 31)
 *   8-16 |                                    | the bracket releases: corners slide out ~18% while their arms retract
 *   23   | cut f25                            | CONTACT: the closing jaw meets the first wrap (pivot end)
 *   23.6-26.6 |                               | the wraps snap one after another, pivot -> tip; ends spring apart;
 *        |                                    | a puff of silt off each cut
 *   26-44| the f30 / fishing f43              | the net + lines + cut loops pulled off by the current, falling away
 *        |                                    | down-right; the camera eases back a little to watch them go
 *   44-88| lines f53 off f61 of the f70-76    | the camera rises and pulls back along the clean cable (E -> 1.3);
 *        |                                    | the gear recedes into the deep haze; the cutter folds away
 *   80-91| offshore floating f80-86           | the floating platform in view: columns through the bright surface,
 *        |                                    | the cable leaving the turbine column, the Mako small above the cable
 *   91-107| (cut back f91)                    | settled living frame, a slow drift
 */
export const FPS = 24000 / 1001;
export const DURATION = 107;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

type P2 = { x: number; y: number };
const f4 = (v: number) => v.toFixed(4);
// ---- the world: continuous with CableInspection (its f214 is the settled end; 1.5 s of speaker) ----
const SC = SCENE_BC;
const P = SC.focusM * SC.pxPerM;
const C_END = solveC(214);
const TIME0 = TIME0_C + 234; // world clock (snow, current, gear): C's f199 cut-back + 35 frames of speaker
const LEN = CABLE.length;
const cableAtArc = (a: number) => CABLE.at(clamp01(a / LEN));
const TAN = { x: SNAG.tx, y: SNAG.ty }; // along the cable at the snag (+ = toward the touchdown, screen left)
const UP = { x: SNAG.nx, y: SNAG.ny }; // the cable's up normal at the snag
const CW = SIZE_M.cable * SC.pxPerM; // the cable's real width (world px), drawn above its 9 px minimum here

// ---- camera: channels (cable-plane focus x, eye height, ln E, tilt) through the house damped follower ----
/** E = screen px per world px on the cable plane; the eye's world y; the horizon (tilt) */
const camFromFocus = (fx: number, fy: number, E: number, hor = HOR): Cam => {
  const k = E / S_C;
  return { x: fx, y: fy + ((hor - 960) * (1 - S_C)) / (k * S_C), k };
};
/** the cable-plane point at screen centre for an eye height (screen y = hor + E (y - eyeY) on that plane) */
export const fyOfEye = (eyeY: number, E: number, hor: number) => eyeY + (960 - hor) / E;
const E0 = C_END.E;
const FOCUS0 = { x: C_END.cam.x, y: C_END.cam.y - ((HOR - 960) * (1 - S_C)) / (C_END.cam.k * S_C) };
/** the cut: big and low, the wraps at the true middle */
const E_CUT = 31;
const COILS_CUT = { x: 470, y: 968 };
const focusFor = (sx: number, sy: number, E: number) => ({ x: SNAG.x + (540 - sx) / E, y: SNAG.y + (960 - sy) / E });
const FOCUS_CUT = focusFor(COILS_CUT.x, COILS_CUT.y, E_CUT);
/** after the cut: ease back a little to watch the gear go */
const E_FALL = 18;
const FOCUS_FALL = focusFor(430, 760, E_FALL);
/** the end: GhostLines' over/under framing. The eye at the surface (the waterline = the horizon line),
 *  the turbine column at screen x COL_END_X, the whole rotor above, floater + cable + Mako below. */
const E_END = 0.56;
const HOR_END = 1020;
const EYE_END = -3; // 0.3 m above the surface: the line just under the horizon
const COL_END_X = 600;
const SNAG_SCR_END = {
  x: COL_END_X + (SNAG.x - PLATFORM.columns[1].x * SC.pxPerM) * E_END,
  y: HOR_END + (SNAG.y - EYE_END) * E_END,
};
const F_UP = [43, 80] as const;
const F_CROSS = [82, 85] as const; // the lens goes up through the surface (keyed directly: ~2 f across the frame)
const TILT = 95; // the tilt up through the crossing (horizon px): the scene rides down with the meniscus // the rise along the clean cable, up through the surface
const KEYS: { f0: number; f1: number; x: number; y: number; e: number }[] = [
  { f0: 2, f1: 22, x: FOCUS_CUT.x, y: FOCUS_CUT.y, e: E_CUT },
  { f0: 27, f1: 46, x: FOCUS_FALL.x, y: FOCUS_FALL.y, e: E_FALL },
];
type Ch = { x: number; eye: number; le: number; hor: number };
const targetAt = (f: number): Ch => {
  let x = FOCUS0.x;
  let y = FOCUS0.y;
  let le = Math.log(E0);
  let px = x;
  let py = y;
  let pe = E0;
  for (const k of KEYS) {
    const u = smoothstep((f - k.f0) / (k.f1 - k.f0));
    x += (k.x - px) * u;
    y += (k.y - py) * u;
    le += (Math.log(k.e) - Math.log(pe)) * u;
    px = k.x;
    py = k.y;
    pe = k.e;
  }
  // the rise: the camera pulls back keeping the clean snag in view and gliding it to its end place
  // (SNAG_SCR_END), so the eye climbs as the view widens and comes up through the surface at the end
  const E1 = Math.exp(le);
  const sx0 = 540 + E1 * (SNAG.x - x);
  const sy0 = 960 + E1 * (SNAG.y - y);
  const u = smoothstep((f - F_UP[0]) / (F_UP[1] - F_UP[0]));
  const hold = smoothstep((f - 88) / 70);
  const leR = lerp(le, Math.log(E_END), u);
  const leT = leR + Math.log(1.03) * hold;
  const E = Math.exp(leR); // the eye's height ignores the hold's slow push-in (the waterline stays put)
  const hor = lerp(HOR, HOR_END, u);
  const sx = lerp(sx0, SNAG_SCR_END.x, u);
  const sy = lerp(sy0, SNAG_SCR_END.y, u);
  const eye0 = Math.max(EYE_END, SNAG.y - (sy - hor) / E);
  return { x: SNAG.x + (540 - sx) / E + 3 * hold, eye: eye0, le: leT, hor };
};
const TRACK = (() => {
  const out: Ch[] = [];
  let c = targetAt(-40);
  let v: Ch = { x: 0, eye: 0, le: 0, hor: 0 };
  const keys = ["x", "eye", "le", "hor"] as const;
  for (let f = -40; f <= DURATION + 2; f++) {
    const t = targetAt(f);
    const n = { ...c };
    for (const k of keys) {
      v[k] = v[k] + (t[k] - c[k]) * CAM_STIFF - v[k] * CAM_DAMP;
      n[k] = c[k] + v[k];
    }
    c = n;
    if (f >= 0) out.push({ ...c });
  }
  return out;
})();
const EYE_AT_CROSS = TRACK[F_CROSS[0]].eye;
const camAt = (f: number) => {
  const T = TRACK[Math.max(0, Math.min(TRACK.length - 1, Math.floor(f)))];
  const E = Math.exp(T.le);
  // the crossing: from F_CROSS[0] the lens accelerates up through the last metres to EYE_END
  const c = clamp01((f - F_CROSS[0]) / (F_CROSS[1] - F_CROSS[0]));
  const eye = f >= F_CROSS[0] ? Math.min(T.eye, lerp(EYE_AT_CROSS, EYE_END, Math.pow(c, 1.8))) : T.eye;
  // ... and the camera tilts down toward the surface as it nears, then up through it
  const tilt = -TILT * (smoothstep((f - 70) / 11) - smoothstep((f - F_CROSS[0]) / 8));
  const hor = T.hor + tilt;
  return { cam: camFromFocus(T.x, fyOfEye(eye, E, hor), E, hor), E, hor };
};
const REST = camAt(0).cam;

// ---- the story ----------------------------------------------------------------------------------
const F_HATCH = [3, 8] as const;
const F_DEPLOY = [4, 22] as const;
const F_BRACKET = [6, 17] as const; // the lock lets go as the tool takes over: corners close in and retract
const F_BITE = [23.4, 25.6] as const; // the jaw bites on the line: it holds, the line kinks
const F_SNAP = [25.7, 27.0] as const; // the wraps part, pivot end first
const F_RING_OUT = [27, 33] as const; // the scan ring closes up: the job is done
const F_STOW = [58, 82] as const;
const F_HATCH_SHUT = [82, 88] as const;
const F_RISE = [44, 86] as const; // the Mako backs off the cable as the camera rises
/** the vehicle, held the way CableInspection held it: a position against the cable plane (Q) + an
 *  authored screen length, its depth derived from them (zooming never slides it onto the cable). */
const V0 = C_END.veh;
const VIEW_C = makeView({ frame: TIME0_C + 214, cam: C_END.cam, scene: SC, horizon: HOR, sway: { x: 3 * Math.sin((TIME0_C + 214) / 23), y: 5 * Math.sin((TIME0_C + 214) / 19) } });
const Q0 = (() => {
  const sc = project(VIEW_C, V0.x, V0.y, V0.z);
  return unproject(VIEW_C, sc.x, sc.y, CABLE.z);
})();
const LPX0 = mappingAt(VIEW_C, V0.z).a * V0.L; // its screen length at CableInspection's end
/** screen length by zoom (log-log through three points: the end, C's end, the cut) */
const LPX_CUT = 790;
const LPX_END = 185;
const lpxAt = (E: number) => {
  const l = Math.log(E);
  const pts: [number, number][] = [
    [Math.log(E_END), Math.log(LPX_END)],
    [Math.log(E0), Math.log(LPX0)],
    [Math.log(E_CUT), Math.log(LPX_CUT)],
  ];
  if (l <= pts[1][0]) return Math.exp(lerp(pts[0][1], pts[1][1], (l - pts[0][0]) / (pts[1][0] - pts[0][0])));
  return Math.exp(lerp(pts[1][1], pts[2][1], (l - pts[1][0]) / (pts[2][0] - pts[1][0])));
};
/** the hull centre relative to the snag, on screen: at the cut (the wraps below the hull's middle),
 *  and at the end (backed off above the clean cable) */
const VEH_CUT = { x: 165, y: -292 };
const VEH_END = { x: -6, y: -104 };
const Q0_REL = { x: Q0.x - SNAG.x, y: Q0.y - SNAG.y };
const QCUT_REL = { x: VEH_CUT.x / E_CUT, y: VEH_CUT.y / E_CUT };
/** the bite's kick: the shear pressing on the line pushes the hull up a few px, then it settles */
const kickAt = (f: number) => 7 * smoothstep((f - F_BITE[0]) / 1.4) * (1 - smoothstep((f - F_SNAP[0]) / 5));
const qRelAt = (f: number, E: number) => {
  const u = smoothstep((f - F_DEPLOY[0]) / (F_DEPLOY[1] - F_DEPLOY[0]));
  const a = { x: lerp(Q0_REL.x, QCUT_REL.x, u), y: lerp(Q0_REL.y, QCUT_REL.y, u) - kickAt(f) / E };
  const w = smoothstep((f - F_RISE[0]) / (F_RISE[1] - F_RISE[0]));
  return { x: lerp(a.x, VEH_END.x / E, w), y: lerp(a.y, VEH_END.y / E, w) };
};
const tiltAt = (f: number) => lerp(V0.tilt, 0.04, smoothstep((f - 52) / 30));

// ---- the freed gear: one rigid piece (net, lines, cut wraps, mesh) carried off on the current --------
// Once the wraps have unwound it sinks slowly in view (tumbling) until "lines"; then the current takes
// it down-right and toward the eye (the current runs past the camera) and it leaves the frame at the
// lower right; the camera's rise carries it further out below.
const F_FREE = 28.5; // the last wraps have unwound: the net's weight takes it
const F_GO = 50; // the current takes it out of frame
const GEAR = (() => {
  const out: { x: number; y: number; z: number; d: number }[] = [];
  let x = 0;
  let y = 0;
  let d = 0;
  let zz = CABLE.z;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push({ x, y, z: zz, d });
    const g = f + 0.5;
    const sink = 1.0 * smoothstep((g - F_FREE) / 8);
    const go = 7.5 * smoothstep((g - F_GO) / 8);
    const vx = 0.3 * sink + 0.8 * go;
    const vy = 0.95 * sink + 0.6 * go;
    x += vx;
    y += vy;
    d += Math.hypot(vx, vy);
    zz = Math.min(660, zz + 30 * smoothstep((g - F_GO) / 8));
  }
  return out;
})();
/** the tumble pivot: between the wraps and the net */
const GEAR_C = { x: SNAG.x + 9, y: SNAG.y + 9 };
const gearAt = (f: number) => {
  const i = Math.max(0, Math.min(GEAR.length - 2, Math.floor(f)));
  const t = f - i;
  const a = GEAR[i];
  const b = GEAR[i + 1];
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), rot: 0.03 * lerp(a.d, b.d, t) };
};
const gearTransform = (f: number) => {
  const g = gearAt(f);
  return `translate(${f4(g.x)} ${f4(g.y)}) rotate(${f4((g.rot * 180) / Math.PI)} ${f4(GEAR_C.x)} ${f4(GEAR_C.y)})`;
};

// ---- the snag: a tangle of monofilament round the cable (irregular turns, knots, a scrap of mesh) ----
const TANGLES = [
  { along: SNAG_GHOST_3.along, g: { ...SNAG_GHOST_3, net: null }, dt: 29 },
  { along: 0, g: { ...SNAG_GHOST }, dt: 0 },
  { along: SNAG_GHOST_2.along, g: { ...SNAG_GHOST_2, net: null }, dt: 13 },
] as const;
type Wrap = { c: P2; along: number; seed: number; r: number; lean: number; w: number; op: number; bulge: number };
const WRAPS: Wrap[] = (() => {
  const out: Wrap[] = [];
  let a = -4.5;
  let i = 0;
  while (a < 4.6) {
    const h = (k: number) => hash01(i * 17.31 + k * 5.7 + 2);
    out.push({
      c: { x: SNAG.x + TAN.x * a, y: SNAG.y + TAN.y * a },
      along: a,
      seed: i + 1,
      r: CW * (0.56 + 0.22 * h(1)),
      lean: CW * (-0.55 + 1.1 * h(2)),
      w: 2.6 + 3.2 * h(3),
      op: 0.78 + 0.22 * h(4),
      bulge: 0.12 * (h(5) - 0.5),
    });
    a += CW * (0.22 + 0.42 * h(6));
    i++;
  }
  return out;
})();
const ALONG_MIN = Math.min(...WRAPS.map((w) => w.along));
const ALONG_MAX = Math.max(...WRAPS.map((w) => w.along));
/** each wrap parts when the closing jaw's crossing point reaches it: from the pivot end (screen right,
 *  the smallest `along`) to the tip */
const snapAt = (w: Wrap) => lerp(F_SNAP[0], F_SNAP[1], (w.along - ALONG_MIN) / (ALONG_MAX - ALONG_MIN));
/** a turn round the cable, phi 0 = the top (where the blade cuts); front half sin(phi) > 0 */
const wrapPt = (w: Wrap, phi: number): P2 => {
  const cu = Math.cos(phi);
  const sn = Math.sin(phi);
  const r = w.r * (1 + w.bulge * Math.sin(2 * phi + w.seed) + 0.05 * Math.sin(3 * phi + w.seed * 2.3));
  return {
    x: w.c.x + UP.x * r * cu + TAN.x * (-w.lean * cu + 0.3 * CW * sn),
    y: w.c.y + UP.y * r * cu + TAN.y * (-w.lean * cu + 0.3 * CW * sn),
  };
};
/** a wrap's points at frame f (cable-plane local coords, before the gear's rigid motion): whole; bitten
 *  (pressed down and kinked under the jaw); cut at the top, its ends springing apart; pulled off the
 *  cable by the net and relaxing into a slack loop */
const wrapState = (w: Wrap, f: number) => {
  const ts = snapAt(w);
  const cut = f >= ts;
  const tau = f - ts;
  const s = cut ? easeOutCubic(tau / 3) : 0;
  const bite = cut ? 0 : smoothstep((f - F_BITE[0]) / 1.6);
  const relax = cut ? smoothstep((tau - 3) / 10) : 0;
  const N = 30;
  const pts: { p: P2; front: boolean }[] = [];
  // the severed ends part: a gap opens at the cut
  const a0 = cut ? 0.04 + 0.42 * s : 0;
  for (let i = 0; i <= N; i++) {
    const phi = a0 + ((2 * Math.PI - 2 * a0) * i) / N;
    const q = wrapPt(w, phi);
    const wa = Math.exp(-Math.pow(phi / 1.25, 2));
    const wb = Math.exp(-Math.pow((2 * Math.PI - phi) / 1.25, 2));
    // the bite: the top pressed flat onto the cable and kinked to a point under the edge
    const top = Math.exp(-Math.pow(Math.min(phi, 2 * Math.PI - phi) / 0.6, 2));
    const press = bite * top * (w.r - CW * 0.5) * 0.85;
    const kink = bite * top * CW * 0.12 * Math.sign(Math.sin(phi) || 1);
    // the cut ends spring apart along the cable and down; then the loop slackens and opens
    const sx = s * (wa - wb) * CW * 1.1 + kink;
    const su = -s * (wa + wb) * CW * 0.25 - press;
    const slack = relax * CW * 0.6 * (1 - Math.cos(phi)) * 0.5;
    // the turn unwinds off the cable: the cut ends slip round and down first, the bottom of the turn last
    const dphi = Math.min(phi, 2 * Math.PI - phi) / Math.PI;
    const slide = cut ? CW * 2.5 * easeOutCubic((tau - 0.6 - 3.4 * dphi) / 5.5) : 0;
    pts.push({
      p: {
        x: q.x + TAN.x * sx + UP.x * su - UP.x * (slide + slack),
        y: q.y + TAN.y * sx + UP.y * su - UP.y * (slide + slack),
      },
      front: Math.sin(phi) >= 0,
    });
  }
  // clear of the cable once every point is below its underside
  const highest = Math.max(...pts.map((q) => (q.p.x - w.c.x) * UP.x + (q.p.y - w.c.y) * UP.y));
  const clear = highest < -(CW * 0.5 + CW * 0.1);
  return { pts, cut, clear, tau };
};
/** the slide of the whole tangle (the mesh and knots ride with the wraps nearest them) */
const tangleSlide = (f: number, along: number) => {
  const ts = lerp(F_SNAP[0], F_SNAP[1], (along - ALONG_MIN) / (ALONG_MAX - ALONG_MIN));
  return f >= ts ? CW * 2.5 * easeOutCubic((f - ts - 1.5) / 6) : 0;
};

// ---- the cutter: a two-link arm with a shear head (vehicle-plane units: rigid with the hull) -------
const L1 = 5.2;
const L2 = 5.0;
const W1 = 0.95;
const W2 = 0.8;
const BLADE = 8.2; // blade length (vehicle units)
const KW = 1.45; // blade width
const HOUSING = 1.7; // the shear's housing, wrist to blade pivot
const MOUNT_X = 0.06; // along the hull (fraction of L, + = toward the nose)
type ArmPose = { m: P2; e: P2; h: P2; dir: number; open: number; out: number };
/** the hull's local frame -> vehicle-plane coords (facing -1: nose left) */
const hullPt = (v: { x: number; y: number; tilt: number }, lx: number, ly: number) => {
  const c = Math.cos(v.tilt);
  const s = Math.sin(v.tilt);
  return { x: v.x - (lx * c - ly * s), y: v.y + lx * s + ly * c };
};
/** two-link IK in the vehicle plane: elbow down-and-back (toward the tail) */
const ik = (m: P2, t: P2) => {
  const dx = t.x - m.x;
  const dy = t.y - m.y;
  const d = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const a = Math.acos(clamp01((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  const th1a = base + a;
  const th1b = base - a;
  const ea = { x: m.x + L1 * Math.cos(th1a), y: m.y + L1 * Math.sin(th1a) };
  const eb = { x: m.x + L1 * Math.cos(th1b), y: m.y + L1 * Math.sin(th1b) };
  const th1 = ea.x + ea.y > eb.x + eb.y ? th1a : th1b;
  const e = { x: m.x + L1 * Math.cos(th1), y: m.y + L1 * Math.sin(th1) };
  const th2 = Math.atan2(t.y - e.y, t.x - e.x);
  return { th1, th2 };
};
const angLerp = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
};
/** the jaw's opening (rad): opens on the approach, shuts through the wraps (accelerating, a hydraulic
 *  shear), part-opens to let go, shuts to stow */
const JAW_OPEN = 0.62;
const JAW_BITE = 0.15; // the jaw's edge on the line's top
const jawAt = (f: number) => {
  let j: number;
  if (f < 21) j = JAW_OPEN * smoothstep((f - 12) / 8);
  else if (f < F_BITE[0]) j = lerp(JAW_OPEN, JAW_BITE, Math.pow((f - 21) / (F_BITE[0] - 21), 1.6));
  else if (f < F_SNAP[0] - 0.1) j = lerp(JAW_BITE, JAW_BITE * 0.72, smoothstep((f - F_BITE[0]) / (F_SNAP[0] - 0.1 - F_BITE[0])));
  else j = JAW_BITE * 0.72 * (1 - clamp01((f - F_SNAP[0] + 0.1) / 1.0));
  return j + 0.34 * smoothstep((f - 31) / 7) * (1 - smoothstep((f - 52) / 8));
};

type Solved = {
  view: OceanView;
  cam: Cam;
  E: number;
  veh: { x: number; y: number; z: number; tilt: number; L: number };
  emitter: P2;
  arm: ArmPose;
  coilScr: P2;
  scanArc: number;
  scanScr: P2;
};
const F_HOLD = 41;
const axisOf = (tilt: number) => -tilt;
let HELD: { th1: number; th2: number; axis: number } | null = null;
const heldPose = (axis: number) => {
  if (!HELD) {
    const S = solve(F_HOLD - 1e-6);
    const a = S.arm;
    HELD = { th1: Math.atan2(a.e.y - a.m.y, a.e.x - a.m.x), th2: Math.atan2(a.h.y - a.e.y, a.h.x - a.e.x), axis: axisOf(S.veh.tilt) };
  }
  return { th1: HELD.th1 + axis - HELD.axis, th2: HELD.th2 + axis - HELD.axis };
};
const solve = (f: number): Solved => {
  const { cam, E, hor } = camAt(f);
  const fr = TIME0 + f;
  const view = makeView({ frame: fr, cam, scene: SC, horizon: hor, sway: { x: 3 * Math.sin(fr / 23), y: 5 * Math.sin(fr / 19) } });
  const Lpx = lpxAt(E);
  const sV = Lpx / (V0.L * cam.k);
  const zv = P - P / sV;
  const qr = qRelAt(f, E);
  const qs = project(view, SNAG.x + qr.x, SNAG.y + qr.y, CABLE.z);
  const vw = unproject(view, qs.x, qs.y, zv);
  const v = { x: vw.x, y: vw.y, z: zv, tilt: tiltAt(f), L: V0.L };
  const g = vehicleGeometry({ x: v.x, y: v.y, L: V0.L, facing: -1, tilt: v.tilt });
  const D = V0.L * MAKO.D;
  const m = hullPt(v, MOUNT_X * V0.L, D * 0.1);
  // the cable's top over the wraps, carried into the vehicle's plane (where the arm is drawn)
  const coilScr = project(view, SNAG.x, SNAG.y, CABLE.z);
  const topScr = { x: coilScr.x + UP.x * (CW / 2) * E, y: coilScr.y + UP.y * (CW / 2) * E };
  const top = unproject(view, topScr.x, topScr.y, v.z);
  // the head lies along the cable (its pivot on the tail side), the wraps under the blade's middle
  const cableDir = Math.atan2(TAN.y, TAN.x);
  const d = { x: Math.cos(cableDir), y: Math.sin(cableDir) };
  const lift = 1.3 * smoothstep((f - 29) / 12);
  const pv = { x: top.x - d.x * BLADE * 0.52, y: top.y - d.y * BLADE * 0.52 };
  const tgt = { x: pv.x - d.x * HOUSING + UP.x * lift, y: pv.y - d.y * HOUSING + UP.y * lift };
  // after the cut the arm is held rigid with the hull (the Mako backs off; the IK target no longer applies)
  const pose = f >= F_HOLD ? heldPose(axisOf(v.tilt)) : ik(m, tgt);
  // stowed: link 1 flat along the belly toward the tail, link 2 folded back toward the nose
  const axis = axisOf(v.tilt);
  const stow = { th1: axis, th2: axis + Math.PI };
  const out = smoothstep((f - F_DEPLOY[0]) / (F_DEPLOY[1] - F_DEPLOY[0])) * (1 - smoothstep((f - F_STOW[0]) / (F_STOW[1] - F_STOW[0])));
  const th1 = angLerp(stow.th1, pose.th1, out);
  const th2 = angLerp(stow.th2, pose.th2, easeOutCubic(out));
  const e = { x: m.x + L1 * Math.cos(th1), y: m.y + L1 * Math.sin(th1) };
  const h = { x: e.x + L2 * Math.cos(th2), y: e.y + L2 * Math.sin(th2) };
  const headDir = angLerp(th2, cableDir, smoothstep((f - 7) / 8) * (1 - smoothstep((f - F_STOW[0]) / 14)));
  const sa = scanArcAt(f);
  const sp = cableAtArc(sa);
  const ss = project(view, sp.x, sp.y, CABLE.z);
  return { view, cam, E, veh: v, emitter: g.emitter, arm: { m, e, h, dir: headDir, open: jawAt(f), out }, coilScr, scanArc: sa, scanScr: { x: ss.x, y: ss.y } };
};
const scanArcAt = (f: number) => SNAG_ARC + 0 * f;
export const debugSolve = solve;
export const DEBUG = { gearAt, snapAt: () => WRAPS.map(snapAt), wrapState, WRAPS, TANGLES, camAt, lpxAt, E_END, GEAR_C };

// ---- drawing ------------------------------------------------------------------------------------
const seg = (a: P2, b: P2) => `M${f4(a.x)} ${f4(a.y)}L${f4(b.x)} ${f4(b.y)}`;
const poly = (pts: P2[]) => `M${pts.map((p) => `${f4(p.x)} ${f4(p.y)}`).join("L")}Z`;
/** blade outline in its own frame: u along (0 = pivot), w across (+ = the side the edge faces) */
const bladeOutline = (pv: P2, ang: number, edgeSide: 1 | -1) => {
  const d = { x: Math.cos(ang), y: Math.sin(ang) };
  // +w: edgeSide 1 = the blade line's UP side (for the cable tangent, (-ty, tx) is the cable's up normal)
  const n = { x: -d.y * edgeSide, y: d.x * edgeSide };
  const at = (u: number, w: number) => ({ x: pv.x + d.x * BLADE * u + n.x * w * KW, y: pv.y + d.y * BLADE * u + n.y * w * KW });
  // the cutting edge on the w = 0 line, the spine at w = -0.55, a hooked tip turning across the edge
  return [at(-0.1, -0.5), at(-0.1, 0.02), at(0.86, 0.0), at(0.97, 0.16), at(1.0, 0.3), at(1.04, 0.12), at(1.0, -0.22), at(0.82, -0.5), at(0.4, -0.58)];
};
/** the lower (fixed) blade: lies along the cable's top, under the wraps; drawn before the wraps' fronts */
const LowerBlade: React.FC<{ pose: ArmPose }> = ({ pose }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const c0 = Math.cos(pose.dir);
  const s0 = Math.sin(pose.dir);
  const pv = { x: pose.h.x + c0 * HOUSING, y: pose.h.y + s0 * HOUSING };
  // edge faces UP (toward the jaw), spine below, the hooked tip turning up under the wraps
  const pts = bladeOutline(pv, pose.dir, 1);
  return <path d={poly(pts)} fill={OCEAN.steelHi} stroke={OCEAN.hullDeep} strokeWidth={1.8 * px} strokeLinejoin="round" />;
};
/** the arm links, the housing and the moving jaw; drawn BEFORE the hull (it folds out from under it) */
const Cutter: React.FC<{ pose: ArmPose }> = ({ pose }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const { m, e, h, dir, open } = pose;
  const link = (a: P2, b: P2, w: number) => (
    <g strokeLinecap="round">
      <path d={seg(a, b)} stroke={OCEAN.hullDeep} strokeWidth={w} />
      <path d={seg(a, b)} stroke={OCEAN.hullMid} strokeWidth={w * 0.72} />
      <path d={seg({ x: a.x, y: a.y - w * 0.22 }, { x: b.x, y: b.y - w * 0.22 })} stroke={OCEAN.hullHi} strokeOpacity={0.7} strokeWidth={Math.max(w * 0.12, 1.4 * px)} />
    </g>
  );
  const c0 = Math.cos(dir);
  const s0 = Math.sin(dir);
  const pv = { x: h.x + c0 * HOUSING, y: h.y + s0 * HOUSING };
  // the jaw rotates up off the blade line (screen: toward the cable's up side)
  const jaw = bladeOutline(pv, dir + open, -1);
  const hw = 0.95;
  const housing = [
    { x: h.x - s0 * hw, y: h.y + c0 * hw },
    { x: pv.x - s0 * hw * 0.85, y: pv.y + c0 * hw * 0.85 },
    { x: pv.x + s0 * hw * 0.85, y: pv.y - c0 * hw * 0.85 },
    { x: h.x + s0 * hw, y: h.y - c0 * hw },
  ];
  return (
    <g>
      {link(m, e, W1)}
      {link(e, h, W2)}
      <path d={poly(housing)} fill={OCEAN.hullMid} stroke={OCEAN.hullDeep} strokeWidth={1.2 * px} strokeLinejoin="round" />
      {/* the moving jaw: steel with a cream edge, in front of the wraps */}
      <path d={poly(jaw)} fill="#E0DCCB" stroke={OCEAN.hullDeep} strokeWidth={1.8 * px} strokeLinejoin="round" />
      <circle cx={pv.x} cy={pv.y} r={0.26} fill={OCEAN.steelLo} stroke={OCEAN.hullDeep} strokeWidth={1 * px} />
      <circle cx={e.x} cy={e.y} r={W1 * 0.62} fill={OCEAN.hullLo} stroke={OCEAN.hullHi} strokeOpacity={0.5} strokeWidth={1.2 * px} />
      <circle cx={h.x} cy={h.y} r={W2 * 0.8} fill={OCEAN.hullMid} stroke={OCEAN.hullDeep} strokeWidth={1.2 * px} />
      <g style={{ filter: bloomFilter(o.a) }}>
        <circle cx={h.x + c0 * HOUSING * 0.5} cy={h.y + s0 * HOUSING * 0.5} r={0.17} fill={OCEAN.amberTop} />
      </g>
      <circle cx={m.x} cy={m.y} r={W1 * 0.55} fill={OCEAN.hullDeep} />
    </g>
  );
};
/** the gear's monofilament and twine, drawn heavier (a dilate on the group) so the net and lines read
 *  at phone size */
const Heavier: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 1, children }) => {
  const o = useOcean();
  return (
    <g>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology operator="dilate" radius={(r / o.a).toFixed(5)} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </g>
  );
};
/** the belly hatch: a plate hinged at its aft end, swinging down to let the arm out (drawn over the hull) */
const Hatch: React.FC<{ v: { x: number; y: number; tilt: number }; open: number }> = ({ v, open }) => {
  const o = useOcean();
  if (open <= 0.001) return null;
  const D = V0.L * MAKO.D;
  const a = hullPt(v, MOUNT_X * V0.L + 0.9, D / 2);
  const b = hullPt(v, MOUNT_X * V0.L - 0.9, D / 2);
  const hingeAng = Math.atan2(a.y - b.y, a.x - b.x);
  const ang = hingeAng + 1.2 * open;
  const len = Math.hypot(a.x - b.x, a.y - b.y);
  const tip = { x: b.x + Math.cos(ang) * len, y: b.y + Math.sin(ang) * len };
  return (
    <g strokeLinecap="round">
      <path d={seg(a, b)} stroke={OCEAN.hullDeep} strokeWidth={0.28} />
      <path d={seg(b, tip)} stroke={OCEAN.hullLo} strokeWidth={0.2} />
      <path d={seg(b, tip)} stroke={OCEAN.hullHi} strokeOpacity={0.5} strokeWidth={1.2 / o.a} />
    </g>
  );
};
/** the lock bracket letting go: the corners close in on the snag while their arms retract (the lock's
 *  own corners, stroke and bloom; LockBracket's drawing at t = 1) */
const BracketRelease: React.FC<{ x: number; y: number; w: number; h: number; r: number }> = ({ x, y, w, h, r }) => {
  const o = useOcean();
  if (r >= 1) return null;
  const px = 1 / o.a;
  const e = smoothstep(r);
  const m = lerp(1, 0.3, e); // closing in on the snag
  const hw = (w / 2) * m;
  const hh = (h / 2) * m;
  const arm0 = Math.min(w, h) * 0.24;
  const arm = arm0 * (1 - e);
  // the stroke thins with the arms, so the corners shrink to nothing (no last-frame square left over)
  const sw = STROKE_PX.bracket * px * Math.pow(1 - e, 0.6);
  const d = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]
    .map(([sx, sy]) => {
      const cx = x + sx * hw;
      const cy = y + sy * hh;
      return `M${f4(cx)} ${f4(cy - sy * arm)}L${f4(cx)} ${f4(cy)}L${f4(cx - sx * arm)} ${f4(cy)}`;
    })
    .join(" ");
  return (
    <g fill="none" strokeLinecap="square" strokeLinejoin="miter">
      <path d={d} stroke={OCEAN.amberTop} strokeWidth={f4(sw)} style={{ filter: bloomFilter(o.a) }} />
      <path d={d} stroke={OCEAN.amberHot} strokeWidth={f4(Math.min(sw, STROKE_PX.bracketHot * px))} opacity={0.9} />
    </g>
  );
};
/** the tangle's monofilament turns, each its own weight (drawn in the gear's frame). part "back": the
 *  halves behind the cable of the turns still on it; "front": everything else. */
const Wraps: React.FC<{ f: number; part: "back" | "front" }> = ({ f, part }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const els: React.ReactNode[] = [];
  WRAPS.forEach((w, wi) => {
    const st = wrapState(w, f);
    const free = st.cut && st.clear;
    const runs: string[] = [];
    let run: P2[] = [];
    let runFront = st.pts[0].front;
    const flush = () => {
      if (run.length > 1 && (part === "back" ? !runFront && !free : runFront || free)) runs.push(`M${run.map((p) => `${f4(p.x)} ${f4(p.y)}`).join("L")}`);
    };
    for (const q of st.pts) {
      if (q.front !== runFront) {
        run.push(q.p);
        flush();
        run = [q.p];
        runFront = q.front;
      } else run.push(q.p);
    }
    flush();
    // the fresh cut: a thin cream slice across each severed end (shrinking as the ends part), then
    // frayed filament tips
    if (part === "front" && st.cut) {
      const n = st.pts.length;
      const ends = [
        { p: st.pts[0].p, q: st.pts[2].p },
        { p: st.pts[n - 1].p, q: st.pts[n - 3].p },
      ];
      ends.forEach((e, k) => {
        const dx = e.p.x - e.q.x;
        const dy = e.p.y - e.q.y;
        const l = Math.hypot(dx, dy) || 1;
        const u = { x: dx / l, y: dy / l };
        const nrm = { x: -u.y, y: u.x };
        const half = ((w.w * 1.9) / 2) * px * (1 - smoothstep((st.tau - 1.5) / 4));
        if (half > 0.05 * px)
          els.push(<path key={`sl${wi}_${k}`} d={`M${f4(e.p.x - nrm.x * half)} ${f4(e.p.y - nrm.y * half)}L${f4(e.p.x + nrm.x * half)} ${f4(e.p.y + nrm.y * half)}`} stroke={OCEAN.cream} strokeWidth={f4(2.4 * px)} />);
        const fl = Math.min(1, st.tau / 2) * CW * 0.32;
        const fr = [-0.45, 0, 0.45].map((da, m) => {
          const a = Math.atan2(u.y, u.x) + da + (hash01(wi * 9.1 + k * 3.3 + m) - 0.5) * 0.3;
          return `M${f4(e.p.x)} ${f4(e.p.y)}L${f4(e.p.x + Math.cos(a) * fl)} ${f4(e.p.y + Math.sin(a) * fl)}`;
        });
        els.push(<path key={`fr${wi}_${k}`} d={fr.join("")} stroke={OCEAN.cream} strokeWidth={f4(1.4 * px)} />);
      });
    }
    if (!runs.length) return;
    const d = runs.join("");
    const back = part === "back";
    els.push(
      <g key={wi}>
        <path d={d} stroke="#3E3F37" strokeOpacity={back ? 0.3 : 0.42} strokeWidth={f4((w.w + 2.2) * px)} />
        <path d={d} stroke={OCEAN.mono} strokeOpacity={(back ? 0.55 : 0.95) * w.op} strokeWidth={f4(w.w * px)} />
        {!back && w.w > 4 ? <path d={d} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={f4(1.2 * px)} /> : null}
      </g>,
    );
  });
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {els}
    </g>
  );
};
/** knots where the turns cross and bunch (ride on their turns) */
const KNOTS = [1, 4, 6, 9, 12].map((i, k) => ({ i, at: [9, 7, 11, 8, 10][k] }));
const Knots: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const px = 1 / o.a;
  return (
    <g>
      {KNOTS.filter((k) => k.i < WRAPS.length).map((k, n) => {
        const st = wrapState(WRAPS[k.i], f);
        const q = st.pts[k.at].p;
        // a knot: a short twisted lump on the line, not a bead
        const r = CW * (0.075 + 0.03 * hash01(n * 3.1));
        return <ellipse key={n} cx={q.x} cy={q.y} rx={r * 1.9} ry={r} fill="#C8C4B0" stroke="#3E3F37" strokeOpacity={0.55} strokeWidth={1.2 * px} transform={`rotate(${f4(40 + 70 * hash01(n))} ${f4(q.x)} ${f4(q.y)})`} />;
      })}
    </g>
  );
};
/** a scrap of torn net mesh snagged in the turns, hanging off the cable's front */
const MeshScrap: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const cols = 6;
  const rows = 5;
  const node = (i: number, j: number) => {
    const a = 0.4 + i * CW * 0.62 + (j % 2) * CW * 0.31 + (hash01(i * 7.1 + j * 3.3) - 0.5) * CW * 0.15;
    const down = -CW * 0.42 + j * CW * 0.5 + 0.12 * CW * Math.sin(i * 1.7 + t * 0.05);
    const sl = tangleSlide(f, a);
    const sag = j * j * 0.04 * CW;
    return { x: SNAG.x + TAN.x * a - UP.x * (down + sl + sag), y: SNAG.y + TAN.y * a - UP.y * (down + sl + sag) };
  };
  const segs: string[] = [];
  for (let j = 0; j < rows - 1; j++)
    for (let i = 0; i < cols; i++) {
      const nb = j % 2 === 0 ? [i - 1, i] : [i, i + 1];
      for (const ii of nb) {
        if (ii < 0 || ii >= cols) continue;
        if (hash01(i * 11.3 + j * 5.1 + ii * 2.7) < 0.14 + 0.08 * j) continue; // torn
        const p0 = node(i, j);
        const p1 = node(ii, j + 1);
        segs.push(`M${f4(p0.x)} ${f4(p0.y)}L${f4(p1.x)} ${f4(p1.y)}`);
      }
    }
  const rope = Array.from({ length: cols }, (_, i) => node(i, 0));
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={segs.join("")} stroke="#3E3F37" strokeOpacity={0.35} strokeWidth={f4(4.2 * px)} />
      <path d={segs.join("")} stroke={OCEAN.twine} strokeWidth={f4(2.6 * px)} />
      <path d={`M${rope.map((p) => `${f4(p.x)} ${f4(p.y)}`).join("L")}`} stroke={OCEAN.twine} strokeWidth={f4(4 * px)} />
    </g>
  );
};

/** a small puff of silt off each cut: specks thrown out from the cut point (slowed by the water, then
 *  carried on the current) and a thin cloud that spreads and thins. No light, no glow. */
const Puffs: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const els: React.ReactNode[] = [];
  WRAPS.forEach((w, wi) => {
    const tau = f - snapAt(w);
    if (tau <= 0 || tau > 40) return;
    const c0 = wrapPt(w, 0);
    const cloudR = CW * (0.25 + 0.9 * easeOutCubic(tau / 10));
    const cloudA = 0.16 * (1 - smoothstep(tau / 20)) * smoothstep(tau / 1.5);
    const cur = { x: 0.06 * tau, y: 0.02 * tau };
    els.push(<circle key={`c${wi}`} cx={c0.x + UP.x * cloudR * 0.3 + cur.x} cy={c0.y + UP.y * cloudR * 0.3 + cur.y} r={cloudR} fill="#5A5345" opacity={cloudA} style={{ filter: `blur(${(7 * px).toFixed(3)}px)` }} />);
    for (let k = 0; k < 7; k++) {
      const h1 = hash01(wi * 31.7 + k * 7.3);
      const h2 = hash01(wi * 11.3 + k * 3.9 + 5);
      const h3 = hash01(wi * 5.1 + k * 13.7 + 9);
      // thrown up and out from the cut, either way along the cable
      const ang = (h1 - 0.5) * 2.4;
      const dir = { x: UP.x * Math.cos(ang) + TAN.x * Math.sin(ang), y: UP.y * Math.cos(ang) + TAN.y * Math.sin(ang) };
      const v0 = CW * (0.35 + 0.55 * h2);
      const tc = 3.2;
      const dist = v0 * tc * (1 - Math.exp(-tau / tc));
      const x = c0.x + dir.x * dist + cur.x * (0.6 + h3);
      const y = c0.y + dir.y * dist + cur.y * (0.6 + h3) + 0.004 * tau * tau;
      const r = (1.6 + 2.2 * h3) * px;
      const a = 0.85 * (1 - smoothstep((tau - 8 - 14 * h2) / 14));
      els.push(<circle key={`p${wi}_${k}`} cx={x} cy={y} r={r} fill={h1 > 0.5 ? "#9C927B" : "#5E5749"} opacity={a} />);
    }
  });
  return <g>{els}</g>;
};
/** the freed gear's lines and net (the module's GhostLine, coils off: wrap 0), anchored where the
 *  wraps were, carried with them */
const Lines: React.FC<{ t: number }> = ({ t }) => {
  return (
    <>
      {TANGLES.map((tg, j) => {
        const p: GhostLineProps = {
          ...tg.g,
          anchor: { x: SNAG.x + TAN.x * tg.along, y: SNAG.y + TAN.y * tg.along },
          tangent: TAN,
          cableW: CW,
          wrap: 0,
          frame: t + tg.dt,
          layer: "front",
        };
        return <GhostLine key={j} {...p} />;
      })}
    </>
  );
};

/** CableInspection's MappedTrace, its chainage ticks thinned out by their on-screen spacing (pulled
 *  back they would crowd into a zipper) */
const TICK = 9;
const TraceV2: React.FC<{ from: number; to: number; hotFrom: number }> = ({ from, to, hotFrom }) => {
  const o = useOcean();
  if (to - from < 0.01) return null;
  const px = 1 / o.a;
  const cw = Math.max(CW, 9 / o.a);
  const step = Math.max(0.6, 5 * px);
  const n = Math.max(2, Math.ceil((to - from) / step));
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    const p = cableAtArc(a);
    return { a, x: p.x + p.nx * cw * 0.08, y: p.y + p.ny * cw * 0.08 };
  });
  const segs = (a0: number, a1: number) =>
    pts
      .filter((p) => p.a >= a0 - step && p.a <= a1 + step)
      .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(3)} ${p.y.toFixed(3)}`)
      .join("");
  const hot0 = Math.max(from, Math.min(to, hotFrom));
  const tickOp = smoothstep((TICK * o.a - 30) / 60);
  const lineOp = lerp(0.45, 1, smoothstep((TICK * o.a - 20) / 80));
  const ticks: { d: string; hot: number }[] = [];
  if (tickOp > 0.01)
    for (let a = Math.ceil(from / TICK) * TICK; a <= to; a += TICK) {
      const p = cableAtArc(a);
      const h = cw * 0.95 + 9 * px;
      ticks.push({ d: `M${(p.x + p.nx * h).toFixed(3)} ${(p.y + p.ny * h).toFixed(3)}L${(p.x - p.nx * h).toFixed(3)} ${(p.y - p.ny * h).toFixed(3)}`, hot: a >= hot0 ? 1 : 0 });
    }
  const lw = 4.5 * px * lerp(0.6, 1, lineOp);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={segs(from, to)} stroke={OCEAN.cream} strokeOpacity={0.35 * lineOp} strokeWidth={lw * 3.2} style={{ filter: `blur(${(5 * px).toFixed(3)}px)` }} />
      <path d={segs(from, hot0)} stroke={OCEAN.cream} strokeOpacity={0.95 * lineOp} strokeWidth={lw} />
      <g style={{ filter: bloomFilter(o.a) }}>
        <path d={segs(hot0, to)} stroke={OCEAN.amberTop} strokeWidth={lw * 1.1} />
      </g>
      {ticks.map((t, i) => (
        <path key={i} d={t.d} stroke={t.hot ? OCEAN.amberTop : OCEAN.cream} strokeOpacity={(t.hot ? 1 : 0.9) * tickOp} strokeWidth={3.5 * px} strokeLinecap="butt" />
      ))}
    </g>
  );
};
/** CableInspection's ScanRing, closing up (its radius to nothing) once the line is cut */
const RingV2: React.FC<{ arc: number; close: number }> = ({ arc, close }) => {
  const o = useOcean();
  if (close >= 1) return null;
  const px = 1 / o.a;
  const cw = Math.max(CW, 9 / o.a);
  const p = cableAtArc(arc);
  const ang = (Math.atan2(p.ty, p.tx) * 180) / Math.PI;
  const r = (cw * 1.05 + 6 * px) * (1 - easeOutCubic(close) * 0.86);
  const sw = (1 - smoothstep((close - 0.6) / 0.4)) ;
  return (
    <g transform={`translate(${f4(p.x)} ${f4(p.y)}) rotate(${f4(ang)})`}>
      <g style={{ filter: bloomFilter(o.a) }}>
        <ellipse cx={0} cy={0} rx={r * 0.32} ry={r} fill="none" stroke={OCEAN.amberTop} strokeWidth={4 * px * (0.4 + 0.6 * sw)} />
      </g>
      <ellipse cx={0} cy={0} rx={r * 0.32} ry={r} fill="none" stroke={OCEAN.amberHot} strokeWidth={1.6 * px} />
    </g>
  );
};
/** the gear in its own frame: depth + the rigid drift/tumble */
const GearFrame: React.FC<{ f: number; children?: React.ReactNode }> = ({ f, children }) => (
  <DepthGroup z={gearAt(f).z}>
    <g transform={gearTransform(f)}>{children}</g>
  </DepthGroup>
);
const F_GEAR_GONE = 74; // well out of frame by then (checked in the sheets)
const FAN_REACH = 1.16;
const World: React.FC<{ f: number; S: Solved }> = ({ f, S }) => {
  const t = TIME0 + f;
  const bracket = clamp01((f - F_BRACKET[0]) / (F_BRACKET[1] - F_BRACKET[0]));
  // the fan: on the tangle (as CableInspection left it), then onto the wraps for the cut
  const tc = project(S.view, TANGLE_C.x, TANGLE_C.y, CABLE.z);
  const startAim = { x: lerp(S.coilScr.x, tc.x, 0.8), y: lerp(S.coilScr.y, tc.y, 0.8) };
  const toCoils = smoothstep((f - 6) / 14);
  const aimX = lerp(startAim.x, S.coilScr.x, toCoils);
  const aimY = lerp(startAim.y, S.coilScr.y, toCoils);
  const tgt = unproject(S.view, aimX, aimY, S.veh.z);
  const dx = tgt.x - S.emitter.x;
  const dy = tgt.y - S.emitter.y;
  const spread = lerp(0.78, 0.5, Math.max(toCoils * 0.6, smoothstep((f - 48) / 16)));
  const hatch = smoothstep((f - F_HATCH[0]) / (F_HATCH[1] - F_HATCH[0])) * (1 - smoothstep((f - F_HATCH_SHUT[0]) / (F_HATCH_SHUT[1] - F_HATCH_SHUT[0])));
  const gearOn = f < F_GEAR_GONE;
  const gearNear = gearAt(f).z > S.veh.z; // drifting past the eye: in front of the Mako
  const gearFront = gearOn ? (
    <GearFrame f={f}>
      <Heavier id="gearLines">
        <Lines t={t} />
      </Heavier>
      <MeshScrap f={f} t={t} />
      <Wraps f={f} part="front" />
      <Knots f={f} />
    </GearFrame>
  ) : null;
  return (
    <>
      <Floater at={PLAT} frame={t} />
      {gearOn ? (
        <GearFrame f={f}>
          <Wraps f={f} part="back" />
        </GearFrame>
      ) : null}
      <DepthGroup z={CABLE.z}>
        <DynamicCable cable={CABLE} />
        <TraceV2 from={ARC_HIT} to={S.scanArc} hotFrom={scanArcAt(f - 6)} />
        <RingV2 arc={S.scanArc} close={clamp01((f - F_RING_OUT[0]) / (F_RING_OUT[1] - F_RING_OUT[0]))} />
      </DepthGroup>
      {S.arm.out > 0.001 ? (
        <DepthGroup z={S.veh.z}>
          <LowerBlade pose={S.arm} />
        </DepthGroup>
      ) : null}
      {!gearNear ? gearFront : null}
      <DepthGroup z={CABLE.z}>
        <BracketRelease x={TANGLE_C.x} y={TANGLE_C.y} w={TANGLE.w} h={TANGLE.h} r={bracket} />
      </DepthGroup>
      <DepthGroup z={S.veh.z}>
        <SonarFan x={S.emitter.x} y={S.emitter.y} angle={Math.atan2(dy, dx)} spread={spread} range={Math.hypot(dx, dy) * FAN_REACH} sweep={0.5 + 0.38 * Math.sin(t / 8)} strength={1} />
      </DepthGroup>
      {/* the silt off the cuts: in the shade under the head, not lit by the fan */}
      <DepthGroup z={CABLE.z}>
        <Puffs f={f} />
      </DepthGroup>
      <DepthGroup z={S.veh.z}>
        {S.arm.out > 0.001 ? <Cutter pose={S.arm} /> : null}
        <UlyssesVehicle x={S.veh.x} y={S.veh.y} L={V0.L} facing={-1} tilt={S.veh.tilt} frame={t} light={1} />
        <Hatch v={S.veh} open={hatch} />
      </DepthGroup>
      {gearNear ? gearFront : null}
    </>
  );
};

/** the churn the lens rises through: foam riding just under the waterline as it crosses, and a few
 *  bubbles left behind streaming up past the lens (GhostLinesV2's dip churn, in reverse) */
const FOAM = Array.from({ length: 16 }, (_, k) => ({ x: hash01(400 + k) * 1080, dy: hash01(410 + k) * 50, rx: 60 + hash01(420 + k) * 120, ry: 12 + hash01(430 + k) * 20 }));
const CrossFoam: React.FC<{ v: OceanView; f: number }> = ({ v, f }) => {
  const split = domeY(v);
  if (split < -80 || split > 1400 || f < 70) return null;
  const on = 1 - smoothstep((f - F_CROSS[1] - 2) / 6);
  if (on <= 0.01) return null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      {FOAM.map((b, k) => (
        <ellipse key={k} cx={fA(b.x)} cy={fA(split + 18 + b.dy)} rx={fA(b.rx)} ry={fA(b.ry)} fill="#FFFFFF" opacity={0.42 * on} style={{ filter: "blur(10px)" }} />
      ))}
    </svg>
  );
};
const CutTheLinesV2: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const S = solve(f);
  return (
    <AbsoluteFill style={{ backgroundColor: "#30494A" }}>
      <OceanStage frame={TIME0 + f} cam={S.cam} scene={SC} horizon={S.view.horizon} rest={REST} sway overlay={
          <>
            <CrossFoam v={S.view} f={f} />
            <AboveWater v={S.view} T={TIME0 + f} wetLens={6 * (1 - smoothstep((f - F_CROSS[1]) / 12))} />
          </>
        }>
        <World f={f} S={S} />
      </OceanStage>
    </AbsoluteFill>
  );
};
export default CutTheLinesV2;

// =============================================================================================
// ABOVE THE WATER + THE FLOATER — copied from GhostLinesV2.tsx (its over/under opening and surface
// crossing: the SAME turbine, floater and sea; one wavy meniscus), helper names local. The Floater is
// GhostLinesV2's variant of FloatingPlatform, changed here: no faint tower (the real one is above the
// line), moorings hanging at a clear catenary angle, submerged columns fading with depth.
// =============================================================================================
const fA = (n: number) => (Math.round(n * 1000) / 1000).toString();
const fB = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const polyA = (pts: { x: number; y: number }[]) => `M${pts.map((p) => `${fA(p.x)} ${fA(p.y)}`).join("L")}Z`;
const PLAT = { x: 0, y: 0 };
const SKY = { top: "#AEB8AE", mid: "#D3D2C2", low: "#E9E3D0", haze: "#EFEADA" } as const;
const SEA_UP = { far: "#BFC3B3", near: "#6C877D", glint: OCEAN.cream } as const;
const PAINT = { hi: "#F1EBDD", mid: "#DDD6C6", lo: "#ABA597", deep: "#8B867A", seam: "#9B9586" } as const;
const TURBINE = { hub: -102, R: 80, yaw: 0.46, rpmFrames: 150 } as const; // metres; a V164-class rotor
const G_DOME = 820; // screen px of dome waterline travel per metre of eye depth (fast: the lens dips under)
const G_DOME_ABOVE = 96; // ... and per metre of eye height while still above the surface
const wave = (x: number, T: number) => 7 * Math.sin(x / 96 + T * 0.31) + 4 * Math.sin(x / 41 - T * 0.47 + 1.3) + 1.8 * Math.sin(x / 17 + T * 0.9);
const domeY = (v: OceanView) => {
  const h = -(v.eye.y - SCENE_BC.surfaceY) / SCENE_BC.pxPerM; // metres above the surface
  return v.horizon + (h > 0 ? G_DOME_ABOVE : G_DOME) * h;
};
const CLOUDS = Array.from({ length: 7 }, (_, i) => ({ x: hash01(200 + i) * 1500, h: 380 + hash01(210 + i) * 1000, rx: 160 + hash01(220 + i) * 220, ry: 22 + hash01(230 + i) * 30, a: 0.16 + 0.18 * hash01(240 + i), v: 0.25 + 0.2 * hash01(250 + i) }));
const AboveWater: React.FC<{ v: OceanView; T: number; wetLens?: number }> = ({ v, T, wetLens = 0 }) => {
  const split = domeY(v);
  if (split < -20) return null;
  // the lens is wet as it comes up through: the view above the line softens, then clears as it runs off
  const wet = wetLens;
  const M = SCENE_BC.pxPerM;
  const bob = 0.4 * Math.sin(T / 41); // = FloatingPlatform's heave
  const P = (xm: number, ym: number, zm: number) => {
    const q = platformPoint(v, PLAT, xm, ym, zm);
    return project(v, q.x, q.y, q.z);
  };
  const hor = v.horizon;
  const seaTop = Math.min(hor, split);
  const cols = PLATFORM.columns;
  // ---- the floater above the water: columns (freeboard), their caps, the top beams
  const column = (ci: number) => {
    const c = cols[ci];
    const top = P(c.x, -PLATFORM.freeboard + bob, c.z);
    const foot = P(c.x, 0, c.z);
    const rx = (c.d / 2) * M * top.a;
    const id = `gl_col${ci}`;
    return (
      <g key={`c${ci}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7E7B70" />
            <stop offset="0.2" stopColor={OCEAN.steelHi} />
            <stop offset="0.32" stopColor="#E6E2D2" />
            <stop offset="0.55" stopColor={OCEAN.steelMid} />
            <stop offset="0.85" stopColor={OCEAN.steelLo} />
            <stop offset="1" stopColor="#45443C" />
          </linearGradient>
        </defs>
        <rect x={top.x - rx} y={top.y} width={rx * 2} height={foot.y - top.y + 1} fill={`url(#${id})`} />
        {/* the top rim seen from just below its height: a shallow arc */}
        <path d={`M${fA(top.x - rx)} ${fA(top.y)}A${fA(rx)} ${fA(Math.max(1.5, rx * 0.09))} 0 0 1 ${fA(top.x + rx)} ${fA(top.y)}Z`} fill={`url(#${id})`} />
        <path d={`M${fA(top.x - rx)} ${fA(top.y + 2)}H${fA(top.x + rx)}`} stroke={OCEAN.steelLo} strokeOpacity={0.5} strokeWidth={1.2} />
        {/* the wet band and foam where it stands in the sea */}
        <rect x={top.x - rx} y={foot.y - Math.max(2, 0.8 * M * top.a)} width={rx * 2} height={Math.max(2, 0.8 * M * top.a)} fill={OCEAN.fouling} opacity={0.45} />
        <ellipse cx={foot.x} cy={foot.y} rx={rx * 1.35} ry={Math.max(1.6, rx * 0.07)} fill={OCEAN.cream} opacity={0.75} style={{ filter: "blur(1.2px)" }} />
      </g>
    );
  };
  const beam = (a: number, b: number, ym: number, dm: number, key: string) => {
    const N = 12;
    const T1: { x: number; y: number }[] = [];
    const B1: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const xm = lerp(cols[a].x, cols[b].x, u);
      const zm = lerp(cols[a].z, cols[b].z, u);
      T1.push(P(xm, ym - dm / 2 + bob, zm));
      B1.push(P(xm, ym + dm / 2 + bob, zm));
    }
    const yT = Math.min(...T1.map((p) => p.y));
    const yB = Math.max(...B1.map((p) => p.y));
    const id = `gl_b${key}`;
    return (
      <g key={key}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={fA(yT)} x2="0" y2={fA(yB)}>
            <stop offset="0" stopColor="#E6E2D2" />
            <stop offset="0.4" stopColor={OCEAN.steelHi} />
            <stop offset="1" stopColor={OCEAN.steelLo} />
          </linearGradient>
        </defs>
        <path d={polyA([...T1, ...B1.reverse()])} fill={`url(#${id})`} />
      </g>
    );
  };
  // ---- the turbine on column 1: tower, nacelle, hub, three blades (clockwise from upwind)
  const tc = cols[1];
  const tz = tc.z;
  const towerPts = (() => {
    const b0 = P(tc.x, -PLATFORM.freeboard + bob, tz);
    const t0 = P(tc.x, TURBINE.hub + 3.2 + bob, tz);
    const wb = 3.6 * M * b0.a;
    const wt = 2.2 * M * t0.a;
    return { b0, t0, wb, wt };
  })();
  const { b0, t0, wb, wt } = towerPts;
  const hubX = tc.x + 7 * Math.sin(TURBINE.yaw);
  const hub = P(hubX, TURBINE.hub + bob, tz);
  const a = hub.a;
  const nac = { x0: P(tc.x - 6.5 * Math.sin(TURBINE.yaw) - 2.4, 0, tz).x, x1: P(hubX - 0.6, 0, tz).x, h: 5.6 * M * a };
  const theta = (2 * Math.PI * T) / TURBINE.rpmFrames + 0.35;
  const cy = Math.cos(TURBINE.yaw);
  const chord = (r: number) => {
    const R = TURBINE.R;
    if (r < 3) return 3.6;
    if (r < 0.2 * R) return lerp(3.6, 5.3, smoothstep((r - 3) / (0.2 * R - 3)));
    return lerp(5.3, 0.9, Math.pow((r - 0.2 * R) / (0.8 * R), 0.85));
  };
  const blades = [0, 1, 2].map((i) => {
    const th = theta + (i * 2 * Math.PI) / 3;
    const d = { x: Math.sin(th) * cy, y: -Math.cos(th) };
    const p = { x: Math.cos(th) * cy, y: Math.sin(th) };
    const rs = Array.from({ length: 22 }, (_, j) => 1.6 + (TURBINE.R - 1.6) * Math.pow(j / 21, 1.15));
    const at = (r: number, off: number) => ({ x: hub.x + (d.x * r + p.x * off) * M * a, y: hub.y + (d.y * r + p.y * off) * M * a });
    const le = rs.map((r) => at(r, chord(r) * 0.3));
    const te = rs.map((r) => at(r, -chord(r) * 0.7));
    const mid = rs.map((r) => at(r, -chord(r) * 0.12));
    const body = polyA([...le, ...te.slice().reverse()]);
    const shade = polyA([...mid, ...te.slice().reverse()]);
    const edge = `M${le.map((q) => `${fA(q.x)} ${fA(q.y)}`).join("L")}`;
    return (
      <g key={i}>
        <path d={body} fill={PAINT.hi} />
        <path d={shade} fill={PAINT.lo} opacity={0.55} />
        <path d={edge} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.1} />
      </g>
    );
  });
  // ---- distant turbines on the sea horizon (hazy, at infinity)
  const far = [
    { x: 118, h: 118, ph: 1.1 },
    { x: 905, h: 84, ph: 2.7 },
    { x: 1012, h: 66, ph: 0.4 },
  ].map((t, i) => {
    const ty = hor - t.h;
    const r = t.h * 0.58;
    const th = theta * 0.94 + t.ph;
    return (
      <g key={i} opacity={0.55}>
        <path d={polyA([{ x: t.x - t.h * 0.018, y: hor }, { x: t.x - t.h * 0.011, y: ty }, { x: t.x + t.h * 0.011, y: ty }, { x: t.x + t.h * 0.018, y: hor }])} fill="#C3C4B6" />
        {[0, 1, 2].map((j) => {
          const b = th + (j * 2 * Math.PI) / 3;
          return <path key={j} d={`M${fA(t.x)} ${fA(ty)}L${fA(t.x + Math.sin(b) * r * 0.9)} ${fA(ty - Math.cos(b) * r)}`} stroke="#C3C4B6" strokeWidth={Math.max(1, t.h * 0.016)} strokeLinecap="round" />;
        })}
      </g>
    );
  });
  // ---- the sea seen from just above it: haze at the horizon, glints drifting
  const glints = Array.from({ length: 46 }, (_, i) => {
    const h1 = Math.abs(Math.sin(i * 91.7 + 3.1) * 43758.5453) % 1;
    const h2 = Math.abs(Math.sin(i * 17.3 + 9.4) * 24634.6345) % 1;
    const h3 = Math.abs(Math.sin(i * 53.9 + 1.7) * 12345.6789) % 1;
    const yy = seaTop + (split - seaTop) * Math.pow(h2, 0.8);
    const depthT = (yy - seaTop) / Math.max(1, split - seaTop);
    const len = 4 + 26 * h3 * (0.4 + depthT);
    const xx = ((h1 * 1300 + T * (0.6 + 0.8 * h3)) % 1300) - 110;
    return <path key={i} d={`M${fA(xx)} ${fA(yy)}h${fA(len)}`} stroke={SEA_UP.glint} strokeOpacity={0.18 + 0.32 * h1 * (1 - depthT * 0.4)} strokeWidth={0.8 + 1.4 * depthT} strokeLinecap="round" />;
  });
  const clip = (() => {
    const pts: string[] = [];
    for (let x = -20; x <= 1100; x += 20) pts.push(`${fA(x)} ${fA(split + wave(x, T))}`);
    return { d: `M-20 -40H1100V${fA(split + wave(1100, T))}L${pts.reverse().join("L")}Z`, line: `M${pts.reverse().join("L")}` };
  })();
  const sunX = 330;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <clipPath id="gl_above">
          <path d={clip.d} />
        </clipPath>
        <linearGradient id="gl_sky" gradientUnits="userSpaceOnUse" x1="0" y1={fA(hor - 1500)} x2="0" y2={fA(hor)}>
          <stop offset="0" stopColor={SKY.top} />
          <stop offset="0.55" stopColor={SKY.mid} />
          <stop offset="0.9" stopColor={SKY.low} />
          <stop offset="1" stopColor={SKY.haze} />
        </linearGradient>
        <radialGradient id="gl_sun" gradientUnits="userSpaceOnUse" cx={sunX} cy={fA(hor - 1150)} r={900}>
          <stop offset="0" stopColor="#FBF3DD" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#F4E9CF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#F4E9CF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gl_sea" gradientUnits="userSpaceOnUse" x1="0" y1={fA(seaTop)} x2="0" y2={fA(Math.max(seaTop + 1, split + 6))}>
          <stop offset="0" stopColor={SEA_UP.far} />
          <stop offset="0.3" stopColor="#97A99E" />
          <stop offset="1" stopColor={SEA_UP.near} />
        </linearGradient>
        <linearGradient id="gl_tower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={PAINT.mid} />
          <stop offset="0.28" stopColor={PAINT.hi} />
          <stop offset="0.62" stopColor={PAINT.mid} />
          <stop offset="1" stopColor={PAINT.lo} />
        </linearGradient>
        <linearGradient id="gl_nac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAINT.hi} />
          <stop offset="0.55" stopColor={PAINT.mid} />
          <stop offset="1" stopColor={PAINT.deep} />
        </linearGradient>
        <radialGradient id="gl_hub" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.5" stopColor={PAINT.hi} />
          <stop offset="1" stopColor={PAINT.lo} />
        </radialGradient>
      </defs>
      <g clipPath="url(#gl_above)" style={{ filter: wet > 0.05 ? `blur(${fA(wet)}px)` : undefined }}>
        <rect x={-20} y={-40} width={1120} height={seaTop + 41} fill="url(#gl_sky)" />
        <rect x={-20} y={-40} width={1120} height={seaTop + 41} fill="url(#gl_sun)" />
        {/* a band of haze lying on the horizon */}
        <rect x={-20} y={hor - 70} width={1120} height={70} fill={SKY.haze} opacity={0.45} style={{ filter: "blur(18px)" }} />
        {/* soft high cloud, drifting: the sky is not a flat card */}
        {CLOUDS.map((c, i) => (
          <ellipse key={i} cx={fA(((c.x + T * c.v) % 1500) - 210)} cy={fA(hor - c.h)} rx={c.rx} ry={c.ry} fill={i % 2 ? "#F4EFE1" : "#C9CDC0"} opacity={c.a} style={{ filter: "blur(16px)" }} />
        ))}
        {far}
        <rect x={-20} y={seaTop} width={1120} height={Math.max(0, split - seaTop + 12)} fill="url(#gl_sea)" />
        {glints}
        {/* the floater: back column, beams to it, the front beam, the front columns */}
        {column(2)}
        {beam(0, 2, -PLATFORM.freeboard + 1.4, 1.9, "02")}
        {beam(1, 2, -PLATFORM.freeboard + 1.4, 1.9, "12")}
        {column(0)}
        {beam(0, 1, -PLATFORM.freeboard + 1.4, 1.9, "01")}
        {column(1)}
        {/* the tower, standing on the turbine column */}
        <path d={polyA([{ x: b0.x - wb, y: b0.y }, { x: t0.x - wt, y: t0.y }, { x: t0.x + wt, y: t0.y }, { x: b0.x + wb, y: b0.y }])} fill="url(#gl_tower)" />
        <rect x={b0.x - wb} y={b0.y - 7 * M * b0.a} width={wb * 2} height={1.2} fill={PAINT.seam} opacity={0.7} />
        <rect x={b0.x - wb * 1.08} y={b0.y - 1.4 * M * b0.a} width={wb * 2.16} height={1.4 * M * b0.a} fill={OCEAN.steelMid} />
        {/* the nacelle, yawed a little to the wind: its flank shows behind the hub */}
        <rect x={nac.x0} y={hub.y - nac.h * 0.5} width={nac.x1 - nac.x0} height={nac.h} rx={nac.h * 0.22} fill="url(#gl_nac)" />
        <path d={`M${fA(nac.x0 + nac.h * 0.25)} ${fA(hub.y - nac.h * 0.5 + 1.5)}H${fA(nac.x1 - nac.h * 0.1)}`} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1.2} />
        {blades}
        <ellipse cx={hub.x + 0.8 * M * a} cy={hub.y} rx={2.5 * M * a} ry={2.7 * M * a} fill="url(#gl_hub)" />
      </g>
      {/* the dome's waterline: a bright meniscus, the surface's underside lit just below it */}
      <defs>
        <linearGradient id="gl_under" gradientUnits="userSpaceOnUse" x1="0" y1={fA(split)} x2="0" y2={fA(split + 70)}>
          <stop offset="0" stopColor={OCEAN.sky} stopOpacity="0.8" />
          <stop offset="1" stopColor={OCEAN.sky} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={-20} y={split - 6} width={1120} height={80} fill="url(#gl_under)" />
      {/* a film of water running off the dome above the line: blurred, sea-tinted, uneven */}
      <path d={`${clip.line}L1100 ${fA(split - 46)}L-20 ${fA(split - 38)}Z`} fill={SEA_UP.near} opacity={0.42} style={{ filter: "blur(9px)" }} />
      <path d={clip.line} fill="none" stroke={OCEAN.sky} strokeOpacity={0.5} strokeWidth={9} style={{ filter: "blur(5px)" }} />
      <path d={clip.line} fill="none" stroke="#38524C" strokeOpacity={0.55} strokeWidth={4} transform="translate(0 -2)" />
      <path d={clip.line} fill="none" stroke={OCEAN.sky} strokeOpacity={0.9} strokeWidth={2.2} transform="translate(0 1.5)" />
    </svg>
  );
};
/** FloatingPlatform (oceanShared) as a variant: the same floater, WITHOUT the back column's mooring
 *  (it recedes toward the vanishing point and read as a stray line across the close shots). */
const Floater: React.FC<{ at: P2; frame?: number; heave?: number }> = ({ at, frame = 0, heave = 1 }) => {
  const o = useOcean();
  const uid = `glv2pf${React.useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const M = o.scene.pxPerM;
  const bob = heave * 0.4 * Math.sin(frame / 41);
  const pl = (xm: number, ym: number, zm: number) => platformPoint(o, at, xm, ym + bob, zm);
  const scr = (q: { x: number; y: number; z: number }) => project(o, q.x, q.y, q.z);
  const cols = PLATFORM.columns;
  const drawColumn = (ci: number) => {
    const c = cols[ci];
    const top = scr(pl(c.x, -PLATFORM.freeboard * 0.0, c.z));
    const bot = scr(pl(c.x, PLATFORM.draft, c.z));
    const rx = (c.d / 2) * M * top.a;
    // the surface line at this column's depth: the ceiling meets it there (columns end there)
    const surfY = top.y;
    const id = `${uid}c${ci}`;
    const plateR = (PLATFORM.heavePlateD / 2) * M * bot.a;
    const plateT = PLATFORM.heavePlate * M * bot.a;
    // looking up at the plate: its underside shows as a flat ellipse
    const eyeDy = Math.max(0.05, (o.eye.y - (at.y + PLATFORM.draft * M)) / (depthDistM(o, c.z * M) * M));
    const under = Math.min(0.32, eyeDy);
    const fog = fogAt(o.scene, depthDistM(o, c.z * M));
    // the submerged column fades into the water with depth (local y: the z = 0 plane's mapping)
    const sDepth = o.P / (o.P - c.z * M);
    const colFog = (ly: number) => clamp01(fog + (0.78 - fog) * smoothstep(((ly - o.eye.y * (1 - sDepth)) / sDepth - at.y) / (PLATFORM.draft * M * 1.05)));
    return (
      <InFog key={ci} amount={colFog}>
        <g transform={`matrix(${fB(1 / o.a)} 0 0 ${fB(1 / o.a)} ${fB(-o.bx / o.a)} ${fB(-o.by / o.a)})`}>
          <defs>
            <linearGradient id={`${id}x`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#77756A" />
              <stop offset="0.2" stopColor={OCEAN.steelHi} />
              <stop offset="0.32" stopColor="#E0DCCB" />
              <stop offset="0.55" stopColor={OCEAN.steelMid} />
              <stop offset="0.85" stopColor={OCEAN.steelLo} />
              <stop offset="1" stopColor="#3E3D36" />
            </linearGradient>
            <linearGradient id={`${id}y`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="0.55" stopColor={OCEAN.fouling} stopOpacity="0.25" />
              <stop offset="1" stopColor={OCEAN.fouling} stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={OCEAN.steelHi} />
              <stop offset="0.35" stopColor={OCEAN.steelMid} />
              <stop offset="1" stopColor={OCEAN.steelLo} />
            </linearGradient>
          </defs>
          {/* the column, from the surface down */}
          <rect x={top.x - rx} y={surfY} width={rx * 2} height={bot.y - surfY} fill={`url(#${id}x)`} />
          <rect x={top.x - rx} y={surfY} width={rx * 2} height={bot.y - surfY} fill={`url(#${id}y)`} />
          {/* where it pierces the surface: the surface's bright meniscus round the column */}
          <ellipse cx={top.x} cy={surfY} rx={rx * 1.5} ry={Math.max(3, rx * 0.16)} fill={OCEAN.sky} opacity={0.55} style={{ filter: `blur(${fA(Math.max(2, rx * 0.12))}px)` }} />
          {/* the heave plate: a thin wide disc seen from a little below */}
          <ellipse cx={bot.x} cy={bot.y + plateT} rx={plateR} ry={plateR * under} fill={OCEAN.steelLo} />
          <rect x={bot.x - plateR} y={bot.y} width={plateR * 2} height={plateT} fill={`url(#${id}p)`} />
          <ellipse cx={bot.x} cy={bot.y} rx={plateR} ry={plateR * under * 0.35} fill={OCEAN.steelHi} opacity={0.55} />
          {/* an AO line where the column meets the plate */}
          <ellipse cx={bot.x} cy={bot.y} rx={rx * 1.05} ry={rx * under * 0.5} fill={OCEAN.shadow} opacity={0.35} style={{ filter: `blur(${fA(rx * 0.08)}px)` }} />
        </g>
      </InFog>
    );
  };
  // pontoons between column feet and braces near the surface, as projected bars
  const bar = (a: number, b: number, ym: number, hm: number, key: string, kind: "pontoon" | "brace") => {
    const A = cols[a];
    const B = cols[b];
    const N = 14;
    const ptsT: P2[] = [];
    const ptsB: P2[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const xm = lerp(A.x, B.x, u);
      const zm = lerp(A.z, B.z, u);
      const t = scr(pl(xm, ym - hm / 2, zm));
      const bt = scr(pl(xm, ym + hm / 2, zm));
      ptsT.push({ x: t.x, y: t.y });
      ptsB.push({ x: bt.x, y: bt.y });
    }
    const d = polyA([...ptsT, ...ptsB.reverse()]);
    const zmid = ((A.z + B.z) / 2) * M;
    const fog = fogAt(o.scene, depthDistM(o, zmid));
    const id = `${uid}${key}`;
    const yTop = Math.min(...ptsT.map((p) => p.y));
    const yBot = Math.max(...ptsB.map((p) => p.y));
    return (
      <InFog key={key} amount={fog}>
        <g transform={`matrix(${fB(1 / o.a)} 0 0 ${fB(1 / o.a)} ${fB(-o.bx / o.a)} ${fB(-o.by / o.a)})`}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={yTop} x2="0" y2={yBot}>
              <stop offset="0" stopColor={OCEAN.steelMid} />
              <stop offset="0.18" stopColor={kind === "pontoon" ? "#E0DCCB" : OCEAN.steelHi} />
              <stop offset="0.45" stopColor={OCEAN.steelMid} />
              <stop offset="0.85" stopColor={OCEAN.steelLo} />
              <stop offset="1" stopColor="#3E3D36" />
            </linearGradient>
          </defs>
          <path d={d} fill={`url(#${id})`} />
        </g>
      </InFog>
    );
  };
  // mooring lines: catenaries from each column's foot outward and down into the fog
  const moorings = cols.map((c, ci) => {
    const outX = c.x === 0 ? 0 : Math.sign(c.x);
    const outZ = c.z > 0 ? -0.3 : -1; // outward and away (never toward the eye)
    const len = Math.hypot(outX, outZ) || 1;
    const ux = outX / len;
    const uz = outZ / len;
    const N = 40;
    const pts: { x: number; y: number; s: number; fog: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const r = u * 170; // metres outward
      const drop = (o.scene.seabedY !== undefined ? o.scene.seabedY / M : 80) - PLATFORM.draft - 2;
      const yy = PLATFORM.draft + 2 + drop * (1 - Math.pow(1 - u, 2.2));
      const q = pl(c.x + ux * (c.d / 2 + r), yy, c.z + uz * r);
      const s = scr(q);
      pts.push({ x: s.x, y: s.y, s: s.a / o.root.a, fog: fogAt(o.scene, depthDistM(o, q.z)) });
    }
    return (
      <g key={`m${ci}`} transform={`matrix(${fB(1 / o.a)} 0 0 ${fB(1 / o.a)} ${fB(-o.bx / o.a)} ${fB(-o.by / o.a)})`}>
        {pts.slice(0, -1).map((p, i) => {
          const q = pts[i + 1];
          const w = Math.max(1.3, 3.2 * p.s);
          return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={fogHex(o, "#4C4A42", p.fog, p.y)} strokeWidth={w} strokeLinecap="round" />;
        })}
      </g>
    );
  });
  return (
    <g>
      {drawColumn(2)}
      {bar(0, 2, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p02", "pontoon")}
      {bar(1, 2, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p12", "pontoon")}
      {moorings[0]}
      {moorings[1]}
      {bar(0, 1, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p01", "pontoon")}
      {drawColumn(0)}
      {drawColumn(1)}
    </g>
  );
};
