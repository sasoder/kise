import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  DepthGroup,
  DynamicCable,
  LockBracket,
  MAKO,
  OCEAN,
  OceanStage,
  SCENE_BC,
  SIZE_M,
  SonarFan,
  UlyssesVehicle,
  bloomFilter,
  clamp01,
  easeOutCubic,
  ghostStrand,
  hash01,
  lerp,
  makeView,
  project,
  smoothstep,
  unproject,
  useOcean,
  vehicleGeometry,
  type Cam,
  type OceanView,
} from "../kits/cheeky-pint/oceanShared";
import { CABLE } from "./OceanFrames";
import { SNAG_GHOST, SNAG_GHOST_2, SNAG_GHOST_3, SnaggedGhostLine } from "./GhostLines";
import { HOR, S_C, SNAG, SNAG_ARC, TIME0, cableAtArc } from "./CableInspection";

/**
 * CableInspectionV2 — Cheeky Pint S4E02 (Will O'Brien, Ulysses), cut C, V2 (round 2 of the cold review).
 * Same slot, words, world and snag as CableInspection (V1, delivered and untouched; this file imports
 * only its shared constants). 1080x1920, opaque, 24000/1001 fps, 215 frames (199 + a 16-frame tail).
 *
 * Check line: after this cut the viewer can say "Ulysses' vehicle runs along the cable every day,
 * scanning it end to end, and flags the spot where fishing line has snagged."
 *
 * Round 2 (on top of round 1's steady roll: the camera rolls with the cable so it stays a calm line):
 *  1. The scan has a verdict: cable not yet scanned is dull and fouled (darker, marine growth); behind
 *     the scan head it is left a clean, calm, glowing cream "checked" trail (no ruler ticks). At the
 *     snag the trail stops and the amber lock takes over.
 *  2. The drone travels: it glides nose-first and slowly overtakes the camera through the opening,
 *     with a bubble wake off its thruster, a gentle bob, and particulate in the water streaming past
 *     (world particles at three depths, rolled with the world). Beam on by "vehicle" (f35, short of
 *     the cable), scanning from "map" (lands on the cable ~f58).
 *  3. The snag is always there, dim in the dark ahead (fogged), and is LIT by the beam ~f170-178
 *     (never faded in). Lock closes on "lines" (f181), settled by "caught" (f185), the bracket fitted
 *     to the tangle's core (the coils + the net), not the loose strand ends.
 *  4. ~1.5x: cable ~60 px, Mako ~800 px; the action around the middle (cable y ~980, Mako above);
 *     a push-in on the snag for the last second. Must-read marks stay out of y 1080-1460.
 *
 *   f   | words                          | picture
 *   0-56| system like a surface          | the Mako glides in over the dull cable, overtaking the camera;
 *       | underwater vehicle             | wake, bob, particles streaming back; beam on at f35 (short)
 *   54-58 | map these cables             | the beam reaches the cable: the clean cream trail starts
 *   58-160 | on a daily basis … condition | cruise: fouled cable ahead, clean glowing trail behind
 *   160-178 | and also if they're getting | eases in; the beam sweeps onto the dim snag ahead and lights it
 *   174-185 | lines caught                 | the bracket slides in, closed f181, settled f185
 *   185-199 | on them                      | push-in, the snarl fills the centre (cut back f199)
 */
export const FPS = 24000 / 1001;
export const DURATION = 215;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SC = SCENE_BC;
const P = SC.focusM * SC.pxPerM;
const VEH_L = 20;
const CW = SIZE_M.cable * SC.pxPerM; // the cable's world width

// ---- the snag's core box (the coils + the net), from B's exported gear ---------------------------
const CORE = (() => {
  const A = { x: SNAG.x, y: SNAG.y };
  const tan = { x: SNAG.tx, y: SNAG.ty };
  const nrm = { x: SNAG.nx, y: SNAG.ny };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const pts: { x: number; y: number }[] = [];
  const add = (x: number, y: number) => {
    pts.push({ x, y });
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (const along of [0, SNAG_GHOST_2.along, SNAG_GHOST_3.along]) {
    const a = { x: A.x + tan.x * along, y: A.y + tan.y * along };
    for (const k of [-1.6, 1.6]) for (const m of [-0.7, 0.7]) add(a.x + tan.x * k * CW + nrm.x * m * CW, a.y + tan.y * k * CW + nrm.y * m * CW);
  }
  for (let f = 170; f <= 215; f += 5) {
    const main = { ...SNAG_GHOST, anchor: A, tangent: tan, cableW: CW, wrap: 1, frame: TIME0 + f };
    const pts = ghostStrand(main, 0);
    const idx = Math.round(SNAG_GHOST.netAt * (pts.length - 1));
    // the main strand from the coils down to the net
    pts.slice(0, idx + 1).forEach((q) => add(q.x, q.y));
    if (SNAG_GHOST.net) {
      const hook = pts[idx];
      const pa = pts[Math.max(0, idx - 4)];
      const pb = pts[Math.min(pts.length - 1, idx + 4)];
      let ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      if (Math.cos(ang) < 0) ang += Math.PI;
      const ax = { x: Math.cos(ang), y: Math.sin(ang) };
      const { w, h } = SNAG_GHOST.net;
      for (const u of [-0.5, 0.5]) add(hook.x + ax.x * u * w, hook.y + ax.y * u * w);
      for (const u of [-0.29, 0.29]) add(hook.x + ax.x * u * w + w * 0.18, hook.y + ax.y * u * w + h * 0.95);
    }
  }
  const pad = 1.2;
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad, pts };
})();
/** the core's box as seen on the ROLLED screen (the bracket stays upright): the AABB of the core's points
 *  turned by the roll about its centre; returns the box centre offset (in that upright frame) + size */
