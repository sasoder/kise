import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  DepthGroup,
  DynamicCable,
  LockBracket,
  OCEAN,
  OceanStage,
  SCENE_BC,
  SIZE_M,
  SonarFan,
  UlyssesVehicle,
  bloomFilter,
  clamp01,
  easeOutCubic,
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
  type OceanView,
} from "../kits/cheeky-pint/oceanShared";
import { CABLE } from "./OceanFrames";
import { SNAG_GHOST, SnaggedGhostLine } from "./GhostLines";
import { ARC_HIT, HOR, MappedTrace, S_C, SNAG, SNAG_ARC, ScanRing, TANGLE, TANGLE_C, TIME0 as TIME0_C, solve as solveC } from "./CableInspection";

/**
 * CutTheLines — Cheeky Pint S4E02 (Will O'Brien, Ulysses), the continuation of CableInspection.
 * 1080x1920, opaque, 24000/1001 fps, 107 frames (91 of content + a 16-frame tail).
 *
 * Check line: after this cut the viewer can say "Ulysses' drone cuts the snagged fishing net free and
 * it drifts off the cable."
 *
 * The motion: it opens on CableInspection's settled end (same world, same snag, the Mako hovering
 * over it, the bracket on the tangle). A belly hatch opens and a compact cutter on a two-link arm
 * unfolds out of the hull while the Mako sinks a little to reach; the camera eases in on the coils.
 * The shear closes on the coils (CONTACT f23, closed f25) and the coils unwind off the cable; the
 * freed net and lines are taken by the current (B's current direction) and drift off downstream and
 * back into the haze. The bracket slides out the way it came; the scan runs on over the now clean
 * stretch and the trace settles to cream. The cutter folds back into the hull; a living hold.
 *
 *   f   | words                              | picture
 *   0   | (we're) building f3                | CableInspection's end state: Mako over the tangle, bracket, fan
 *   3-8 | an implement f6-10                 | the belly hatch swings open
 *   4-22| implement / that will f15-21       | the arm unfolds out of the hull (stowed under it), the Mako sinks
 *       |                                    | ~70 px; the camera eases in on the coils
 *   23  | cut f25                            | CONTACT: the open shear's blades meet the coils; closed by f25
 *   25-31 | the f30                          | the coils unwind off the cable (turn by turn)
 *   26-91 | fishing lines off f43-61         | the freed gear accelerates to the current and drifts off
 *       |                                    | downstream (right / down) and back into the haze
 *   46-58 |                                  | the lock bracket slides out the way it came
 *   58-78 | of the f70-76                    | the scan runs on over the clean stretch; trace settles to cream
 *   70-98 | offshore floating f80-86         | the cutter folds back into the hull, the hatch closes, the Mako
 *       |                                    | rises back; (cut back f91) living hold to f107
 */
export const FPS = 24000 / 1001;
export const DURATION = 107;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// ---- the world: continuous with CableInspection (its f214 is the settled end; 1.5 s of speaker) ----
const SC = SCENE_BC;
const P = SC.focusM * SC.pxPerM;
const C_END = solveC(214);
const TIME0 = TIME0_C + 234; // world clock (snow, current, gear): C's f199 cut-back + 35 frames of speaker
const LEN = CABLE.length;
const cableAtArc = (a: number) => CABLE.at(clamp01(a / LEN));

