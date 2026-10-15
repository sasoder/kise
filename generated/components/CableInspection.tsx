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
  SonarFan,
  UlyssesVehicle,
  SIZE_M,
  bloomFilter,
  ghostStrand,
  cableWidths,
  clamp01,
  easeOutCubic,
  lerp,
  makeView,
  project,
  smoothstep,
  unproject,
  useOcean,
  vehicleGeometry,
  type Cam,
  type OceanView,
} from "./oceanShared";
import { CABLE } from "./OceanFrames";
import { SNAG_GHOST, SNAG_GHOST_2, SNAG_GHOST_3, SNAG_S, SnaggedGhostLine } from "./GhostLines";

/**
 * CableInspection — Cheeky Pint S4E02 (Will O'Brien, Ulysses), cut C (27_CableInspection.mov).
 * 1080x1920, opaque, 24000/1001 fps, 215 frames (199 of content + a 16-frame tail).
 *
 * Check line: after this cut the viewer can say "Ulysses' vehicle runs along the cable every day,
 * scanning it end to end, and flags the spot where fishing line has snagged."
 *
 * The motion: one continuous travelling shot down cut B's export cable (the same CABLE and the same
 * snag: SNAG_S + SnaggedGhostLine imported from GhostLines.tsx). The Mako enters from the top edge and
 * cruises nose-down along the upper cable, through the sag bend and over the buoyancy hump, the
 * camera travelling with it at a steady cruise (<= 44 screen px/f). From "map" its sonar fan grows out
 * of the pod; where it lands an amber scan ring rides the cable and the cable behind is left MAPPED (a
 * glowing survey line with chainage ticks: amber for what the scan wrote in the last 6 frames, then
 * steady cream). The vehicle reaches the snag, eases to a hover above it, the scan runs onto the tangle
 * and the amber lock bracket closes on it (locked f178); a settled, living frame with a slow drift in.
 *
 * The vehicle's path (built, not keyed): the closest line that keeps the WHOLE hull a clear stand-off above
 * the cable and its modules while its pitch never exceeds 28.6 deg (survey AUVs stay near level): on the
 * steep cable it glides down shallower than the cable, it floats over the sag, climbs the hump at <= 28 deg
 * and comes to rest over the tangle. On screen the hull never overlaps cable or modules (min ~75 px).
 * Depth: the vehicle runs in FRONT of the cable (nearer the eye), drawn at an authored screen length
 * (570 -> 590 -> 500 px); its depth is derived from that, so the 2 m vehicle stays big.
 *
 *   f   | words                          | picture
 *   0   | system like a                  | close (E 21: the armoured cable ~52 px thick); the Mako already gliding down at
 *       |                                | 28 deg above the steeper cable, the camera travelling with it
 *   0-36| surface underwater vehicle     | a clear look at the Mako over the cable; it levels out over the sag
 *   30-74|                               | the camera eases out to the cruise framing (E 11.2) while the vehicle picks up speed
 *       |                                | (screen speed held ~40 px/f)
 *   53  | map f54                        | the fan grows out of the pod (strength 53-65)
 *   59  | these cables f59-66            | CONTACT: the fan reaches the cable; ring + trace start here
 *   64-150 | on a daily basis … good condition | cruise down the S (sag bend ~f95), climb the hump; trace grows,
 *       |                                | cools to cream; the camera eases slightly wider over the hump (f88-128)
 *   144 | and also if                    | the snag enters from the left edge
 *   148-166 | they're getting lines      | the vehicle eases to its hover (150-174); the scan runs onto the coils (by f166)
 *   165-178 | caught on them             | the lock bracket slides in from off-frame and closes on the tangle box (derived
 *       |                                | from B's SNAG_GHOST geometry; 49% of the width, centre y ~855, bottom <= 1080)
 *   178-215 | (cut back f199)            | settled living frame: fan on the tangle, gear drifting, snow, rays, slow drift in
 */
export const FPS = 24000 / 1001;
export const DURATION = 215;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// ---- the snag (cut B: GhostLines.tsx, see scratchpad B/SNAG.md) -------------------------------
// The same gear on the same spot: SnaggedGhostLine without `to` (the net trails free downstream).
export const SNAG = CABLE.at(SNAG_S);
/** the tangle's box (cable-plane world px, relative to the snag point): the coils, the strands and
 *  the torn net hanging ~22 px downstream (measured from ghostStrand(SNAG_GHOST)) */