const coreBoxUpright = (roll: number) => {
  const c = Math.cos(roll);
  const sn = Math.sin(roll);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of CORE.pts) {
    const dx = p.x - CORE.x;
    const dy = p.y - CORE.y;
    const rx = dx * c - dy * sn;
    const ry = dx * sn + dy * c;
    x0 = Math.min(x0, rx);
    y0 = Math.min(y0, ry);
    x1 = Math.max(x1, rx);
    y1 = Math.max(y1, ry);
  }
  return { ox: (x0 + x1) / 2, oy: (y0 + y1) / 2, w: x1 - x0 + 2.4, h: y1 - y0 + 2.4 };
};

// ---- the run along the cable (arc length, world px) ----------------------------------------------
const F_DEC0 = 152;
const F_DEC1 = 174;
const speedShape = (f: number) => 1 - smoothstep((f - F_DEC0) / (F_DEC1 - F_DEC0));
const V = 1.85; // cruise (world px / frame): ~43 px/f at the cruise zoom
const ARC_HOVER = SNAG_ARC - 5;
const ARC_V: number[] = (() => {
  const n = 260;
  const cum = [0];
  for (let f = 1; f <= n; f++) cum.push(cum[f - 1] + (V * (speedShape(f - 1) + speedShape(f))) / 2);
  const off = ARC_HOVER - cum[F_DEC1];
  return cum.map((c) => c + off);
})();
const vehicleArc = (f: number) => {
  if (f < 0) return ARC_V[0] + V * speedShape(0) * f;
  const i = Math.min(ARC_V.length - 2, Math.floor(f));
  return lerp(ARC_V[i], ARC_V[i + 1], f - i);
};
const chordAt = (a: number, l: number) => {
  const p0 = cableAtArc(a - l / 2);
  const p1 = cableAtArc(a + l / 2);
  let tx = p1.x - p0.x;
  let ty = p1.y - p0.y;
  const tl = Math.hypot(tx, ty) || 1;
  tx /= tl;
  ty /= tl;
  let nx = ty;
  let ny = -tx;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { tx, ty, nx, ny };
};

// ---- the camera: focus, zoom and roll through the house damped follower --------------------------
const E_CRUISE = 23;
/** the reveal: the camera eases back as the snag comes in (its core ~32 world px tall in y ~500-960) */
const E_REVEAL = 12.6;
const E_FINAL = 13.6; // then a push-in for the last second
const E_KEYS = [
  { f0: 146, f1: 192, e: E_REVEAL },
  { f0: 181, f1: 214, e: E_FINAL },
];
const lnE = (f: number) => {
  let le = Math.log(E_CRUISE);
  let prev = E_CRUISE;
  for (const k of E_KEYS) {
    le += (Math.log(k.e) - Math.log(prev)) * smoothstep((f - k.f0) / (k.f1 - k.f0));
    prev = k.e;
  }
  return le;
};
/** the cable's screen y under the Mako (after the roll): low in the cruise, raised before the snag comes
 *  in so its net enters with the cable instead of hanging into the bottom of the frame */
const cableYAt = (f: number) => lerp(980, 720, smoothstep((f - 96) / 44));
const LAG_F = CAM_DAMP / CAM_STIFF;
/** the entrance: the camera starts at rest and accelerates into the follow over F_ENTER frames while the
 *  Mako cruises in from off the right edge, crossing the frame, alongside by ~f35-40 */
const F_ENTER = 40;
const LEAD = -1; // the camera a touch behind the Mako at cruise (it leads slightly)
const ARC0 = () => vehicleArc(0);
const camArc = (f: number) => {
  const A0 = ARC0() + (V * F_ENTER) / 2 + V * LAG_F + LEAD;
  if (f <= 0) return A0;
  if (f <= F_ENTER) {
    const u = f / F_ENTER;
    return A0 + V * F_ENTER * (u * u * u - (u * u * u * u) / 2);
  }
  return vehicleArc(f) + V * speedShape(f) * LAG_F + LEAD;
};
/** at the snag the roll settles to a fixed counter-clockwise tilt: the cable beyond the snag runs down to
 *  the lower left (filling the bottom of the frame), the Mako faces down onto the snag; the bracket is
 *  drawn upright on the rolled screen */
