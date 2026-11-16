// ---------------------------------------------------------------------------
// CeilingAboveUs (rsi-stupidest-species, cut 2), REVISION 1. Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 69 frames. Built on the shared world W1 THE SPECIES TOWER (speciesTower.tsx, read-only;
// TOWER_READY.md is its API). Everything this cut adds to the tower is drawn locally in this file.
//
// CHECK LINE: "Human intelligence sits low on a tower whose ceiling is far, far above us."
//
// THE LINE: "I think the ceiling here is probably way above human level."
// WORD -> FRAME: I -2 · think 2 · the 8 · ceiling 13 · here 18 · is 23 · probably 33 · way 37 · above 48 · human 55 ·
//   level 62 (Whisper onsets from the composition start; may run ~0.2-0.4 s early)
// DURATION: the slot 2.336 -> 5.214 s (sequence frames 56-125) = 2.878 s x 23.976 = 69 frames (f0..f68).
//
// REV 1 (the user: "it's unclear what that higher ceiling is ... make the ceiling more technical ... a bit boring"),
// second pass (the director: a beam with a line hanging from it read as a crane / plumb hook; the ceiling was only one
// tower-height up; f0-12 was empty air):
// THE CEILING is a vast horizontal blueprint grid plane seen from below at 70 m (~4.5 tower-heights above the floor):
// crisp orange 5 m grid lines with a 1 m sub-grid, the lines along the depth converging on the vanishing point, the
// plane fading as it recedes 85 m back (in the end frame the fine sub-grid reads down to y ~520, the far edge at
// y ~551); its front face (the slab's 1.3 m thickness) a hatched band. Nothing hangs from it.
// THE RULER (thin orange line, ticks on its left every metre from the human level, longer every 5 m, longest every
// 10 m) RISES from the cream HUMAN LEVEL mark at the lit niche's sill, beside the tower with clear air between (the
// cream mark runs out to its foot as an extension line), and touches the grid's front edge with a small end tick.
// The ruler and the ceiling's front edge live in one front plane Z_F just in front of the stone, so they meet exactly.
// Where the ruler crosses the receding grid on screen, a thin band of air behind it knocks the grid lines out, so it
// reads in front of and below the ceiling until it touches. Under the tower a faint lit patch of floor and a soft dark
// contact shadow (local Footing; the shared TowerScene is composed here from TowerFloor + SpeciesTower) ground it.
//
// THE MOTION: one continuous camera. f0-12 close on the human in his lit niche, the cream mark running out to the
// ruler's foot; on "ceiling" (f13) the tip shoots up and the camera cranes up with it (the ticks stream down past, the
// capital drops away, a long stretch of open air on "probably way", the grid arriving from above), the tip easing to
// touch the grid's front edge on "above" (f48); on "human level" (f51-64) the camera pulls back to the resolved frame:
// the grid ceiling across the top (front edge y ~330, fading by y ~550), the long ruler, the tower small far below with
// the tiny lit niche at y ~1040.
// Orange = intelligence (the clip's rule): the ceiling and its measure. The human-level mark is cream. No labels.
//
// CAMERA: k (px/m on the front plane, kForPxm) on pchip keys; the anchor is the ruler's tip (X_D, h_tip, Z_F) held at a
// keyed screen point, so the camera follows the tip without bobbing (both come from the same eased curves). The 1 m and
// 5 m ticks thin out while the tip runs fast (up to ~3.2 m a frame) so they do not strobe; the 10 m ticks stay.
// The tower's depth camera with the eye capped locally (eyeM: the shared eye rises with the frame centre and would
// tilt the whole world under the ceiling), fog by world depth (airOf, a local copy of towerAirOf).
//
// SOURCES: none (no real figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  AIR,
  AirStage,
  FIG_FOG,
  ORANGE_LINE,
  PandemicFolk,
  WorldSvg,
  airRamp,
  makeAirView,
  mixHex,
  perspective,
  pchip,
  rgbHex,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type P2,
  type Persp,
  type RGB,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { TOWER, TOWER_DEPTH, TOWER_RAMP, TOWER_SCENE, SpeciesTower, TowerFloor, U, hy, m, tOfHeight, zFrontAt } from "./speciesTower";