// ---- camera (cable-plane focus + E, through the house damped follower) ----------------------------
const camFromFocus = (fx: number, fy: number, E: number): Cam => {
  const k = E / S_C;
  return { x: fx, y: fy + (290 * (1 - S_C)) / (k * S_C), k };
};
const E0 = C_END.E;
const FOCUS0 = { x: C_END.cam.x, y: C_END.cam.y - (290 * (1 - S_C)) / (C_END.cam.k * S_C) };
// the vehicle's position against the cable plane at CableInspection's end, relative to the coils
const Q0_REL = (() => {
  const v = C_END.veh;
  const view = makeView({ frame: TIME0_C + 214, cam: C_END.cam, scene: SC, horizon: HOR, sway: { x: 3 * Math.sin((TIME0_C + 214) / 23), y: 5 * Math.sin((TIME0_C + 214) / 19) } });
  const sc = project(view, v.x, v.y, v.z);
  const q = unproject(view, sc.x, sc.y, CABLE.z);
  return { x: q.x - SNAG.x, y: q.y - SNAG.y };
})();
/** the Mako closes in to cut: forward (left) and down, against the cable plane (world px) */
const SHIFT = { x: -5, y: 9 };
const E_CUT = 27; // the cut: shear + coils ~2x CableInspection's size
const COILS_CUT = { x: 470, y: 850 }; // the coils' screen position while the cutter works
const FOCUS_CUT = { x: SNAG.x + (540 - COILS_CUT.x) / E_CUT, y: SNAG.y + (960 - COILS_CUT.y) / E_CUT };
const E_AFTER = 19;
/** the end: the clean cable + the Mako (risen back 60% of its approach) composed round y 880 */
const FOCUS_AFTER = {
  x: SNAG.x + (Q0_REL.x + 0.4 * SHIFT.x) / 2,
  y: SNAG.y + (Q0_REL.y + 0.4 * SHIFT.y) / 2 + (960 - 880) / E_AFTER,
};
const KEYS: { f0: number; f1: number; x: number; y: number; e: number }[] = [
  { f0: 2, f1: 22, x: FOCUS_CUT.x, y: FOCUS_CUT.y, e: E_CUT },
  { f0: 34, f1: 80, x: FOCUS_AFTER.x, y: FOCUS_AFTER.y, e: E_AFTER },
  // the hold: a slow drift in, still moving at the cut-back
  { f0: 80, f1: 150, x: FOCUS_AFTER.x - 0.4, y: FOCUS_AFTER.y, e: E_AFTER * 1.04 },
];
const targetAt = (f: number) => {
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
  return { x, y, le };
};
const TRACK = (() => {
  const out: { x: number; y: number; le: number }[] = [];
  let c = targetAt(-40);
  let v = { x: 0, y: 0, le: 0 };
  for (let f = -40; f <= DURATION + 2; f++) {
    const t = targetAt(f);
    v = {
      x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
      y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
      le: v.le + (t.le - c.le) * CAM_STIFF - v.le * CAM_DAMP,
    };
    c = { x: c.x + v.x, y: c.y + v.y, le: c.le + v.le };
    if (f >= 0) out.push({ ...c });
  }
  return out;
})();
const camAt = (f: number) => {
  const T = TRACK[Math.max(0, Math.min(TRACK.length - 1, Math.floor(f)))];
  const E = Math.exp(T.le);
  return { cam: camFromFocus(T.x, T.y, E), E };
};
const REST = camAt(0).cam;

// ---- the story ----------------------------------------------------------------------------------
const F_HATCH = [3, 8] as const;
const F_DEPLOY = [4, 22] as const;
const F_CONTACT = 23; // the open blades meet the coils
const F_CLOSED = 25; // the shear is shut: the coils are cut
const F_UNWIND = [25, 31] as const;
const F_BRACKET_OUT = [27, 34] as const; // released right after the cut
const F_RESCAN = [58, 78] as const;
const F_STOW = [70, 98] as const;
const F_HATCH_SHUT = [96, 102] as const;
const RESCAN = 11; // world px of clean cable the scan runs on over (toward the touchdown)
/** the vehicle, held the way CableInspection held it: a position against the cable plane (Q) + an
 *  authored screen length, its depth derived from them (so zooming never slides it onto the cable).
 *  It sinks ~70 px on screen to reach, then rises back. */