const END_ROLL = -0.42;
const headingAt = (a: number) => {
  const ch = chordAt(a, 30);
  let h = Math.atan2(ch.ty, ch.tx);
  if (h < 0) h += 2 * Math.PI;
  return h;
};
/** the end: the snarl's core centred at (540, 730) */
const Y_CORE_END = 700;
const targetAt = (f: number) => {
  const le = lnE(f);
  const E = Math.exp(le);
  const a = camArc(f);
  const c = cableAtArc(a);
  const ch = chordAt(a, 30);
  const cy = cableYAt(f);
  const cruise = { x: c.x - (ch.nx * (960 - cy)) / E, y: c.y - (ch.ny * (960 - cy)) / E };
  // the end focus: the core's centre at (540, Y_CORE_END) on the rolled screen
  const dyR = (960 - Y_CORE_END) / E;
  const end = { x: CORE.x + Math.sin(END_ROLL) * dyR, y: CORE.y + Math.cos(END_ROLL) * dyR };
  const w = smoothstep((f - 146) / 44);
  // the roll follows the cable where the camera looks (in the opening: the stretch the Mako is entering over)
  const follow = 0.85 * (Math.PI - headingAt(Math.min(a, vehicleArc(f) + 12)));
  const roll = lerp(follow, END_ROLL, smoothstep((f - 144) / 50));
  return { x: lerp(cruise.x, end.x, w), y: lerp(cruise.y, end.y, w), le, roll };
};
const PRE = 60;
const TRACK = (() => {
  const out: { x: number; y: number; le: number; roll: number }[] = [];
  let c = targetAt(-PRE);
  let v = { x: 0, y: 0, le: 0, roll: 0 };
  for (let f = -PRE; f <= DURATION + 2; f++) {
    const t = targetAt(f);
    v = {
      x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
      y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
      le: v.le + (t.le - c.le) * CAM_STIFF - v.le * CAM_DAMP,
      roll: v.roll + (t.roll - c.roll) * CAM_STIFF - v.roll * CAM_DAMP,
    };
    c = { x: c.x + v.x, y: c.y + v.y, le: c.le + v.le, roll: c.roll + v.roll };
    if (f >= -40) out.push({ ...c });
  }
  return out;
})();
const camAt = (f: number) => {
  const T = TRACK[Math.max(0, Math.min(TRACK.length - 1, Math.floor(f) + 40))];
  const E = Math.exp(T.le);
  const k = E / S_C;
  return { cam: { x: T.x, y: T.y + (290 * (1 - S_C)) / (k * S_C), k } as Cam, E, roll: T.roll };
};
const REST = camAt(0).cam;

// ---- the vehicle, the beam, the scan ---------------------------------------------------------------
const vehLenPx = (f: number) => lerp(800, 560, smoothstep((f - 146) / 44));
const gapAt = (f: number) => lerp(250, 215, smoothstep((f - 146) / 44)) + 6 * Math.sin(f / 17); // + a gentle bob
const pitchAt = (f: number) => 0.12 * smoothstep((f - 162) / 22) + 0.025 * Math.sin(f / 23);
const FAN_REACH = 1.16;
/** the beam: on at "vehicle" (f33-41) at a short reach that stops in the water; out to the cable at "map" */
const fanStrength = (f: number) => 0.44 * smoothstep((f - 33) / 8) + 0.56 * smoothstep((f - 53) / 8);
const F_HIT = (() => {
  for (let f = 50; f <= 70; f += 0.05) if (easeOutCubic(fanStrength(f)) * FAN_REACH >= 1) return f;
  return 61;
})();
const F_LOCK0 = 171; // the bracket slides in from off-frame over 10 frames
const F_LOCK1 = 181;
const F_LIT0 = 170;
const F_LIT1 = 178;
const scanArc = (f: number, E: number, Lpx: number) => {
  const cruise = vehicleArc(f) + (0.36 * Lpx + 30) / E;
  return lerp(cruise, SNAG_ARC, smoothstep((f - 156) / 18));
};
const scanArcAt = (f: number) => scanArc(f, camAt(f).E, vehLenPx(f));
const ARC_HIT = scanArcAt(F_HIT);