export const FPS = 24000 / 1001;
export const DURATION = 69;
export const schema = z.object({});
export const defaultProps = schema.parse({});


// ---- the eye: the tower's crane eye, capped below the capital ------------------------------------------------------
// The shared eye rises with the frame (0.85 x the frame centre's height + 0.6 m); under the ceiling that puts it above
// the capital, so the opening looked down on the capital's top and the floor's horizon. Here it is the same up to 8 m
// and then eases toward a cap of 11.5 m (a shifted lens looking up), identical in the resolved frame (eye ~7.3 m).
// A local copy of towerAirOf / frameAt / screenOf3 on this eye (the shared module is read-only).
const C01 = (x: number) => Math.max(0, Math.min(1, x));
const EYE = { e0: 8, cap: 11.5 };
export const eyeM = (cam: Cam) => {
  const e = Math.max(1.7, 0.85 * (-cam.cy / U) + 0.6);
  return e <= EYE.e0 ? e : EYE.e0 + (EYE.cap - EYE.e0) * Math.tanh((e - EYE.e0) / (EYE.cap - EYE.e0));
};
const depthOf = (cam: Cam): DepthOpts => ({ eyeY: -m(eyeM(cam)), ...TOWER_DEPTH });
export const perspOf = (cam: Cam): Persp => perspective(cam, depthOf(cam));
const DcOf = (k: number) => TOWER_DEPTH.dRef * Math.pow(TOWER_DEPTH.kRef / k, TOWER_DEPTH.dolly);
/** the camera at zoom k that puts the 3D point (X, Y, Z) at screen (sx, sy), on this cut's eye */
export const frameAtC = (k: number, X: number, Y: number, Z: number, sx: number, sy: number): Cam => {
  const D = DcOf(k);
  const r = D / (D + Z);
  let cy = Y - (sy - 960) / k;
  for (let i = 0; i < 60; i++) {
    const e = -m(eyeM({ k, cx: 0, cy }));
    cy = e + (Y - e) * r - (sy - 960) / k;
  }
  return { k, cx: X - (sx - 540) / (r * k), cy };
};
export const screenOfC = (cam: Cam, X: number, Y: number, Z: number): P2 => {
  const q = perspOf(cam).p(X, Y, Z);
  return [540 + (q[0] - cam.cx) * cam.k, 960 + (q[1] - cam.cy) * cam.k];
};
/** towerAirOf on this cut's eye (the same medium, height ramp and fogs) */
const airOf = (o: { cam: Cam; rest: Cam; frame: number }): AirWorld => {
  const { cam, rest, frame } = o;
  const depth = depthOf(cam);
  const P = perspOf(cam);
  const P0 = perspOf(rest);
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const zM = (c: Cam) => -m(2.2) * Math.log(1 / c.k);
  const base = makeAirView({
    scene: { ...TOWER_SCENE, F: P.Dc * cam.k },
    frame,
    horizon: toSY(depth.eyeY),
    cam: { x: cam.cx, y: -depth.eyeY, z: zM(cam) },
    rest: { x: rest.cx, y: -P0.opts.eyeY, z: zM(rest) },
  });
  const rB = P.r(TOWER_RAMP.ZB);
  const hAtScreen = (sy: number) => {
    const wy = cam.cy + (sy - 960) / cam.k;
    return -(depth.eyeY + (wy - depth.eyeY) / rB);
  };
  const airH = (h: number): RGB => airRamp("A", tOfHeight(h));
  const v = { ...base, airAtScreen: (sy: number) => airH(hAtScreen(sy)), airAt: (_d: number, h = 0) => airH(h) };
  const fog = (Z: number) => C01(base.fogAt(Math.max(0, Z)));
  const airHex = (_Z: number, h = 0) => rgbHex(airH(h));
  const tone = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), fog(Z));
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.45 * fog(Z));
  const figFog = (Z: number) => FIG_FOG.max * (1 - Math.exp(-Math.max(0, Z - FIG_FOG.near) / FIG_FOG.vis));
  const folkFog = (Z: number, feetH = 0) => ({ rgb: airHex(Z, feetH + 150), amount: figFog(Z) });
  const workerInks = (Z: number, feetH = 0) => {
    const air = airHex(Z, feetH + 160);
    const t = figFog(Z);
    return Object.fromEntries(Object.entries(PandemicFolk.WORKER_INKS).map(([key, c]) => [key, key === "orange" ? c : mixHex(c, air, t)])) as typeof PandemicFolk.WORKER_INKS;
  };
  return { v, P, cam, Dc: P.Dc, k: cam.k, fog, airHex, tone, toneO, screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))), figFog, folkFog, workerInks, lw: (b = 1.1) => b / Math.pow(cam.k, 0.6) };
};