export const TIME0 = 300; // the world clock (snow, current, ghost line) at f0
/** The tangle's box (cable-plane world px), DERIVED from cut B's exported gear (SNAG_GHOST,
 *  SNAG_GHOST_2, SNAG_GHOST_3, the same ghostStrand / net layout GhostLine draws): the coils round the cable, every
 *  strand, and the torn net hanging at netAt. Unioned over the lock + hold frames so the bracket is
 *  steady while the gear drifts. Re-derived whenever B's constants change. */
export const TANGLE = (() => {
  const cw = SIZE_M.cable * SCENE_BC.pxPerM; // drawn width at these zooms (above the 9 px minimum)
  const A = { x: SNAG.x, y: SNAG.y };
  const tan = { x: SNAG.tx, y: SNAG.ty };
  const nrm = { x: SNAG.nx, y: SNAG.ny };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  };
  const coils = (a: { x: number; y: number }) => {
    for (const k of [-1.6, 1.6]) for (const m of [-0.7, 0.7]) add(a.x + tan.x * k * cw + nrm.x * m * cw, a.y + tan.y * k * cw + nrm.y * m * cw);
  };
  const a2 = { x: A.x + tan.x * SNAG_GHOST_2.along, y: A.y + tan.y * SNAG_GHOST_2.along };
  const a3 = { x: A.x + tan.x * SNAG_GHOST_3.along, y: A.y + tan.y * SNAG_GHOST_3.along };
  coils(A);
  coils(a2);
  coils(a3);
  for (let f = 160; f <= DURATION; f += 5) {
    const t = TIME0 + f;
    const main = { ...SNAG_GHOST, anchor: A, tangent: tan, cableW: cw, wrap: 1, frame: t };
    for (let i = 0; i < SNAG_GHOST.strands; i++) ghostStrand(main, i).forEach((q) => add(q.x, q.y));
    const sec = { ...SNAG_GHOST_2, anchor: a2, tangent: tan, cableW: cw, wrap: 1, frame: t + 13 };
    for (let i = 0; i < SNAG_GHOST_2.strands; i++) ghostStrand(sec, i).forEach((q) => add(q.x, q.y));
    const ter = { ...SNAG_GHOST_3, anchor: a3, tangent: tan, cableW: cw, wrap: 1, frame: t + 29 };
    for (let i = 0; i < SNAG_GHOST_3.strands; i++) ghostStrand(ter, i).forEach((q) => add(q.x, q.y));
    if (SNAG_GHOST.net) {
      // the net hangs from the main strand at netAt: its head rope along the strand, body down ~1.05 h
      const pts = ghostStrand(main, 0);
      const idx = Math.round(SNAG_GHOST.netAt * (pts.length - 1));
      const hook = pts[idx];
      const pa = pts[Math.max(0, idx - 4)];
      const pb = pts[Math.min(pts.length - 1, idx + 4)];
      let ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      if (Math.cos(ang) < 0) ang += Math.PI;
      const ax = { x: Math.cos(ang), y: Math.sin(ang) };
      const { w, h } = SNAG_GHOST.net;
      const drift = SNAG_GHOST.current.x * w * 0.18;
      for (const u of [-0.5, 0.5]) add(hook.x + ax.x * u * w, hook.y + ax.y * u * w);
      for (const u of [-0.29, 0.29]) add(hook.x + ax.x * u * w + drift, hook.y + ax.y * u * w + h * 1.05);
    }
  }
  const pad = 1.6;
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
})();
export const TANGLE_C = { x: TANGLE.x, y: TANGLE.y };


// ---- the world ---------------------------------------------------------------------------------
const SC = SCENE_BC;
export const HOR = 1250;
const P = SC.focusM * SC.pxPerM; // 750
export const S_C = P / (P - CABLE.z); // the cable plane's depth scale (1.3636)
const LEN = CABLE.length;
const VEH_L = 20; // the Mako: 2 m
export const SNAG_ARC = SNAG_S * LEN;