type VState = { x: number; y: number; z: number; tilt: number };
type Solved = { view: OceanView; cam: Cam; E: number; roll: number; veh: VState; emitter: { x: number; y: number }; scanArc: number; scanScr: { x: number; y: number } };
const solve = (f: number): Solved => {
  const { cam, E, roll } = camAt(f);
  const fr = TIME0 + f;
  const view = makeView({ frame: fr, cam, scene: SC, horizon: HOR, sway: { x: 3 * Math.sin(fr / 23), y: 5 * Math.sin(fr / 19) } });
  const Lpx = vehLenPx(f);
  const zv = P - P / (Lpx / (VEH_L * cam.k));
  const av = vehicleArc(f);
  const ch = chordAt(av, Lpx / E);
  const c = cableAtArc(av);
  const cs = project(view, c.x, c.y, CABLE.z);
  const gap = gapAt(f);
  const vw = unproject(view, cs.x + ch.nx * gap, cs.y + ch.ny * gap, zv);
  let heading = Math.atan2(ch.ty, ch.tx);
  if (heading < 0) heading += 2 * Math.PI;
  // at the snag the camera holds a fixed tilt (END_ROLL); the Mako stays near level on screen
  const tilt = Math.PI - heading + pitchAt(f) + roll * smoothstep((f - 144) / 50);
  const g = vehicleGeometry({ x: vw.x, y: vw.y, L: VEH_L, facing: -1, tilt });
  const sa = scanArc(f, E, Lpx);
  const sp = cableAtArc(sa);
  const ss = project(view, sp.x, sp.y, CABLE.z);
  return { view, cam, E, roll, veh: { x: vw.x, y: vw.y, z: zv, tilt }, emitter: g.emitter, scanArc: sa, scanScr: { x: ss.x, y: ss.y } };
};
export const debugSolveV2 = solve;
export const DEBUG_V2 = { CORE, E_FINAL, F_HIT, ARC_HIT };
export const scanArcDebug = (f: number) => scanArcAt(f);

// ---- drawing --------------------------------------------------------------------------------------
const pathAlong = (a0: number, a1: number, step: number, off = 0) => {
  const n = Math.max(1, Math.ceil((a1 - a0) / step));
  let d = "";
  for (let i = 0; i <= n; i++) {
    const p = cableAtArc(a0 + ((a1 - a0) * i) / n);
    d += `${i ? "L" : "M"}${(p.x + p.nx * off).toFixed(3)} ${(p.y + p.ny * off).toFixed(3)}`;
  }
  return d;
};
/** stretches of cable between the buoyancy modules (the grime and the trail skip the modules) */
const bareSpans = (a0: number, a1: number) => {
  const half = (SIZE_M.collar * SC.pxPerM * 1.05) / 2 + 0.6;
  const cuts = CABLE.collarS.map((s) => s * CABLE.length).filter((c) => c + half > a0 && c - half < a1);
  const spans: [number, number][] = [];
  let s = a0;
  for (const c of cuts) {
    if (c - half > s) spans.push([s, Math.min(a1, c - half)]);
    s = Math.max(s, c + half);
  }
  if (s < a1) spans.push([s, a1]);
  return spans;
};
/** unscanned cable: dull and fouled (a darker skin + marine growth), fixed to the cable */
const Fouling: React.FC<{ spans: [number, number][] }> = ({ spans }) => {
  const o = useOcean();
  const step = Math.max(0.5, 4 / o.a);
  const spots: React.ReactNode[] = [];
  for (const [a0, a1] of spans) {
    for (let k = Math.ceil(a0 / 0.9); k * 0.9 < a1; k++) {
      const a = k * 0.9;
      const h = k * 1.37 + 9;
      if (hash01(h) < 0.35) continue;
      const p = cableAtArc(a);
      const side = (hash01(h + 1) - 0.5) * 0.7 * CW;
      const r = CW * (0.1 + 0.16 * hash01(h + 2));
      spots.push(
        <ellipse
          key={k}
          cx={p.x + p.nx * side}
          cy={p.y + p.ny * side}
          rx={r * 1.5}
          ry={r}
          transform={`rotate(${((Math.atan2(p.ty, p.tx) * 180) / Math.PI).toFixed(2)} ${(p.x + p.nx * side).toFixed(3)} ${(p.y + p.ny * side).toFixed(3)})`}
          fill={hash01(h + 3) < 0.5 ? "#5E5B42" : "#3E3A2A"}
          opacity={0.45}
        />,
      );
    }
  }
  return (
    <g fill="none" strokeLinecap="round">
      {spans.map(([a0, a1], i) => (
        <path key={i} d={pathAlong(a0, a1, step)} stroke="#272519" strokeOpacity={0.22} strokeWidth={CW * 1.02} />
      ))}
      {spots}
    </g>
  );
};
/** the inspection rhythm: the cable in sections between the buoyancy modules (the bare stretch before
 *  them in sections of the same length). While the ring runs along a section it writes a thin amber line
 *  along its top; when the ring leaves it, the section is CHECKED: the line settles to cream with a soft
 *  cream edge-light along that section, and stays (no pulse, no flash). The cable itself is untouched. */