// ---- the technical drawing's geometry (metres unless noted) ---------------------------------------------------------
/** the front plane of the drawing (world Z units): just in front of the capital's cap; the ruler and the ceiling's
 *  front edge both live in it, so the ruler's end tick meets the edge exactly */
export const Z_F = zFrontAt(TOWER.capitalY) - m(1.45 + 0.4);
export const GEO = {
  /** the ruler's X: beside the tower with clear air between (an elevation drawing's dimension, reached by the cream
   *  extension line), so it never reads as a cable the tower hangs from */
  xD: 16.0,
  /** the human level (the sill) and the ceiling's underside: ~4.5 tower-heights above the floor */
  hHum: TOWER.cornY,
  hCeil: 70.0,
  /** the ceiling slab's thickness (its hatched front face) and how far back the grid runs before it fades (m) */
  slab: 1.3,
  depth: 85,
  /** the human-level mark's X extent */
  markX0: -1.6,
  markX1: 16.6,
};
/** the k (px per metre on the front plane) for a zoom */
const kForPxm = (pxm: number) => {
  let lo = Math.log(0.002);
  let hi = Math.log(10);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const k = Math.exp(mid);
    const D = DcOf(k);
    if (k * (D / (D + Z_F)) * U > pxm) hi = mid;
    else lo = mid;
  }
  return Math.exp((lo + hi) / 2);
};

// ---- the ruler's tip: from the human level up to the ceiling --------------------------------------------------------
/** it shoots off on "ceiling" (f13), runs fast through the open air and eases to touch the grid on "above" (f48) */
export const TIP = { f0: 13, f1: 48, A: 0.85, B: 1.75 };
const N_INT = 1000;
const TIP_TAB = (() => {
  const tab = [0];
  const v = (i: number) => Math.pow(i / N_INT, TIP.A) * Math.pow(1 - i / N_INT, TIP.B);
  for (let i = 0; i < N_INT; i++) tab.push(tab[i] + (v(i) + v(i + 1)) / 2);
  return tab.map((q) => q / tab[N_INT]);
})();
export const tipS = (f: number) => {
  const x = ((f - TIP.f0) / (TIP.f1 - TIP.f0)) * N_INT;
  if (x <= 0) return 0;
  if (x >= N_INT) return 1;
  const i = Math.floor(x);
  return TIP_TAB[i] + (TIP_TAB[i + 1] - TIP_TAB[i]) * (x - i);
};
/** the ruler tip's height (m) at frame f */
export const tipH = (f: number) => GEO.hHum + (GEO.hCeil - GEO.hHum) * tipS(f);