// ---- the story (frames) ---------------------------------------------------------------------------
// The vehicle flies its own path (cable-plane world coords, built below): the closest line that keeps a
// clear stand-off above the cable while its pitch never exceeds PITCH_MAX (survey AUVs stay near
// level). On the steep upper cable it descends on that shallower glide; over the sag and the hump it
// rides a constant stand-off; it comes to rest over the tangle. Screen speed stays ~30-40 px/f.
const PITCH_MAX = 0.5; // 28.6 degrees
/** the stand-off (world px, hull centre to cable centreline, perpendicular) at cable x: close in the
 *  opening, wider where the buoyancy modules (r 6) ride the hump, so the hull never overlaps them */
const standoff = (x: number) => lerp(10, 19, smoothstep((120 - x) / 60));
/** where the run starts (cable-plane x) and where it rests: above the tangle, the pod over it */
const X_START = 214;
const HOVER = { x: TANGLE.x + 3.5, y: TANGLE.y - 30 };
const F_DEC0 = 150; // the vehicle eases to its hover
const F_DEC1 = 174;
/** the speed profile's shape (scaled below so the run ends at HOVER at F_DEC1): slower in the close
 *  opening, cruising once the camera has eased out */
const speedShape = (f: number) => lerp(0.63, 1, smoothstep((f - 30) / 44)) * (1 - smoothstep((f - F_DEC0) / (F_DEC1 - F_DEC0)));
const F_FAN0 = 53; // "map"
const F_FAN1 = 65;
const F_LOCK0 = 165;
const F_LOCK1 = 178;
const E_CRUISE = 13;
/** the payoff: the tangle (coils + net) spans ~49% of the frame width */
const E_END = (0.49 * 1080) / TANGLE.w;
/** the tangle's centre, screen y at rest: near the middle, its box bottom kept above y 1080 */
const Y_TANGLE = Math.max(830, Math.min(880, 1078 - (TANGLE.h * E_END * 1.03) / 2));

/** the cable point + its UP normal at arc length a (world px) */
export const cableAtArc = (a: number) => CABLE.at(clamp01(a / LEN));
type VState = { x: number; y: number; p: number; a: number };
/** the path: y(x) on a grid from X_START down to HOVER.x. B(x) = the highest allowed point (the
 *  stand-off above the cable, measured perpendicular); the path = the closest PITCH_MAX-Lipschitz curve
 *  under it (two passes), then smoothed (a moving average keeps the slope bound). */