const V0 = C_END.veh;
const VIEW_C = makeView({ frame: TIME0_C + 214, cam: C_END.cam, scene: SC, horizon: HOR, sway: { x: 3 * Math.sin((TIME0_C + 214) / 23), y: 5 * Math.sin((TIME0_C + 214) / 19) } });
const Q0 = (() => {
  const sc = project(VIEW_C, V0.x, V0.y, V0.z);
  return unproject(VIEW_C, sc.x, sc.y, CABLE.z);
})();
const LPX0 = mappingAt(VIEW_C, V0.z).a * V0.L; // its screen length at CableInspection's end
const shiftAt = (f: number) => {
  const u = smoothstep((f - F_DEPLOY[0]) / (F_DEPLOY[1] - F_DEPLOY[0])) - 0.6 * smoothstep((f - F_STOW[0]) / (F_STOW[1] - F_STOW[0]));
  return { x: SHIFT.x * u, y: SHIFT.y * u };
};
/** screen length: grows a little with the push-in (not fully: it keeps its size against the frame) */
const lpxAt = (E: number) => LPX0 * Math.pow(E / C_END.E, 0.45);
/** the freed gear: accelerates to the current (B's direction) after the cut, drifting off and back */
const CUR = (() => {
  const c = SNAG_GHOST.current;
  const l = Math.hypot(c.x, c.y);
  return { x: c.x / l, y: c.y / l };
})();
const V_CURRENT = 0.42; // world px / frame (~1.7 m/s)
const RECEDE = 0.8; // world px / frame away from the eye (into the haze)
const driftDist = (f: number) => {
  // the integral of v(f) = V * smoothstep((f - 26) / 16)
  let d = 0;
  for (let g = 26; g < f; g++) d += V_CURRENT * smoothstep((g + 0.5 - 26) / 16);
  return d;
};
const scanArcAt = (f: number) => SNAG_ARC + RESCAN * smoothstep((f - F_RESCAN[0]) / (F_RESCAN[1] - F_RESCAN[0]));