// ---- the camera ---------------------------------------------------------------------------------------------------
// One move anchored on the ruler's tip (X_D, tipH, Z_F) held at keyed screen points: close on the human (f0-12), the
// crane up with the tip (f13-48), the pull-back to the whole span on "human level" (f55-66).
const END = { tipY: 330, sillY: 1040 };
export const PXM_END = (END.sillY - END.tipY) / (GEO.hCeil - GEO.hHum);
const LNK = pchip([
  [-10, Math.log(kForPxm(44))],
  [0, Math.log(kForPxm(45))],
  [12, Math.log(kForPxm(47))],
  [22, Math.log(kForPxm(36))],
  [34, Math.log(kForPxm(30))],
  [47, Math.log(kForPxm(33))],
  [51, Math.log(kForPxm(30))],
  [64, Math.log(kForPxm(PXM_END))],
  [84, Math.log(kForPxm(PXM_END * 1.03))],
]);
const TY = pchip([
  [-10, 1000],
  [0, 990],
  [12, 965],
  [22, 760],
  [34, 600],
  [47, 445],
  [51, 432],
  [64, END.tipY],
  [84, END.tipY - 2],
]);
const TX = pchip([
  [-10, 985],
  [0, 985],
  [12, 990],
  [26, 760],
  [40, 660],
  [48, 640],
  [66, 640],
  [84, 640],
]);
export const camTrack = (f: number): Cam => frameAtC(Math.exp(LNK(f)), m(GEO.xD), hy(tipH(f)), Z_F, TX(f), TY(f));
const REST = swayCam(camTrack(0), 0);
// ---- strokes ------------------------------------------------------------------------------------------------------
const PAL = AIR.A;
const D = (q: P2[]) => `M${q.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}`;
const seg = (a: P2, b: P2) => `M${a[0].toFixed(2)},${a[1].toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`;
/** screen px -> world units on the current camera, slightly growing with the zoom (the shared module's rule) */
const pxW = (A: AirWorld, px: number) => (px * Math.pow(A.k / 0.058, 0.3)) / A.k;
/** an orange stroke in world space: a soft glow underlay, a deep-orange edge, the core */
const OStroke: React.FC<{ A: AirWorld; d: string; Z: number; h: number; px?: number; a?: number; glow?: number }> = ({ A, d, Z, h, px = 3.0, a = 1, glow = 1 }) => {
  const w = pxW(A, px);
  const col = A.toneO(ACCENT, Z, h);
  const edge = mixHex(A.toneO(ACCENT_DEEP, Z, h), ORANGE_LINE, 0.4);
  return (
    <g>
      {glow > 0 ? <path d={d} fill="none" stroke={col} strokeWidth={w * 3.4} strokeOpacity={0.14 * a * glow} strokeLinecap="round" strokeLinejoin="round" /> : null}
      <path d={d} fill="none" stroke={edge} strokeWidth={w * 1.55} strokeOpacity={0.55 * a} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeOpacity={a} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// ---- THE CEILING: a vast blueprint grid plane seen from below -------------------------------------------------------
// The underside of a slab at hCeil, from the front plane Z_F back GEO.depth metres: a 5 m grid of crisp orange lines with
// a 1 m sub-grid, lines along the depth converging on the vanishing point, the whole plane fading as it recedes; its front
// face (the slab's thickness) a hatched band. It always runs out of frame left and right.
const Ceiling: React.FC<{ A: AirWorld; br: number }> = ({ A, br }) => {
  const P = A.P;
  const { hCeil, slab, depth } = GEO;
  const Yc = hy(hCeil);
  const Yt = hy(hCeil + slab);
  const Z0 = Z_F;
  const Z1 = Z_F + m(depth);
  // X span that covers the frame at the far edge (the near edge needs less)
  const halfX = 700 / (A.k * P.r(Z1));
  const xa = Math.floor((A.cam.cx - halfX) / U) - 1;
  const xb = Math.ceil((A.cam.cx + halfX) / U) + 1;
  const yN = P.p(0, Yc, Z0)[1];
  const yF = P.p(0, Yc, Z1)[1];
  // screen spacing of 1 m at the near edge (px): the sub-grid fades out when it gets too dense
  const sp1 = U * P.r(Z0) * A.k;
  const subA = C01((sp1 - 5) / 9);
  const major: string[] = [];
  const minor: string[] = [];
  for (let x = xa; x <= xb; x++) {
    const d = seg(P.p(m(x), Yc, Z0), P.p(m(x), Yc, Z1));
    (x % 5 === 0 ? major : minor).push(d);
  }
  // lines across (constant depth), each with its own fade
  const across: { d: string; a: number; maj: boolean }[] = [];
  for (let z = 0; z <= depth; z++) {
    const Z = Z0 + m(z);
    const t = z / depth;
    const maj = z % 5 === 0;
    // the 1 m lines thin out where they crowd together far back (screen spacing under ~6 px)
    const gap = Math.abs(P.p(0, Yc, Z)[1] - P.p(0, Yc, Z + m(1))[1]) * A.k;
    const a = (1 - t * t) * (maj ? 1 : C01((gap - 2.5) / 4));
    if (!maj && (subA <= 0.01 || a <= 0.01)) continue;
    across.push({ d: seg(P.p(m(xa), Yc, Z), P.p(m(xb), Yc, Z)), a, maj });
  }
  // the front face: 45 deg hatching between the underside's front edge and the slab's top edge
  const hatch: string[] = [];
  const step = 0.6;
  for (let x = xa - slab; x <= xb; x += step) {
    const x0 = Math.max(xa, x);
    const x1 = Math.min(xb, x + slab);
    if (x1 <= x0) continue;
    hatch.push(seg(P.p(m(x0), hy(hCeil + (x0 - x)), Z0), P.p(m(x1), hy(hCeil + (x1 - x)), Z0)));
  }
  const col = A.toneO(ACCENT, Z0, m(hCeil));
  const colF = A.toneO(ACCENT, Z0 + m(depth * 0.5), m(hCeil));
  const L = P.p(m(xa), Yc, Z0);
  const R = P.p(m(xb), Yc, Z0);
  return (
    <g>
      <defs>
        <linearGradient id="caGridFade" gradientUnits="userSpaceOnUse" x1={0} y1={yN} x2={0} y2={yF}>
          <stop offset="0" stopColor={col} stopOpacity={1} />
          <stop offset="0.6" stopColor={colF} stopOpacity={0.62} />
          <stop offset="0.85" stopColor={colF} stopOpacity={0.3} />
          <stop offset="1" stopColor={colF} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* along the depth: converging on the vanishing point */}
      <path d={minor.join("")} fill="none" stroke="url(#caGridFade)" strokeWidth={pxW(A, 1.2)} strokeOpacity={0.6 * subA * br} />
      <path d={major.join("")} fill="none" stroke="url(#caGridFade)" strokeWidth={pxW(A, 5.0)} strokeOpacity={0.12 * br} />
      <path d={major.join("")} fill="none" stroke="url(#caGridFade)" strokeWidth={pxW(A, 2.3)} strokeOpacity={br} />
      {/* across */}
      {across.map((l, i) => (
        <path key={i} d={l.d} fill="none" stroke={l.maj ? col : colF} strokeWidth={pxW(A, l.maj ? 2.3 : 1.2)} strokeOpacity={(l.maj ? 1 : 0.7 * subA) * l.a * br} />
      ))}
      {/* the front face */}
      <path d={`${D([P.p(m(xa), Yc, Z0), P.p(m(xb), Yc, Z0), P.p(m(xb), Yt, Z0), P.p(m(xa), Yt, Z0)])}Z`} fill={col} fillOpacity={0.1 * br} />
      <path d={hatch.join("")} fill="none" stroke={col} strokeWidth={pxW(A, 1.4)} strokeOpacity={0.75 * br} strokeLinecap="round" />
      <OStroke A={A} d={seg(P.p(m(xa), Yt, Z0), P.p(m(xb), Yt, Z0))} Z={Z0} h={m(hCeil)} a={0.7 * br} px={1.4} glow={0} />
      <OStroke A={A} d={seg(L, R)} Z={Z0} h={m(hCeil)} a={br} px={3.4} />
    </g>
  );
};

// ---- THE RULER: drawn up from the human level by its tip ------------------------------------------------------------
const Ruler: React.FC<{ A: AirWorld; frame: number; br: number }> = ({ A, frame, br }) => {
  const P = A.P;
  const X = m(GEO.xD);
  const hT = tipH(frame);
  const base = P.p(X, hy(GEO.hHum), Z_F);
  const tip = P.p(X, hy(hT), Z_F);
  // ticks on the line's left: every metre from the human level, longer every 5 m, longest every 10 m. The tip runs at
  // up to ~3.5 m a frame, so the 1 m and 5 m ticks would strobe (wagon wheel) while it is fast: they thin out with the
  // speed and come back as it eases; the 10 m ticks (<= 0.35 spacing a frame) stay.
  const speed = Math.abs(tipH(frame + 0.5) - tipH(frame - 0.5));
  const a1 = Math.max(0.0, Math.min(1, 1 - (speed - 0.35) / 0.3));
  const a5 = Math.max(0.15, Math.min(1, 1 - (speed - 1.5) / 0.8));
  const t1: string[] = [];
  const t5: string[] = [];
  const t10: string[] = [];
  const L1 = pxW(A, 7);
  const L5 = pxW(A, 14);
  const L10 = pxW(A, 22);
  for (let i = 1; GEO.hHum + i < GEO.hCeil - 0.4; i++) {
    const h = GEO.hHum + i;
    if (h > hT - 0.15) break;
    const q = P.p(X, hy(h), Z_F);
    const kind = i % 10 === 0 ? 10 : i % 5 === 0 ? 5 : 1;
    const Lk = kind === 10 ? L10 : kind === 5 ? L5 : L1;
    (kind === 10 ? t10 : kind === 5 ? t5 : t1).push(`M${(q[0] - Lk).toFixed(2)},${q[1].toFixed(2)}L${q[0].toFixed(2)},${q[1].toFixed(2)}`);
  }
  const col = A.toneO(ACCENT, Z_F, m(20));
  const moving = tipS(frame) > 0 && tipS(frame) < 1;
  const glowR = pxW(A, 18);
  // the end ticks: across the line at its foot, and at its top where it touches the ceiling
  const eT = pxW(A, 9);
  const touched = C01((frame - TIP.f1 + 1.5) / 3);
  // where the ruler crosses the receding grid on screen, a thin band of air behind it knocks the grid lines out, so the
  // ruler reads in front of and below the ceiling until its tip touches the front edge
  const yN = P.p(X, hy(GEO.hCeil), Z_F)[1];
  const yF = P.p(X, hy(GEO.hCeil), Z_F + m(GEO.depth))[1];
  const k0 = Math.max(tip[1], yN);
  const k1 = Math.min(base[1], yF);
  const kn: [number, number] | null = k1 - k0 > 1 ? [k0, k1] : null;
  return (
    <g>
      <defs>
        {kn ? (
          <linearGradient id="caKnock" gradientUnits="userSpaceOnUse" x1={0} y1={kn[0]} x2={0} y2={kn[1]}>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <stop key={t} offset={t} stopColor={A.screenAir(kn[0] + (kn[1] - kn[0]) * t)} />
            ))}
          </linearGradient>
        ) : null}
        <radialGradient id="caTipGlow">
          <stop offset="0" stopColor={PAL.orangeHot} stopOpacity={0.9} />
          <stop offset="0.35" stopColor={ACCENT} stopOpacity={0.45} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      {kn ? (
        <path d={seg([base[0], kn[0]], [base[0], kn[1]])} fill="none" stroke="url(#caKnock)" strokeWidth={pxW(A, 9)} strokeOpacity={0.85} />
      ) : null}
      {hT > GEO.hHum + 0.05 ? <OStroke A={A} d={seg(base, tip)} Z={Z_F} h={m(20)} a={br} px={2.4} /> : null}
      <path d={t1.join("")} fill="none" stroke={col} strokeWidth={pxW(A, 1.5)} strokeOpacity={0.85 * br * a1} strokeLinecap="round" />
      <path d={t5.join("")} fill="none" stroke={col} strokeWidth={pxW(A, 2.0)} strokeOpacity={br * a5} strokeLinecap="round" />
      <path d={t10.join("")} fill="none" stroke={col} strokeWidth={pxW(A, 2.4)} strokeOpacity={br} strokeLinecap="round" />
      <OStroke A={A} d={seg([base[0] - eT, base[1]], [base[0] + eT, base[1]])} Z={Z_F} h={m(GEO.hHum)} a={br} px={2.4} glow={0} />
      {moving ? <circle cx={tip[0]} cy={tip[1]} r={glowR} fill="url(#caTipGlow)" /> : null}
      {moving ? <circle cx={tip[0]} cy={tip[1]} r={pxW(A, 3.2)} fill={PAL.orangeHot} /> : null}
      {touched > 0 ? (
        <g>
          <circle cx={tip[0]} cy={tip[1]} r={glowR * (1 + 0.6 * touched)} fill="url(#caTipGlow)" opacity={0.9 * (1 - 0.6 * touched)} />
          <OStroke A={A} d={seg([tip[0] - eT * touched, tip[1]], [tip[0] + eT * touched, tip[1]])} Z={Z_F} h={m(GEO.hCeil)} a={br} px={2.6} />
        </g>
      ) : null}
    </g>
  );
};