const PATH = (() => {
  const DX = 0.5;
  // the cable as y(x) (x decreases monotonically along the run) + its slope angle
  const cab: { x: number; y: number; th: number }[] = [];
  for (let a = 0; a <= SNAG_ARC + 60; a += 0.5) {
    const c = cableAtArc(a);
    cab.push({ x: c.x, y: c.y, th: Math.atan2(Math.abs(c.ty), Math.abs(c.tx)) });
  }
  const cableY = (x: number) => {
    for (let i = 1; i < cab.length; i++) {
      if (cab[i].x <= x) {
        const t = (cab[i - 1].x - x) / (cab[i - 1].x - cab[i].x || 1);
        return { y: lerp(cab[i - 1].y, cab[i].y, t), th: lerp(cab[i - 1].th, cab[i].th, t) };
      }
    }
    return { y: cab[cab.length - 1].y, th: 0 };
  };
  const X0 = X_START + 40; // a run-in before the start (the camera's pre-roll)
  const X1 = HOVER.x - 30;
  const n = Math.round((X0 - X1) / DX);
  const xs = Array.from({ length: n + 1 }, (_, i) => X0 - i * DX);
  const m = Math.tan(PITCH_MAX) * 0.97;
  const B = xs.map((x) => {
    const c = cableY(x);
    return c.y - standoff(x) / Math.max(0.25, Math.cos(c.th));
  });
  // the whole hull, not just its centre: a hull of half-length HL at pitch <= PITCH_MAX centred at x
  // clears the cable if its centre sits under B(x') - m |x' - x| for every x' it spans
  const HL = 6;
  const k = Math.round(HL / DX);
  const Bh = B.map((_, i) => {
    let v = Infinity;
    for (let j = Math.max(0, i - k); j <= Math.min(n, i + k); j++) v = Math.min(v, B[j] - m * Math.abs(j - i) * DX);
    return v;
  });
  // the run-in before X_START (the camera's pre-roll, off-screen) is free: it just extends the glide
  for (let i = 0; i <= n; i++) if (xs[i] > X_START) Bh[i] = Infinity;
  const Y = Bh.slice();
  for (let i = 1; i <= n; i++) Y[i] = Math.min(Y[i], Y[i - 1] + m * DX);
  for (let i = n - 1; i >= 0; i--) Y[i] = Math.min(Y[i], Y[i + 1] + m * DX);
  // the run-in: the vehicle has been gliding down at the start's pitch (it comes from up and right)
  const iS = Math.round((X0 - X_START) / DX);
  const pS = Math.atan2(Y[iS + 8] - Y[iS], DX * 8);
  for (let i = 0; i < iS; i++) Y[i] = Y[iS] - Math.tan(Math.min(PITCH_MAX, Math.max(0, pS))) * (xs[i] - X_START);
  const box = (arr: number[], w: number) =>
    arr.map((_, i) => {
      let acc = 0;
      let k = 0;
      for (let j = Math.max(0, i - w); j <= Math.min(n, i + w); j++) {
        acc += arr[j];
        k++;
      }
      return acc / k;
    });
  const Ys = box(box(Y, 36), 36);
  // the rest point sits on the path: shift the end of the path onto HOVER.y (eased over the last 40 px)
  const iH = Math.round((X0 - HOVER.x) / DX);
  const dyH = HOVER.y - Ys[iH];
  const Yf = Ys.map((y, i) => y + dyH * smoothstep((xs[i] - (HOVER.x + 40)) / -40));
  const cum = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + Math.hypot(DX, Yf[i] - Yf[i - 1]));
  const sStart = cum[Math.round((X0 - X_START) / DX)];
  const sHover = cum[iH];
  const at = (sv: number): VState => {
    let lo = 0;
    let hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= sv) lo = mid;
      else hi = mid;
    }
    const t = clamp01((sv - cum[lo]) / (cum[hi] - cum[lo] || 1));
    const x = lerp(xs[lo], xs[hi], t);
    const y = lerp(Yf[lo], Yf[hi], t);
    const i0 = Math.max(0, lo - 3);
    const i1 = Math.min(n, hi + 3);
    // pitch: + = nose down (moving left with y increasing)
    const p = Math.atan2(Yf[i1] - Yf[i0], xs[i0] - xs[i1]);
    return { x, y, p, a: 0 };
  };
  return { at, sStart, sHover };
})();
/** the run in path length per frame: the speed shape, scaled to cover start -> hover by F_DEC1 */
const S_OF_F: number[] = (() => {
  const N = DURATION + 80;
  const cum = [0];
  for (let f = 1; f <= F_DEC1; f++) cum.push(cum[f - 1] + (speedShape(f - 1) + speedShape(f)) / 2);
  const k = (PATH.sHover - PATH.sStart) / cum[F_DEC1];
  const out: number[] = [];
  const v0 = speedShape(0) * k;
  for (let f = -80; f <= N; f++) out.push(f < 0 ? PATH.sStart + v0 * f : PATH.sStart + k * cum[Math.min(f, F_DEC1)]);
  return out;
})();
/** the cable arc at a cable-plane x (x decreases monotonically along the run): the point "under" a thing */
const ARC_X: { x: number; a: number }[] = (() => {
  const out: { x: number; a: number }[] = [];
  for (let a = 0; a <= LEN * 0.6; a += 0.5) out.push({ x: cableAtArc(a).x, a });
  return out;
})();
const arcAtX = (x: number) => {
  if (x >= ARC_X[0].x) return 0;
  for (let i = 1; i < ARC_X.length; i++) {
    if (ARC_X[i].x <= x) return lerp(ARC_X[i - 1].a, ARC_X[i].a, (ARC_X[i - 1].x - x) / (ARC_X[i - 1].x - ARC_X[i].x || 1));
  }
  return ARC_X[ARC_X.length - 1].a;
};
const vAt = (f: number): VState => {
  const fi = Math.max(-80, Math.min(DURATION + 79, f));
  const i = Math.floor(fi) + 80;
  const sv = lerp(S_OF_F[i], S_OF_F[Math.min(S_OF_F.length - 1, i + 1)], fi - Math.floor(fi));
  const st = PATH.at(sv);
  return { ...st, a: arcAtX(st.x) };
};
const ENTRY_F = 0; // (no entry lead: the vehicle is already in frame at f0, the camera already travelling)
const F_ENTRY = 22;
const LAG_F = CAM_DAMP / CAM_STIFF; // the follower's steady lag (frames)