const SECTION_BOUNDS = (() => {
  const mods = CABLE.collarS.map((s0) => s0 * CABLE.length);
  const pitch = mods[1] - mods[0];
  const out: number[] = [];
  for (let a = mods[0] - pitch * 8; a < mods[0]; a += pitch) out.push(a);
  return [...out, ...mods];
})();
const SectionChecks: React.FC<{ from: number; ring: number; ringAt: (f: number) => number; f: number }> = ({ from, ring, ringAt, f }) => {
  const o = useOcean();
  if (ring - from < 0.05) return null;
  const px = 1 / o.a;
  const step = Math.max(0.5, 4 * px);
  const half = (SIZE_M.collar * SC.pxPerM * 1.05) / 2 + 0.4;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < SECTION_BOUNDS.length - 1; i++) {
    const b0 = SECTION_BOUNDS[i];
    const b1 = SECTION_BOUNDS[i + 1];
    const isMod0 = CABLE.collarS.some((c) => Math.abs(c * CABLE.length - b0) < 0.01);
    const isMod1 = CABLE.collarS.some((c) => Math.abs(c * CABLE.length - b1) < 0.01);
    const s0 = Math.max(from, b0 + (isMod0 ? half : 0));
    const s1 = b1 - (isMod1 ? half : 0);
    if (s1 <= s0 || ring <= s0) continue;
    const done = ring >= b1;
    // the frame the ring left this section: the check settles in over 6 frames from then
    let fc = f;
    if (done) {
      let lo = 0;
      let hi = f;
      for (let it = 0; it < 18; it++) {
        const mid = (lo + hi) / 2;
        if (ringAt(mid) >= b1) hi = mid;
        else lo = mid;
      }
      fc = hi;
    }
    const k = done ? smoothstep((f - fc) / 6) : 0;
    const e1 = Math.min(s1, ring);
    els.push(
      <g key={i}>
        <path d={pathAlong(s0, e1, step, CW * 0.36)} stroke={OCEAN.cream} strokeOpacity={0.22 * k} strokeWidth={20 * px} style={{ filter: `blur(${(6 * px).toFixed(3)}px)` }} />
        <path d={pathAlong(s0, e1, step, CW * 0.36)} stroke={OCEAN.cream} strokeOpacity={0.6 * k} strokeWidth={9 * px} />
        {k < 0.999 ? (
          <g style={{ filter: bloomFilter(o.a) }} opacity={1 - k}>
            <path d={pathAlong(s0, e1, step, CW * 0.36)} stroke={OCEAN.amberTop} strokeWidth={9.5 * px} />
          </g>
        ) : null}
      </g>,
    );
  }
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {els}
    </g>
  );
};
/** the verdict: each buoyancy module the ring passes is CHECKED: a cream edge-light comes up round it over
 *  ~8 frames and stays (no pulse, no flash). The snag, later, is the break in this rhythm. */
const ModuleChecks: React.FC<{ ringAt: (f: number) => number; f: number; ring: number }> = ({ ringAt, f, ring }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const D = Math.max(SIZE_M.collar * SC.pxPerM, 24 / o.a);
  const L = D * 1.05;
  const els: React.ReactNode[] = [];
  CABLE.collarS.forEach((cs0, i) => {
    const a = cs0 * CABLE.length;
    if (ring < a || a > SNAG_ARC) return;
    let lo = 0;
    let hi = f;
    for (let it = 0; it < 18; it++) {
      const mid = (lo + hi) / 2;
      if (ringAt(mid) >= a) hi = mid;
      else lo = mid;
    }
    const k = smoothstep((f - hi) / 8);
    if (k <= 0.001) return;
    const p = cableAtArc(a);
    const ang = (Math.atan2(p.ty, p.tx) * 180) / Math.PI;
    els.push(
      <g key={i} transform={`translate(${p.x.toFixed(4)} ${p.y.toFixed(4)}) rotate(${ang.toFixed(4)})`}>
        <rect x={-L / 2} y={-D / 2} width={L} height={D} rx={D * 0.12} fill="none" stroke={OCEAN.cream} strokeOpacity={0.55 * k} strokeWidth={26 * px} style={{ filter: `blur(${(7 * px).toFixed(3)}px)` }} />
        <rect x={-L / 2} y={-D / 2} width={L} height={D} rx={D * 0.12} fill="none" stroke={OCEAN.cream} strokeOpacity={k} strokeWidth={8 * px} />
      </g>,
    );
  });
  return <g>{els}</g>;
};
/** heavier cords: a 1.2 px dilate on the gear group so the snarl reads at phone size */
const Heavier: React.FC<{ id: string; children?: React.ReactNode }> = ({ id, children }) => {
  const o = useOcean();
  return (
    <g>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology operator="dilate" radius={(1.7 / o.a).toFixed(5)} />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.2" intercept="0.06" />
            <feFuncG type="linear" slope="1.2" intercept="0.06" />
            <feFuncB type="linear" slope="1.2" intercept="0.05" />
          </feComponentTransfer>
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </g>
  );
};
/** the camera roll: the whole world turns about the screen centre (light, snow, grade stay true) */
const Rolled: React.FC<{ roll: number; children?: React.ReactNode }> = ({ roll, children }) => {
  const o = useOcean();
  const cx = (540 - o.bx) / o.a;
  const cy = (960 - o.by) / o.a;
  return <g transform={`rotate(${((roll * 180) / Math.PI).toFixed(6)} ${cx.toFixed(6)} ${cy.toFixed(6)})`}>{children}</g>;
};