// ---- the cutter: a two-link arm with a shear head (vehicle-plane units: rigid with the hull) -------
const L1 = 5.2;
const L2 = 5.0;
const W1 = 0.95;
const W2 = 0.8;
const BLADE = 6.4; // blade length
const HOUSING = 1.8; // the shear's housing, wrist to blade pivot
const MOUNT_X = 0.06; // along the hull (fraction of L, + = toward the nose)
type ArmPose = { m: { x: number; y: number }; e: { x: number; y: number }; h: { x: number; y: number }; dir: number; open: number; out: number };
/** the hull's local frame -> vehicle-plane coords (facing -1: nose left) */
const hullPt = (v: { x: number; y: number; tilt: number }, lx: number, ly: number) => {
  const c = Math.cos(v.tilt);
  const s = Math.sin(v.tilt);
  return { x: v.x - (lx * c - ly * s), y: v.y + lx * s + ly * c };
};
/** two-link IK in the vehicle plane: elbow on the tail side (up/back) */
const ik = (m: { x: number; y: number }, t: { x: number; y: number }) => {
  const dx = t.x - m.x;
  const dy = t.y - m.y;
  const d = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const a = Math.acos(clamp01((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  // the elbow toward +x (the tail, the vehicle faces left)
  const th1a = base + a;
  const th1b = base - a;
  const ea = { x: m.x + L1 * Math.cos(th1a), y: m.y + L1 * Math.sin(th1a) };
  const eb = { x: m.x + L1 * Math.cos(th1b), y: m.y + L1 * Math.sin(th1b) };
  // the elbow below the reach line, toward the tail: down-and-back, never up past the hull
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

type Solved = {
  view: OceanView;
  cam: Cam;
  E: number;
  veh: { x: number; y: number; z: number; tilt: number };
  emitter: { x: number; y: number };
  arm: ArmPose;
  coilScr: { x: number; y: number };
  scanArc: number;
  scanScr: { x: number; y: number };
};
const solve = (f: number): Solved => {
  const { cam, E } = camAt(f);
  const fr = TIME0 + f;
  const view = makeView({ frame: fr, cam, scene: SC, horizon: HOR, sway: { x: 3 * Math.sin(fr / 23), y: 5 * Math.sin(fr / 19) } });
  const Lpx = lpxAt(E);
  const sV = Lpx / (V0.L * cam.k);
  const zv = P - P / sV;
  const sh = shiftAt(f);
  const qs = project(view, Q0.x + sh.x, Q0.y + sh.y, CABLE.z);
  const vw = unproject(view, qs.x, qs.y, zv);
  const v = { x: vw.x, y: vw.y, z: zv, tilt: V0.tilt };
  const g = vehicleGeometry({ x: v.x, y: v.y, L: V0.L, facing: -1, tilt: v.tilt });
  const D = V0.L * MAKO.D;
  const m = hullPt(v, MOUNT_X * V0.L, D * 0.1);
  // the coils on screen, carried into the vehicle's plane (where the arm is drawn)
  const coilScr = project(view, SNAG.x, SNAG.y, CABLE.z);
  const coil = unproject(view, coilScr.x, coilScr.y, v.z);
  // the head has its own wrist: at the cut it lies ALONG the cable (pointing to the nose side, its tip
  // a touch down into the coils) so the shear slits the wraps on the cable's top instead of crossing it
  const cableDir = Math.atan2(SNAG.ty, SNAG.tx) + 0.12;
  // reach: the wrist placed so the coils sit at mid-blade, the fixed blade's edge on the coils' top
  const lift = 1.2 * smoothstep((f - 28) / 12);
  const back = BLADE * 0.5 + HOUSING;
  const tgt = { x: coil.x - Math.cos(cableDir) * back, y: coil.y - Math.sin(cableDir) * back + 0.55 - lift };
  const pose = ik(m, tgt);
  // stowed: link 1 flat along the belly toward the tail, link 2 folded back toward the nose (under the hull)
  const axis = -v.tilt; // the hull axis toward the tail (facing -1)
  const stow = { th1: axis, th2: axis + Math.PI };
  const out = smoothstep((f - F_DEPLOY[0]) / (F_DEPLOY[1] - F_DEPLOY[0])) * (1 - smoothstep((f - F_STOW[0]) / (F_STOW[1] - F_STOW[0])));
  const th1 = angLerp(stow.th1, pose.th1, out);
  const th2 = angLerp(stow.th2, pose.th2, easeOutCubic(out));
  const e = { x: m.x + L1 * Math.cos(th1), y: m.y + L1 * Math.sin(th1) };
  const h = { x: e.x + L2 * Math.cos(th2), y: e.y + L2 * Math.sin(th2) };
  // the head: in line with link 2 while stowed / unfolding, turning to the cable's line as it arrives
  const headDir = angLerp(th2, cableDir, smoothstep((f - 12) / 9) * (1 - smoothstep((f - F_STOW[0]) / 14)));
  // the shear: open on the approach, shut at the cut, part-open to let go, shut to stow
  const open =
    0.75 * smoothstep((f - 12) / 8) * (1 - smoothstep((f - F_CONTACT) / (F_CLOSED - F_CONTACT))) +
    0.45 * smoothstep((f - 32) / 6) * (1 - smoothstep((f - 64) / 8));
  const sa = scanArcAt(f);
  const sp = cableAtArc(sa);
  const ss = project(view, sp.x, sp.y, CABLE.z);
  return { view, cam, E, veh: v, emitter: g.emitter, arm: { m, e, h, dir: headDir, open, out }, coilScr, scanArc: sa, scanScr: { x: ss.x, y: ss.y } };
};
export const debugSolve = solve;

// ---- drawing ------------------------------------------------------------------------------------
const seg = (a: { x: number; y: number }, b: { x: number; y: number }) => `M${a.x.toFixed(4)} ${a.y.toFixed(4)}L${b.x.toFixed(4)} ${b.y.toFixed(4)}`;
/** the cutter arm + shear head, in the vehicle plane; drawn BEFORE the hull (it folds out from under it) */
const Cutter: React.FC<{ pose: ArmPose }> = ({ pose }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const { m, e, h, dir, open } = pose;
  const link = (a: { x: number; y: number }, b: { x: number; y: number }, w: number) => (
    <g strokeLinecap="round">
      <path d={seg(a, b)} stroke={OCEAN.hullDeep} strokeWidth={w} />
      <path d={seg(a, b)} stroke={OCEAN.hullMid} strokeWidth={w * 0.72} />
      <path d={seg({ x: a.x, y: a.y - w * 0.22 }, { x: b.x, y: b.y - w * 0.22 })} stroke={OCEAN.hullHi} strokeOpacity={0.7} strokeWidth={Math.max(w * 0.12, 1.4 * px)} />
    </g>
  );
  // the shear head: a housing on the wrist, then a fixed hooked blade + a moving jaw about its pivot
  const c0 = Math.cos(dir);
  const s0 = Math.sin(dir);
  const pv = { x: h.x + c0 * HOUSING, y: h.y + s0 * HOUSING };
  const blade = (ang: number, hook: number) => {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const n = { x: -s * hook, y: c * hook };
    const kw = BLADE / 4.4; // blade width scales with its length
    const at = (u: number, w: number) => ({ x: pv.x + c * BLADE * u + n.x * w * kw, y: pv.y + s * BLADE * u + n.y * w * kw });
    // spine (outside), a curved cutting edge (inside), a hooked tip turning in
    const pts = [at(-0.12, 0.42), at(0.55, 0.4), at(0.92, 0.22), at(1.0, -0.05), at(0.9, -0.3), at(0.84, -0.06), at(0.5, -0.02), at(-0.12, -0.12)];
    return `M${pts.map((p) => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join("L")}Z`;
  };
  const hw = 1.0;
  const housing = [
    { x: h.x - s0 * hw, y: h.y + c0 * hw },
    { x: pv.x - s0 * hw * 0.8, y: pv.y + c0 * hw * 0.8 },
    { x: pv.x + s0 * hw * 0.8, y: pv.y - c0 * hw * 0.8 },
    { x: h.x + s0 * hw, y: h.y - c0 * hw },
  ];
  return (
    <g>
      {link(m, e, W1)}
      {link(e, h, W2)}
      {/* the shear: moving jaw (behind), housing, fixed hooked blade (front): steel with a cream edge */}
      <path d={blade(dir + open, -1)} fill={OCEAN.steelHi} stroke={OCEAN.hullDeep} strokeWidth={1.6 * px} strokeLinejoin="round" />
      <path d={`M${housing.map((p) => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join("L")}Z`} fill={OCEAN.hullMid} stroke={OCEAN.hullDeep} strokeWidth={1.2 * px} strokeLinejoin="round" />
      <path d={blade(dir, 1)} fill="#E0DCCB" stroke={OCEAN.hullDeep} strokeWidth={1.6 * px} strokeLinejoin="round" />
      <circle cx={pv.x} cy={pv.y} r={0.22} fill={OCEAN.steelLo} />
      {/* joints: elbow, wrist housing (with its amber status light), shoulder */}
      <circle cx={e.x} cy={e.y} r={W1 * 0.62} fill={OCEAN.hullLo} stroke={OCEAN.hullHi} strokeOpacity={0.5} strokeWidth={1.2 * px} />
      <circle cx={h.x} cy={h.y} r={W2 * 0.8} fill={OCEAN.hullMid} stroke={OCEAN.hullDeep} strokeWidth={1.2 * px} />
      <g style={{ filter: bloomFilter(o.a) }}>
        <circle cx={h.x + c0 * HOUSING * 0.5} cy={h.y + s0 * HOUSING * 0.5} r={0.17} fill={OCEAN.amberTop} />
      </g>
      <circle cx={m.x} cy={m.y} r={W1 * 0.55} fill={OCEAN.hullDeep} />
    </g>
  );
};
/** the gear's monofilament and twine, drawn 2 screen px heavier (a dilate on the group) so the freed net
 *  and lines stay readable at phone size while they drift off */
const Heavier: React.FC<{ id: string; children?: React.ReactNode }> = ({ id, children }) => {
  const o = useOcean();
  return (
    <g>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology operator="dilate" radius={(1 / o.a).toFixed(5)} />
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

const FAN_REACH = 1.16;
const World: React.FC<{ f: number; S: Solved }> = ({ f, S }) => {
  const t = TIME0 + f;
  // the gear: cut at F_CLOSED, unwinds, then drifts on the current and back into the haze
  const wrap = 1 - smoothstep((f - F_UNWIND[0]) / (F_UNWIND[1] - F_UNWIND[0]));
  const dd = driftDist(f);
  const gz = CABLE.z - RECEDE * Math.max(0, dd / V_CURRENT);
  const anchor = { x: SNAG.x + CUR.x * dd, y: SNAG.y + CUR.y * dd };
  const cw = SIZE_M.cable * SC.pxPerM;
  const bracket = 1 - clamp01((f - F_BRACKET_OUT[0]) / (F_BRACKET_OUT[1] - F_BRACKET_OUT[0]));
  // the fan: on the tangle (as CableInspection left it), onto the coils for the cut, then the scan point
  const tc = project(S.view, TANGLE_C.x, TANGLE_C.y, CABLE.z);
  const startAim = { x: lerp(S.coilScr.x, tc.x, 0.8), y: lerp(S.coilScr.y, tc.y, 0.8) };
  const toCoils = smoothstep((f - 6) / 14);
  const toScan = smoothstep((f - 50) / 16);
  const aimX = lerp(lerp(startAim.x, S.coilScr.x, toCoils), S.scanScr.x, toScan);
  const aimY = lerp(lerp(startAim.y, S.coilScr.y, toCoils), S.scanScr.y, toScan);
  const tgt = unproject(S.view, aimX, aimY, S.veh.z);
  const dx = tgt.x - S.emitter.x;
  const dy = tgt.y - S.emitter.y;
  const spread = lerp(0.78, 0.5, Math.max(toCoils * 0.6, toScan));
  const hatch = smoothstep((f - F_HATCH[0]) / (F_HATCH[1] - F_HATCH[0])) * (1 - smoothstep((f - F_HATCH_SHUT[0]) / (F_HATCH_SHUT[1] - F_HATCH_SHUT[0])));
  return (
    <>
      <DepthGroup z={CABLE.z}>
        {gz >= CABLE.z - 0.001 ? (
          <Heavier id="gearBack">
            <SnaggedGhostLine frame={t} layer="back" wrap={wrap} anchor={anchor} cableW={cw} />
          </Heavier>
        ) : null}
        <DynamicCable cable={CABLE} />
        <MappedTrace from={ARC_HIT} to={S.scanArc} hotFrom={scanArcAt(f - 6)} />
        <ScanRing arc={S.scanArc} on={1} />
      </DepthGroup>
      {/* the gear in front of the cable; once free it recedes in depth (its own group) */}
      <DepthGroup z={gz}>
        <Heavier id="gearFront">
          <SnaggedGhostLine frame={t} layer="front" wrap={wrap} anchor={anchor} cableW={cw} />
        </Heavier>
      </DepthGroup>
      <DepthGroup z={CABLE.z}>
        <LockBracket x={TANGLE_C.x} y={TANGLE_C.y} w={TANGLE.w} h={TANGLE.h} t={bracket} />
      </DepthGroup>
      <DepthGroup z={S.veh.z}>
        <SonarFan x={S.emitter.x} y={S.emitter.y} angle={Math.atan2(dy, dx)} spread={spread} range={Math.hypot(dx, dy) * FAN_REACH} sweep={0.5 + 0.38 * Math.sin(t / 8)} strength={1} />
        {/* stowed (out 0) the cutter is inside the hull */}
        {S.arm.out > 0.001 ? <Cutter pose={S.arm} /> : null}
        <UlyssesVehicle x={S.veh.x} y={S.veh.y} L={V0.L} facing={-1} tilt={S.veh.tilt} frame={t} light={1} />
        <Hatch v={S.veh} open={hatch} />
      </DepthGroup>
    </>
  );
};

const CutTheLines: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const S = solve(f);
  return (
    <AbsoluteFill style={{ backgroundColor: "#30494A" }}>
      <OceanStage frame={TIME0 + f} cam={S.cam} scene={SC} horizon={HOR} rest={REST} sway>
        <World f={f} S={S} />
      </OceanStage>
    </AbsoluteFill>
  );
};
export default CutTheLines;