// the zoom: ln E keyed through eased glides
const E_KEYS: { f0: number; f1: number; e: number }[] = [
  { f0: 30, f1: 74, e: E_CRUISE },
  { f0: 88, f1: 128, e: 12 },
  { f0: 140, f1: 186, e: E_END },
  // the hold: a slow drift in, still moving at the cut (a living frame)
  { f0: 176, f1: 250, e: E_END * 1.04 },
];
const E_START = 21;
const lnETarget = (f: number) => {
  let le = Math.log(E_START);
  let prev = E_START;
  for (const k of E_KEYS) {
    const u = smoothstep((f - k.f0) / (k.f1 - k.f0));
    le += (Math.log(k.e) - Math.log(prev)) * u;
    prev = k.e;
  }
  return le;
};
// the final framing: the tangle at (540, Y_TANGLE)
const FOCUS_END = { x: TANGLE_C.x, y: TANGLE_C.y + (960 - Y_TANGLE) / E_END };
const F_BLEND0 = 138;
const F_BLEND1 = 178;
const targetAt = (f: number) => {
  const le = lnETarget(f);
  // between the vehicle and its cable point, ahead by the follower's lag (+ the entry lead at the start)
  const g = f + LAG_F + 1.5 + ENTRY_F * (1 - smoothstep(Math.max(0, f) / F_ENTRY));
  const st = vAt(g);
  const c = cableAtArc(st.a);
  // the pair (vehicle + its cable) centred a little above the middle, out of the caption bands
  const E = Math.exp(le);
  const cruise = { x: lerp(c.x, st.x, 0.45), y: lerp(c.y, st.y, 0.45) + 110 / E };
  const w = smoothstep((f - F_BLEND0) / (F_BLEND1 - F_BLEND0));
  return { x: lerp(cruise.x, FOCUS_END.x, w), y: lerp(cruise.y, FOCUS_END.y, w), le };
};
// the damped follower (the house CAM_STIFF / CAM_DAMP), with a pre-roll so f0 is settled
const PRE = 60;
const TRACK: { x: number; y: number; le: number }[] = (() => {
  const out: { x: number; y: number; le: number }[] = [];
  let c = targetAt(-PRE);
  let v = { x: 0, y: 0, le: 0 };
  for (let f = -PRE; f <= DURATION + 2; f++) {
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
/** the camera (house Cam: the z = 0 plane's centre) that puts the cable-plane focus at screen centre */
export const camAt = (f: number): Cam & { E: number } => {
  const i = Math.max(0, Math.min(TRACK.length - 1, Math.floor(f)));
  const T = TRACK[i];
  const E = Math.exp(T.le);
  const k = E / S_C;
  return { x: T.x, y: T.y + (290 * (1 - S_C)) / (k * S_C), k, E };
};
const REST = camAt(0);
export const DEBUG = () => ({ TANGLE, SNAG: { x: SNAG.x, y: SNAG.y }, E_END, Y_TANGLE, path: [PATH.sStart, PATH.sHover] });

// the vehicle's screen size (px) and its standoff: authored on screen, its depth derived from them
const vehLenPx = (f: number) => lerp(lerp(570, 590, smoothstep(f / 40)), 500, smoothstep((f - 140) / 40));
const pitchAt = (f: number) => 0.2 * smoothstep((f - 152) / 26); // nose down toward the snag at the hover
/** the scan: where the fan meets the cable (arc), ahead of the vehicle's pod; onto the snag at the end */
const scanArc = (f: number, E: number, Lpx: number) => {
  const st = vAt(f);
  // the pod sits 0.36 L ahead of the hull centre: the beam meets the cable a little ahead of it
  const cruise = st.a + (0.36 * Lpx + 30) / E;
  const w = smoothstep((f - 148) / 18);
  return lerp(cruise, SNAG_ARC, w);
};

type Solved = {
  view: OceanView;
  cam: Cam;
  E: number;
  veh: { x: number; y: number; z: number; L: number; tilt: number };
  emitter: { x: number; y: number };
  scanArc: number;
  scanScr: { x: number; y: number };
};
export const solve = (f: number): Solved => {
  const cam = camAt(f);
  const E = cam.E;
  const fr = TIME0 + f;
  // the stage's handheld sway (OceanStage sway), so the vehicle and its fan sit exactly on the cable
  const view = makeView({ frame: fr, cam, scene: SC, horizon: HOR, sway: { x: 3 * Math.sin(fr / 23), y: 5 * Math.sin(fr / 19) } });
  const Lpx = vehLenPx(f);
  const s_v = Lpx / (VEH_L * cam.k);
  const zv = P - P / s_v;
  const st = vAt(f);
  const vs = project(view, st.x, st.y, CABLE.z);
  const vw = unproject(view, vs.x, vs.y, zv);
  // facing -1 (nose left): tilt = the pitch (+ nose down), plus the look down at the snag at the hover
  const tilt = st.p + pitchAt(f);
  const vp = { x: vw.x, y: vw.y, L: VEH_L, facing: -1 as const, tilt };
  const g = vehicleGeometry(vp);
  const sa = scanArc(f, E, Lpx);
  const sp = cableAtArc(sa);
  const ss = project(view, sp.x, sp.y, CABLE.z);
  return { view, cam, E, veh: { ...vp, z: zv }, emitter: g.emitter, scanArc: sa, scanScr: { x: ss.x, y: ss.y } };
};

// ---- the mapped trace + the scan ring (cable plane) --------------------------------------------
const TICK = 9; // chainage tick pitch (world px along the cable: 0.9 m)
const HOT_F = 6; // the fresh, amber stretch: what the scan wrote in the last HOT_F frames (cools to cream)
export const MappedTrace: React.FC<{ from: number; to: number; hotFrom: number }> = ({ from, to, hotFrom }) => {
  const o = useOcean();
  if (to - from < 0.01) return null;
  const px = 1 / o.a;
  const cw = cableWidths(o, CABLE).w;
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
  // chainage ticks, fixed to the cable (absolute arc multiples), written as the scan passes
  const ticks: { d: string; hot: number }[] = [];
  for (let a = Math.ceil(from / TICK) * TICK; a <= to; a += TICK) {
    const p = cableAtArc(a);
    const h = cw * 0.95 + 9 * px;
    ticks.push({
      d: `M${(p.x + p.nx * h).toFixed(3)} ${(p.y + p.ny * h).toFixed(3)}L${(p.x - p.nx * h).toFixed(3)} ${(p.y - p.ny * h).toFixed(3)}`,
      hot: a >= hot0 ? 1 : 0,
    });
  }
  const lw = 4.5 * px;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* soft glow under the line */}
      <path d={segs(from, to)} stroke={OCEAN.cream} strokeOpacity={0.35} strokeWidth={lw * 3.2} style={{ filter: `blur(${(5 * px).toFixed(3)}px)` }} />
      <path d={segs(from, hot0)} stroke={OCEAN.cream} strokeOpacity={0.95} strokeWidth={lw} />
      <g style={{ filter: bloomFilter(o.a) }}>
        <path d={segs(hot0, to)} stroke={OCEAN.amberTop} strokeWidth={lw * 1.1} />
      </g>
      {ticks.map((t, i) => (
        <path key={i} d={t.d} stroke={t.hot > 0.02 ? OCEAN.amberTop : OCEAN.cream} strokeOpacity={t.hot > 0.02 ? 1 : 0.9} strokeWidth={3.5 * px} strokeLinecap="butt" />
      ))}
    </g>
  );
};
/** the scan ring: a thin amber ring round the cable where the fan meets it */
export const ScanRing: React.FC<{ arc: number; on: number }> = ({ arc, on }) => {
  const o = useOcean();
  if (on <= 0.001) return null;
  const px = 1 / o.a;
  const cw = cableWidths(o, CABLE).w;
  const p = cableAtArc(arc);
  const ang = (Math.atan2(p.ty, p.tx) * 180) / Math.PI;
  const r = cw * 1.05 + 6 * px;
  return (
    <g transform={`translate(${p.x.toFixed(4)} ${p.y.toFixed(4)}) rotate(${ang.toFixed(4)})`} opacity={on}>
      <g style={{ filter: bloomFilter(o.a) }}>
        <ellipse cx={0} cy={0} rx={r * 0.32} ry={r} fill="none" stroke={OCEAN.amberTop} strokeWidth={4 * px} />
      </g>
      <ellipse cx={0} cy={0} rx={r * 0.32} ry={r} fill="none" stroke={OCEAN.amberHot} strokeWidth={1.6 * px} />
    </g>
  );
};

// ---- the frame -------------------------------------------------------------------------------------
const fanStrength = (f: number) => smoothstep((f - F_FAN0) / (F_FAN1 - F_FAN0));
const FAN_REACH = 1.16; // the fan's range / the emitter-to-scan distance
/** the first frame the growing fan reaches the cable (its range scales by easeOutCubic(strength)) */
const F_HIT = (() => {
  for (let f = F_FAN0; f <= F_FAN1; f += 0.05) if (easeOutCubic(fanStrength(f)) * FAN_REACH >= 1) return f;
  return F_FAN1;
})();
/** the scan point's arc at the first contact: the mapped trace is written from here */
export const ARC_HIT = (() => {
  const c = camAt(F_HIT);
  return scanArc(F_HIT, c.E, vehLenPx(F_HIT));
})();
const scanArcAt = (f: number) => scanArc(f, camAt(Math.max(0, f)).E, vehLenPx(f));
const World: React.FC<{ f: number; S: Solved }> = ({ f, S }) => {
  const t = TIME0 + f;
  const fan = fanStrength(f);
  // contact: the ring lights where the beam meets the cable, the trace is written from that frame on
  const hit = clamp01((f - F_HIT) / 3);
  const lock = clamp01((f - F_LOCK0) / (F_LOCK1 - F_LOCK0));
  // the fan, aimed (in the vehicle's plane) at the scan point's screen position
  const toSnag = smoothstep((f - 148) / 18);
  // at the snag the fan opens over the whole tangle (coils on the cable + the net trailing below)
  const tc = project(S.view, TANGLE_C.x, TANGLE_C.y, CABLE.z);
  const aim = { x: lerp(S.scanScr.x, tc.x, 0.8 * toSnag), y: lerp(S.scanScr.y, tc.y, 0.8 * toSnag) };
  const tgt = unproject(S.view, aim.x, aim.y, S.veh.z);
  const dx = tgt.x - S.emitter.x;
  const dy = tgt.y - S.emitter.y;
  const ang = Math.atan2(dy, dx);
  const dist = Math.hypot(dx, dy);
  const spread = lerp(0.5, 0.78, toSnag);
  return (
    <>
      <DepthGroup z={CABLE.z}>
        <SnaggedGhostLine frame={t} layer="back" />
        <DynamicCable cable={CABLE} />
        <SnaggedGhostLine frame={t} layer="front" />
        {f >= F_HIT ? <MappedTrace from={ARC_HIT} to={Math.max(ARC_HIT, S.scanArc)} hotFrom={scanArcAt(f - HOT_F)} /> : null}
        <ScanRing arc={S.scanArc} on={hit} />
        <LockBracket x={TANGLE_C.x} y={TANGLE_C.y} w={TANGLE.w} h={TANGLE.h} t={lock} />
      </DepthGroup>
      <DepthGroup z={S.veh.z}>
        <SonarFan x={S.emitter.x} y={S.emitter.y} angle={ang} spread={spread} range={dist * FAN_REACH} sweep={0.5 + 0.38 * Math.sin(t / 8)} strength={fan} />
        <UlyssesVehicle x={S.veh.x} y={S.veh.y} L={S.veh.L} facing={-1} tilt={S.veh.tilt} frame={t} light={1} />
      </DepthGroup>
    </>
  );
};

const CableInspection: React.FC<Props> = () => {
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
export default CableInspection;