// ---- the human level: a cream mark across the tower at his sill, running out to the ruler's foot ----------------------
const HumanMark: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const Y = hy(GEO.hHum);
  const a = P.p(m(GEO.markX0), Y, Z_F);
  const b = P.p(m(GEO.markX1), Y, Z_F);
  const col = A.tone(PAL.cream, Z_F, m(GEO.hHum));
  const t = pxW(A, 6);
  const fine: string[] = [];
  for (const [x, L] of [[GEO.markX0, t * 1.8], [-1.35, t], [1.35, t]] as [number, number][]) {
    const q = P.p(m(x), Y, Z_F);
    fine.push(`M${q[0].toFixed(2)},${(q[1] - L).toFixed(2)}L${q[0].toFixed(2)},${(q[1] + L * 0.5).toFixed(2)}`);
  }
  return (
    <g>
      <path d={D([a, b])} fill="none" stroke={PAL.shadow} strokeOpacity={0.25} strokeWidth={pxW(A, 4.2)} strokeLinecap="round" />
      <path d={D([a, b])} fill="none" stroke={col} strokeWidth={pxW(A, 2.2)} strokeLinecap="round" />
      <path d={fine.join("")} fill="none" stroke={col} strokeWidth={pxW(A, 1.4)} strokeLinecap="round" />
    </g>
  );
};