// particulate in the water along the run, at three depths (rolled with the world: it streams past)
const PARTS = (() => {
  const out: { a: number; off: number; z: number; r: number; al: number; seed: number }[] = [];
  const layers = [
    { z: CABLE.z - 140, n: 520, r: [1.4, 2.6], al: [0.25, 0.45] },
    { z: CABLE.z + 80, n: 420, r: [2.2, 4.0], al: [0.3, 0.55] },
    { z: CABLE.z + 300, n: 160, r: [6, 12], al: [0.12, 0.22] },
  ];
  layers.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const h = li * 1000 + i * 3.71;
      out.push({
        a: lerp(ARC_V[0] - 60, SNAG_ARC + 80, hash01(h)),
        off: (hash01(h + 1) - 0.5) * 110,
        z: L.z,
        r: lerp(L.r[0], L.r[1], hash01(h + 2)),
        al: lerp(L.al[0], L.al[1], hash01(h + 3)),
        seed: h,
      });
    }
  });
  return out;
})();
const Particles: React.FC<{ t: number; z: number }> = ({ t, z }) => {
  const o = useOcean();
  const dots: React.ReactNode[] = [];
  PARTS.forEach((p, i) => {
    if (p.z !== z) return;
    const c = cableAtArc(p.a);
    const x = c.x + c.nx * p.off + 0.05 * t + 1.5 * Math.sin(t / 30 + p.seed);
    const y = c.y + c.ny * p.off + 0.012 * t + 1.2 * Math.sin(t / 37 + p.seed * 1.7);
    const sx = o.a * x + o.bx;
    const sy = o.a * y + o.by;
    if (sx < -900 || sx > 1980 || sy < -900 || sy > 2820) return;
    dots.push(<circle key={i} cx={x} cy={y} r={p.r / o.a} fill={OCEAN.cream} opacity={p.al} />);
  });
  return <g style={z > CABLE.z + 200 ? { filter: `blur(${(3 / o.a).toFixed(3)}px)` } : undefined}>{dots}</g>;
};

/** the bubble wake off the thruster: bubbles shed backward, pushed out by the jet, rising slowly;
 *  in cable-plane coords (they stay where they were shed while the camera moves on) */
const WAKE_LIFE = 30;
const tailOnCable = (f: number) => {
  const S = solve(f);
  const L = VEH_L;
  const r = (L * MAKO.D) / 2;
  const c = Math.cos(S.veh.tilt);
  const s = Math.sin(S.veh.tilt);
  // the shroud (local -L/2, mirrored for facing -1) and the hull axis toward the tail
  const tail = { x: S.veh.x + (L / 2 + L * 0.01) * c, y: S.veh.y - (L / 2 + L * 0.01) * s };
  const ts = project(S.view, tail.x, tail.y, S.veh.z);
  const q = unproject(S.view, ts.x, ts.y, CABLE.z);
  const back = { x: c, y: -s }; // toward the tail (vehicle plane = cable plane directions)
  const rs = (r * project(S.view, 0, 0, S.veh.z).a) / project(S.view, 0, 0, CABLE.z).a;
  return { q, back, r: rs };
};
const TAIL_CACHE = new Map<number, ReturnType<typeof tailOnCable>>();
const tailAt = (e: number) => {
  let v = TAIL_CACHE.get(e);
  if (!v) {
    v = tailOnCable(e);
    TAIL_CACHE.set(e, v);
  }
  return v;
};
const Wake: React.FC<{ f: number; roll: number }> = ({ f, roll }) => {
  const o = useOcean();
  const px = 1 / o.a;
  // "up" on the rolled screen, in world directions
  const up = { x: -Math.sin(roll), y: -Math.cos(roll) };
  const dots: React.ReactNode[] = [];
  for (let e = Math.floor(f) - WAKE_LIFE; e <= f; e++) {
    if (e < -30) continue;
    const T = tailAt(e);
    for (let j = 0; j < 3; j++) {
      const age = f - e;
      const h = e * 3.17 + j * 11.3 + 500;
      const push = (5 + 4 * hash01(h + 1)) * (1 - Math.exp(-age / 8));
      const side = (hash01(h) - 0.5) * T.r * 1.6 + (hash01(h + 4.9) - 0.5) * 0.08 * age;
      const nrm = { x: -T.back.y, y: T.back.x };
      const rise = (0.05 + 0.05 * hash01(h + 2.3)) * age;
      const x = T.q.x + T.back.x * push + nrm.x * side + up.x * rise;
      const y = T.q.y + T.back.y * push + nrm.y * side + up.y * rise;
      const life = 1 - age / WAKE_LIFE;
      const rad = (1.6 + 2.8 * hash01(h + 3.7)) * px * (0.6 + 0.6 * life) * Math.min(1, 0.4 + age / 4);
      dots.push(<circle key={`${e}-${j}`} cx={x} cy={y} r={rad} fill="none" stroke={OCEAN.cream} strokeWidth={1.2 * px} opacity={0.6 * life} />);
    }
  }
  return <g>{dots}</g>;
};