// ---- the tower's footing: a faint lit patch of floor under it and a soft dark contact shadow at its base -------------
// (in the wide end frame the small tower floated over the hazed floor; the shared scene draws no shadow under it)
const Footing: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const Zb = TOWER.zFront + m(TOWER.R0 * 0.35);
  const c = P.p(TOWER.X, 0, Zb);
  const ellipse = (rM: number, dM: number, minPx: number) => {
    const rx = m(rM) * P.r(Zb);
    const ry = Math.max(minPx / A.k, Math.abs(P.p(TOWER.X, 0, Zb - m(dM))[1] - P.p(TOWER.X, 0, Zb + m(dM))[1]) / 2);
    return { rx, ry };
  };
  const lit = ellipse(TOWER.R0 * 2.4, TOWER.R0 * 1.6, 26);
  const sh = ellipse(TOWER.R0 * 1.25, TOWER.R0 * 0.7, 9);
  const floorLit = A.tone(mixHex(PAL.cream, PAL.shadow, 0.35), TOWER.zFront, 0);
  return (
    <g>
      <defs>
        <radialGradient id="caFootLit">
          <stop offset="0" stopColor={floorLit} stopOpacity={0.42} />
          <stop offset="0.55" stopColor={floorLit} stopOpacity={0.2} />
          <stop offset="1" stopColor={floorLit} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="caFootShadow">
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.85} />
          <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.48} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={lit.rx} ry={lit.ry} fill="url(#caFootLit)" />
      <ellipse cx={c[0] + sh.rx * 0.08} cy={c[1]} rx={sh.rx} ry={sh.ry} fill="url(#caFootShadow)" />
    </g>
  );
};

const CeilingAboveUs: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camTrack(frame), frame);
  const A = airOf({ cam, rest: REST, frame });
  const br = 0.88 + 0.12 * Math.sin((2 * Math.PI * frame) / 64);
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        {/* the shared TowerScene's parts, with a contact shadow on the floor under the tower (it floated in the wide) */}
        <TowerFloor A={A} uid="twfl" />
        <Footing A={A} />
        <SpeciesTower A={A} frame={frame} show={{ dashed: 0 }} human occupants={{}} uid="tw" />
        <Ceiling A={A} br={br} />
        <HumanMark A={A} />
        <Ruler A={A} frame={frame} br={br} />
      </WorldSvg>
    </AirStage>
  );
};

export default CeilingAboveUs;