/** the scan ring round the cable; over a buoyancy module it widens to wrap the module (never cutting it) */
const Ring: React.FC<{ arc: number; on: number }> = ({ arc, on }) => {
  const o = useOcean();
  if (on <= 0.001) return null;
  const px = 1 / o.a;
  const D = Math.max(SIZE_M.collar * SC.pxPerM, 24 / o.a);
  const L = D * 1.05;
  let w = 0;
  for (const cs0 of CABLE.collarS) {
    const d = Math.abs(arc - cs0 * CABLE.length);
    w = Math.max(w, 1 - smoothstep((d - L / 2) / (L * 0.35)));
  }
  const p = cableAtArc(arc);
  const ang = (Math.atan2(p.ty, p.tx) * 180) / Math.PI;
  const r = lerp(CW * 1.05 + 6 * px, D / 2 + 9 * px, w);
  return (
    <g transform={`translate(${p.x.toFixed(4)} ${p.y.toFixed(4)}) rotate(${ang.toFixed(4)})`} opacity={on}>
      <g style={{ filter: bloomFilter(o.a) }}>
        <ellipse cx={0} cy={0} rx={r * 0.32} ry={r} fill="none" stroke={OCEAN.amberTop} strokeWidth={4 * px} />
      </g>
      <ellipse cx={0} cy={0} rx={r * 0.32} ry={r} fill="none" stroke={OCEAN.amberHot} strokeWidth={1.6 * px} />
    </g>
  );
};
/** the light reaching the snag: a soft disc from the coils outward (the gear is in the dark before) */
const LitBy: React.FC<{ id: string; r: number; children?: React.ReactNode }> = ({ id, r, children }) => {
  const o = useOcean();
  const big = 4000 / o.a;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}g`} gradientUnits="userSpaceOnUse" cx={SNAG.x} cy={SNAG.y} r={r}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.7" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={SNAG.x - big} y={SNAG.y - big} width={big * 2} height={big * 2}>
          <rect x={SNAG.x - big} y={SNAG.y - big} width={big * 2} height={big * 2} fill="#000" />
          <circle cx={SNAG.x} cy={SNAG.y} r={r} fill={`url(#${id}g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`}>{children}</g>
    </g>
  );
};
/** in the dark: the gear's colours pulled down to a shadowed, low-contrast silhouette */
const Dark: React.FC<{ id: string; alpha: number; children?: React.ReactNode }> = ({ id, alpha, children }) => (
  <g>
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feComponentTransfer>
          <feFuncR type="linear" slope="0.42" intercept="0.06" />
          <feFuncG type="linear" slope="0.42" intercept="0.09" />
          <feFuncB type="linear" slope="0.42" intercept="0.09" />
          <feFuncA type="linear" slope={alpha.toFixed(4)} />
        </feComponentTransfer>
      </filter>
    </defs>
    <g filter={`url(#${id})`}>{children}</g>
  </g>
);
/** heavier knots: thick wraps of line round the cable at the three catch points */
const Knots: React.FC = () => {
  const o = useOcean();
  const px = 1 / o.a;
  const tan = { x: SNAG.tx, y: SNAG.ty };
  const nrm = { x: SNAG.nx, y: SNAG.ny };
  const els: React.ReactNode[] = [];
  [0, SNAG_GHOST_2.along, SNAG_GHOST_3.along].forEach((along, j) => {
    for (let i = 0; i < 4; i++) {
      const off = along + (i - 1.5) * CW * 0.48 + (hash01(j * 7 + i) - 0.5) * CW * 0.15;
      const c = { x: SNAG.x + tan.x * off, y: SNAG.y + tan.y * off };
      const lean = CW * (0.28 + 0.12 * hash01(j * 5 + i + 3));
      const a = { x: c.x + nrm.x * CW * 0.62 - tan.x * lean, y: c.y + nrm.y * CW * 0.62 - tan.y * lean };
      const b = { x: c.x - nrm.x * CW * 0.62 + tan.x * lean, y: c.y - nrm.y * CW * 0.62 + tan.y * lean };
      els.push(<path key={`${j}-${i}`} d={`M${a.x.toFixed(3)} ${a.y.toFixed(3)}L${b.x.toFixed(3)} ${b.y.toFixed(3)}`} stroke={OCEAN.mono} strokeOpacity={0.95} strokeWidth={3.6 * px} strokeLinecap="round" />);
    }
  });
  return <g>{els}</g>;
};
const World: React.FC<{ f: number; S: Solved }> = ({ f, S }) => {
  const t = TIME0 + f;
  const fan = fanStrength(f);
  const hit = clamp01((f - F_HIT) / 3);
  const lock = clamp01((f - F_LOCK0) / (F_LOCK1 - F_LOCK0));
  // the snag: dim in the dark ahead, lit by the beam
  // the gear is in the dark around the bend until ~f170; the light reaches the coils first and spreads
  const revealR = 48 * smoothstep((f - F_LIT0) / (F_LIT1 - F_LIT0));
  // ahead in the dark: beyond the fog while the camera looks along the run; as it swings round the bend
  // (f150-166) the silhouette comes up out of the deep water, still unlit
  const darkA = 0.04 + 0.5 * smoothstep((f - 150) / 16);
  const toSnag = smoothstep((f - 168) / 12);
  const cs = project(S.view, CORE.x, CORE.y, CABLE.z);
  const aim = { x: lerp(S.scanScr.x, cs.x, 0.25 * toSnag), y: lerp(S.scanScr.y, cs.y, 0.25 * toSnag) };
  // before the beam reaches the cable it shines short, forward and down into the water
  const tgt = unproject(S.view, aim.x, aim.y, S.veh.z);
  const dx = tgt.x - S.emitter.x;
  const dy = tgt.y - S.emitter.y;
  const scanned = f >= F_HIT;
  const box = coreBoxUpright(S.roll);
  const gear = (layer: "back" | "front", id: string) => (
    <>
      <Heavier id={id}>
        <SnaggedGhostLine frame={t} layer={layer} />
      </Heavier>
      {layer === "front" ? <Knots /> : null}
    </>
  );
  const snag = (layer: "back" | "front") => (
    <>
      {/* physically there ahead: dim in the dark (shadowed, low contrast) until the light reaches it */}
      {darkA > 0.005 ? (
        <Dark id={`dark${layer}`} alpha={darkA}>
          {gear(layer, `snagd${layer}`)}
        </Dark>
      ) : null}
      {revealR > 0.01 ? (
        <LitBy id={`lit${layer}`} r={revealR}>
          {gear(layer, `snag${layer}`)}
        </LitBy>
      ) : null}
    </>
  );
  return (
    <Rolled roll={S.roll}>
      <DepthGroup z={CABLE.z - 140}>
        <Particles t={t} z={CABLE.z - 140} />
      </DepthGroup>
      <DepthGroup z={CABLE.z}>
        {snag("back")}
        <DynamicCable cable={CABLE} />
        {/* light fouling, the same on both sides of the scan: the inspection doesn't touch the cable */}
        <Fouling spans={bareSpans(Math.max(0, ARC_V[0] - 160), SNAG_ARC + 160)} />
        {scanned ? <SectionChecks from={ARC_HIT} ring={S.scanArc} ringAt={scanArcAt} f={f} /> : null}
        <Ring arc={S.scanArc} on={hit} />
        {scanned ? <ModuleChecks ringAt={scanArcAt} f={f} ring={S.scanArc} /> : null}
        <Wake f={f} roll={S.roll} />
      </DepthGroup>
      <DepthGroup z={CABLE.z + 80}>
        <Particles t={t} z={CABLE.z + 80} />
      </DepthGroup>
      <DepthGroup z={S.veh.z}>
        <SonarFan
          x={S.emitter.x}
          y={S.emitter.y}
          angle={Math.atan2(dy, dx)}
          spread={lerp(0.5, 0.6, toSnag)}
          range={Math.hypot(dx, dy) * FAN_REACH}
          sweep={0.5 + 0.38 * Math.sin(t / 8)}
          strength={fan}
        />
      </DepthGroup>
      {/* the catch over the beam: the amber cone doesn't wash the net (the clearest shape at the end) */}
      <DepthGroup z={CABLE.z}>
        {snag("front")}
        <g transform={`rotate(${((-S.roll * 180) / Math.PI).toFixed(5)} ${CORE.x.toFixed(4)} ${CORE.y.toFixed(4)})`}>
          <LockBracket x={CORE.x + box.ox} y={CORE.y + box.oy} w={box.w} h={box.h} t={lock} />
        </g>
      </DepthGroup>
      <DepthGroup z={S.veh.z}>
        <UlyssesVehicle x={S.veh.x} y={S.veh.y} L={VEH_L} facing={-1} tilt={S.veh.tilt} frame={t} light={1} />
      </DepthGroup>
      <DepthGroup z={CABLE.z + 300}>
        <Particles t={t} z={CABLE.z + 300} />
      </DepthGroup>
    </Rolled>
  );
};

const CableInspectionV2: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const S = solve(f);
  return (
    <AbsoluteFill style={{ backgroundColor: "#30494A" }}>
      <OceanStage frame={TIME0 + f} cam={S.cam} scene={SC} horizon={HOR} rest={REST} sway snow={0.35}>
        <World f={f} S={S} />
      </OceanStage>
    </AbsoluteFill>
  );
};
export default CableInspectionV2;
