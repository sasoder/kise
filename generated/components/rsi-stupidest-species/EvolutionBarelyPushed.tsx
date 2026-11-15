// ---------------------------------------------------------------------------
// EvolutionBarelyPushed (rsi-stupidest-species, cut 51). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 113 frames. Built on the shared world W1 THE SPECIES TOWER (speciesTower.tsx, read-only;
// TOWER_READY.md is its API: TowerFloor, SpeciesTower, TowerHuman, the camera presets) and W2's Chimp (stupidestFolk.tsx,
// read-only). The shared Hoist is OFF (its gallows read as a hanging, director's review): this cut draws its own MAST
// LIFT (the director's spec), its camera, the chimp in its niche with a soft cool-cream niche light, the EVOLUTION plate
// on a signpost. No dashed continuation (director's note: in this wide it never reaches the ceiling and its edges read
// as cables hanging the tower): bright open air above the capital.
//
// CHECK LINE: "Evolution only hoisted us a little way up: it never pushed hard for intelligence, and the tower above
//   stays empty."
//
// THE LINE: "The second reason is that human evolution just didn't optimize us that strongly for intelligence."
// WORD -> FRAME: The -1 · second 3 · reason 8 · is 15 · that 25 · human 28 · evolution 34 · just 42 · didn't 56 ·
//   optimize 61 · us 70 · that 78 · strongly 84 · for 92 · intelligence 98
// DURATION: the slot 51.093 -> 55.806 s (sequence frames 1225-1338) = 4.713 s x 23.976 = 113 frames (f0..f112).
//
// THE MOTION: one lift. f0 the foot of the tower: a timber mast (an iron rack up its edge, a chain up its front over a
// sprocket at its top, 5.4 m, below the arriving human's head) with the crank wheel at its foot and the EVOLUTION plate
// on a signpost beside it; the deck is cantilevered off an iron carriage collar on the mast (two knee braces under it,
// nothing above anyone), at its lowest stop with the human on it, beside the chimp sitting in its niche (lit soft
// cool cream). The crank turns slowly from f0, winding the chain's slack (its belly beside the mast straightens); the
// chain pulls taut and the carriage lifts at LIFT (f28, "human"); the deck rises lazily up the face past the chimp's
// niche (the chimp turns its head up to watch) while the camera rises with it and, from "optimize us", cranes up and
// pulls back. On "that strongly" the crank slows to a stop and the deck arrives flush with the human's sill (~f94), a
// small settle on the chain; the camera carries on up and out (settled ~f104) to the long empty face, the empty grand
// niche, the stone capital and bright open air above it. f98-112 the living hold. One job: evolution lifted us
// only a little way.
// CAUSE BEFORE EFFECT: chain wound = -crank x the crank wheel's radius (LIFT.crank.R); the deck's rise = the chain wound
// less the slack (SLACK0, taken up f0-27); the slack's belly is what is left of it; the pinion on the rack and the top
// sprocket turn by the same travel. Lift-off f28 (the chain taut f27); the crank stops at PLAN.stopB (f95); the settle
// starts as it stops (the crank held). The check script asserts deck = crank on every frame.
// Orange = intelligence (the clip's rule): none in this cut (the dashed continuation is off). The human, the chimp, the
// lift and the stone in the style's earthy timber, iron and stone. The human's niche keeps its warm cream light
// (brighter); the chimp's niche a soft cool cream (dimmer, never orange).
// THE CHIMP: W2's Chimp variant 0, CHIMP_POSES.sit, tucked to the left of its niche (CHIMP_U -0.58 m), the human a little
// right of the deck's middle (RIDER_U 0.1 m). Measured (check script): the human's head and body never cover its face;
// only the deck passes over it (f51-59). Its face stays above y 1050 on every frame. It watches: head and eyes turn up
// after the human as he rises past (chimpUp, from the planned height: seek-safe).
// SIZES (measured): the human ~220 px at f0, ~88 px in the resolved wide (50 px/m); the EVOLUTION plate's cap 43 px at
// f0, >= 34 px to ~f72, ~17 px in the wide; the plate inside the keep-in box on every frame.
// DASHES: none. The shared SpeciesTower's dashed part is off (show.dashed 0) and this cut draws no ghost continuation.
//
// DEPTH: the tower's own depth camera (towerPersp: eye 0.85 x the frame centre's height + 0.6 m, >= 1.7 m; dRef 30000,
// kRef 0.058, dolly 0.6), fog by world depth (towerAirOf). Depths: the platform's middle platZ().zM (~1.8 m in front of
// the cornice face), the mast and the chain at the same depth, the crank 0.25 m nearer, the chimp 0.45 m inside its niche.
// CAMERA: keys through the shared towerCamTrack (pchip on ln k / cx / cy + the house damped follow), the keys framed on
// the platform's PLANNED height (never the bounce): f0 TOWER_CAM.F_open, a drift up, the rise, the pull-back to RES.
//
// SOURCES: none (no real figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirShadow, AirStage, MAT, WorldSvg, c01, lineOf, smoothstep, swayCam, type AirWorld, type Cam, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  SoftPlate,
  SpeciesTower,
  TOWER,
  TOWER_CAM,
  TowerFloor,
  TowerHuman,
  archUV,
  deckH,
  frameAt,
  hy,
  kForScale,
  lwT,
  m,
  nicheOf,
  nichePt,
  platZ,
  sillAnchor,
  towerAirOf,
  towerCamTrack,
  type OccupantFn,
} from "./speciesTower";
import { CHIMP_POSES, Chimp } from "./stupidestFolk";

export const FPS = 24000 / 1001;
export const DURATION = 113;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ===================================================================================================================
// THE LIFT'S PLAN (pure: the check script imports it)
// ===================================================================================================================
/** the chain's winding speed (shape only; scaled below): slow from f0, lazy and steady through the rise, easing to a
 *  stop on "that strongly" */
export const PLAN = { LIFT: 27, rampA: 6, rampB: 34, v0: 0.24, stopA: 72, stopB: 95, bounceA: 0.06, bounceT: 15, bounceTau: 7 };
const vShape = (f: number) => (PLAN.v0 + (1 - PLAN.v0) * smoothstep(PLAN.rampA, PLAN.rampB, f)) * (1 - smoothstep(PLAN.stopA, PLAN.stopB, f));
const STEP = 0.25;
const I_TAB = (() => {
  const tab = [0];
  for (let i = 0; i * STEP < DURATION + 4; i++) tab.push(tab[i] + ((vShape(i * STEP) + vShape((i + 1) * STEP)) / 2) * STEP);
  return tab;
})();
const Iraw = (f: number) => {
  const x = Math.max(0, f) / STEP;
  const i = Math.min(I_TAB.length - 2, Math.floor(x));
  return I_TAB[i] + (I_TAB[i + 1] - I_TAB[i]) * Math.min(1, x - i);
};
// ===================================================================================================================
// THE MAST LIFT (metres; X across, h up). A timber mast on the floor right of the deck, an iron rack of teeth up its
// front-left edge; an iron-banded carriage collar rides it, the deck cantilevered out to the left of it on two knee
// braces under the deck; a chain from the carriage runs up the mast's front, over a sprocket at its top (5.4 m, below the
// arriving human's head) and down to the crank wheel at its foot. The crank winds the chain: chain wound = crank angle x
// crank radius = the carriage's rise (+ the slack at f0), so the crank and the carriage always agree.
// ===================================================================================================================
export const LIFT = {
  /** the deck: X span, thickness; its top at the lowest stop (the braces' feet and the collar's foot on the floor) */
  deckX0: -1.15,
  deckX1: 1.36,
  deckT: 0.26,
  braceDrop: 0.45,
  deck0Top: 0.26 + 0.45,
  /** the mast */
  mastX0: 1.45,
  mastX1: 1.75,
  mastD: 0.3,
  mastTop: 5.55,
  /** the rack: iron teeth up the mast's front-left edge */
  rackH0: 0.3,
  rackH1: 5.3,
  rackStep: 0.18,
  /** the carriage collar round the mast: above the deck top by collarUp */
  collarX0: 1.36,
  collarX1: 1.84,
  collarUp: 0.35,
  /** the top sprocket (the chain over it) and the crank wheel at the foot */
  topSpr: { X: 1.75, h: 5.38, R: 0.14 },
  crank: { X: 2.23, h: 0.95, R: 0.34, arm: 0.5 },
  /** the chain: the up strand on the mast's front, the down strand just right of the mast */
  chainUpX: 1.61,
  chainDownX: 1.89,
};
/** the platform's whole rise (m): the deck from its lowest stop to flush with the human's sill */
export const RISE = TOWER.cornY - LIFT.deck0Top;
const SCALE = RISE / (Iraw(PLAN.stopB + 2) - Iraw(PLAN.LIFT));
/** the chain wound by the crank since f0 (m) */
export const wound = (f: number) => Iraw(f) * SCALE;
/** the slack in the chain at f0 (m): taken up by LIFT */
export const SLACK0 = wound(PLAN.LIFT);
/** the planned rise (m, no bounce) */
export const risePlan = (f: number) => Math.max(0, wound(f) - SLACK0);
/** the settle bounce (m): the crank stops, the carriage settles on the chain a moment */
export const bounce = (f: number) => {
  const u = f - (PLAN.stopB - 3);
  if (u <= 0) return 0;
  return PLAN.bounceA * smoothstep(0, 3, u) * Math.sin((2 * Math.PI * u) / PLAN.bounceT) * Math.exp(-u / PLAN.bounceTau);
};
/** the platform's height t (0 floor .. 1 the sill) */
export const platT = (f: number) => (risePlan(f) + bounce(f)) / RISE;
export const platTPlan = (f: number) => risePlan(f) / RISE;
/** the deck's top (m) now and as planned (no bounce) */
export const deckTopAt = (f: number) => LIFT.deck0Top + risePlan(f) + bounce(f);
export const deckTopPlan = (f: number) => LIFT.deck0Top + risePlan(f);
/** the crank (rad, screen sense: + = clockwise): the chain wound / the crank wheel's radius (crankFor's sense) */
export const crankAt = (f: number) => -wound(f) / LIFT.crank.R;
/** the slack's share left (1 at f0, 0 from LIFT): the chain's belly */
export const slackAt = (f: number) => c01(1 - wound(f) / SLACK0);

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
const ZP = platZ().zM;
/** the camera that shows the platform plane at pxPerM px per metre, the deck (height dk m) at screen y sy, and world X
 *  xa (m) at the frame's centre column */
export const camDeck = (pxPerM: number, xa: number, dk: number, sy: number): Cam => frameAt(kForScale(pxPerM, ZP), m(xa), hy(dk), ZP, 540, sy);
const S_OPEN = 220 / 1.75;
/** the resolved wide: the platform flush with the sill near y RES_Y, the stone capital high, open air above */
export const RES = { px: 50, xa: 0.5, y: 945, creep: 1.012 };
export const CAM_KEYS: { f: number; cam: Cam }[] = [
  { f: 0, cam: TOWER_CAM.F_open },
  { f: 26, cam: camDeck(S_OPEN * 1.015, 1.2, deckH(0) + 0.1, 1010) },
  { f: 58, cam: camDeck(S_OPEN * 0.96, 1.0, deckH(platTPlan(58) * 0.86), 975) },
  { f: 82, cam: camDeck(77, 0.72, deckH(platTPlan(82)), 895) },
  { f: 104, cam: camDeck(RES.px, RES.xa, deckH(1), RES.y) },
  { f: DURATION - 1, cam: (() => { const c = camDeck(RES.px, RES.xa, deckH(1), RES.y); return { ...c, k: c.k * RES.creep }; })() },
];
export const camTrack = towerCamTrack(CAM_KEYS, DURATION);
const REST = swayCam(camTrack(0), 0);

// ===================================================================================================================
// THE CHIMP IN ITS NICHE
// ===================================================================================================================
/** the chimp's offset in its niche (m, - = screen left) and inset from the face (m) */
export const CHIMP_U = -0.58;
/** the human stands a little right of the deck's middle (m): clear of the chimp's face */
export const RIDER_U = 0.1;
export const CHIMP_INSET = 0.45;
export const CHIMP_SPOT_F = sillAnchor("chimp", CHIMP_U, CHIMP_INSET);
/** the chimp's eyes' height (m): its face ~2.4 m up (TOWER_READY) */
const CHIMP_EYE_H = 2.4;
/** how far its gaze has turned up to follow the human (0 = at him beside it, 1 = up at him above it) */
export const chimpUp = (f: number) => smoothstep(-0.3, 2.2, deckTopPlan(f) + 1.55 - CHIMP_EYE_H);
export const chimpPoseAt = (f: number) => {
  const u = chimpUp(f);
  return CHIMP_POSES.sit(1, f, { headYaw: 0.3 - 0.14 * u, look: [0.42 - 0.24 * u, -0.08 - 0.5 * u], pitch: -1 - 9 * u });
};
/** the chimp's niche light: a soft cool cream (dimmer than the human's warm cream; never orange) */
export const CHIMP_LIGHT = { hi: "#E4E5D7", mid: "#C6CABB", lo: "#8F978C", a: 0.9, spill: 0.2 };
const chimpNiche = nicheOf("chimp");
const ChimpNicheGlow: React.FC<{ A: AirWorld }> = ({ A }) => {
  const n = chimpNiche;
  const back = archUV(n, 28).map(([u, v]) => A.P.p(...nichePt(n, u, v, n.depth)));
  const c = A.P.p(...nichePt(n, 0, n.h * 0.5, n.depth));
  const a = A.P.p(...nichePt(n, -n.w / 2, 0, 0));
  const b = A.P.p(...nichePt(n, n.w / 2, 0, 0));
  const wPx = Math.abs(b[0] - a[0]);
  const d = `M${back.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}Z`;
  return (
    <g>
      <defs>
        <radialGradient id="ebpChGl" gradientUnits="userSpaceOnUse" cx={c[0].toFixed(2)} cy={c[1].toFixed(2)} r={(wPx * 0.85).toFixed(2)} gradientTransform={`translate(${c[0].toFixed(2)} ${c[1].toFixed(2)}) scale(1 1.45) translate(${(-c[0]).toFixed(2)} ${(-c[1]).toFixed(2)})`}>
          <stop offset="0" stopColor={CHIMP_LIGHT.hi} stopOpacity={CHIMP_LIGHT.a} />
          <stop offset="0.5" stopColor={CHIMP_LIGHT.mid} stopOpacity={0.6 * CHIMP_LIGHT.a} />
          <stop offset="1" stopColor={CHIMP_LIGHT.lo} stopOpacity={0.22 * CHIMP_LIGHT.a} />
        </radialGradient>
      </defs>
      <path d={d} fill="url(#ebpChGl)" />
    </g>
  );
};
/** the faint cool spill out of the chimp's niche onto the stone round it */
const ChimpNicheSpill: React.FC<{ A: AirWorld }> = ({ A }) => {
  const n = chimpNiche;
  const c = A.P.p(...nichePt(n, 0, n.h * 0.45, 0));
  const a = A.P.p(...nichePt(n, -n.w / 2, 0, 0));
  const b = A.P.p(...nichePt(n, n.w / 2, 0, 0));
  const wPx = Math.abs(b[0] - a[0]);
  // never over the opening (the chimp): clipped outside the niche's front outline
  const front = archUV(n, 28).map(([u, v]) => A.P.p(...nichePt(n, u, v, 0)));
  const B = 1e6;
  const cut = `M${-B},${-B}L${B},${-B}L${B},${B}L${-B},${B}Z M${front.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}Z`;
  return (
    <g clipPath="url(#ebpChSpCl)">
      <defs>
        <clipPath id="ebpChSpCl" clipPathUnits="userSpaceOnUse">
          <path d={cut} clipRule="evenodd" />
        </clipPath>
        <radialGradient id="ebpChSp">
          <stop offset="0" stopColor={CHIMP_LIGHT.hi} stopOpacity={CHIMP_LIGHT.spill} />
          <stop offset="0.55" stopColor={CHIMP_LIGHT.hi} stopOpacity={CHIMP_LIGHT.spill * 0.4} />
          <stop offset="1" stopColor={CHIMP_LIGHT.hi} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={wPx * 1.15} ry={wPx * 1.1} fill="url(#ebpChSp)" />
    </g>
  );
};
const chimpOccupant: OccupantFn = ({ A, frame }) => {
  const s = CHIMP_SPOT_F;
  const at = A.P.p(s.X, s.Y, s.Z);
  return (
    <g>
      <ChimpNicheGlow A={A} />
      <Chimp variant={0} pose={chimpPoseAt(frame)} at={at} scale={A.P.r(s.Z)} uid="ebpChimp" fog={A.folkFog(s.Z)} unitPx={A.cam.k} />
    </g>
  );
};

// ===================================================================================================================
// THE MAST LIFT (drawing)
// ===================================================================================================================
const TIMBER = MAT.timber;
const IRON = MAT.iron;
type V3 = [number, number, number];
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const polyD = (q: P2[], close = true) => `M${q.map(Pt).join("L")}${close ? "Z" : ""}`;
/** a timber strut between two 3D points (width w world units): a quad, its lit band and outline */
const Strut: React.FC<{ A: AirWorld; a: V3; b: V3; w: number; mt?: Mat }> = ({ A, a, b, w, mt = TIMBER }) => {
  const pa = A.P.p(...a);
  const pb = A.P.p(...b);
  const dx = pb[0] - pa[0];
  const dy = pb[1] - pa[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  const wa = (w * A.P.r(a[2])) / 2;
  const wb = (w * A.P.r(b[2])) / 2;
  const s = nx * -0.55 + ny * -0.83 > 0 ? 1 : -1;
  const q: P2[] = [
    [pa[0] + nx * wa, pa[1] + ny * wa],
    [pb[0] + nx * wb, pb[1] + ny * wb],
    [pb[0] - nx * wb, pb[1] - ny * wb],
    [pa[0] - nx * wa, pa[1] - ny * wa],
  ];
  const lit: P2[] = [q[s > 0 ? 0 : 3], q[s > 0 ? 1 : 2], [pb[0] + s * nx * wb * 0.1, pb[1] + s * ny * wb * 0.1], [pa[0] + s * nx * wa * 0.1, pa[1] + s * ny * wa * 0.1]];
  const Z = (a[2] + b[2]) / 2;
  const h = -(a[1] + b[1]) / 2;
  const t = (hex: string) => A.tone(hex, Z, h);
  return (
    <g>
      <path d={polyD(q)} fill={t(mt.mid)} />
      <path d={polyD(lit)} fill={t(mt.lit)} fillOpacity={0.75} />
      <path d={polyD(q)} fill="none" stroke={t(lineOf(mt))} strokeWidth={lwT(A, 1.0)} strokeLinejoin="round" />
    </g>
  );
};
/** an iron wheel on the chain's plane: rim, hub, spokes turned by `turn` */
const Wheel: React.FC<{ A: AirWorld; X: number; h: number; Z: number; R: number; turn: number; spokes?: number; mt?: Mat }> = ({ A, X, h, Z, R, turn, spokes = 4, mt = IRON }) => {
  const c = A.P.p(m(X), hy(h), Z);
  const r = m(R) * A.P.r(Z);
  let sp = "";
  for (let j = 0; j < spokes; j++) {
    const a = turn + (j * 2 * Math.PI) / spokes;
    sp += `M${Pt([c[0] + 0.22 * r * Math.cos(a), c[1] + 0.22 * r * Math.sin(a)])}L${Pt([c[0] + 0.8 * r * Math.cos(a), c[1] + 0.8 * r * Math.sin(a)])}`;
  }
  const t = (hex: string) => A.tone(hex, Z, m(h));
  return (
    <g>
      <circle cx={c[0]} cy={c[1]} r={r} fill={t(mt.mid)} stroke={t(lineOf(mt))} strokeWidth={lwT(A, 1.1)} />
      <circle cx={c[0]} cy={c[1]} r={r * 0.84} fill="none" stroke={t(mt.dark)} strokeWidth={lwT(A, 0.9)} strokeOpacity={0.55} />
      <path d={sp} stroke={t(lineOf(mt))} strokeWidth={lwT(A, 1.3)} strokeLinecap="round" />
      <circle cx={c[0]} cy={c[1]} r={r * 0.2} fill={t(IRON.dark)} />
    </g>
  );
};
/** an iron chain along a 3D polyline: a dark strand and links that travel with the chain (offset = chain wound, m) */
const Chain: React.FC<{ A: AirWorld; pts: V3[]; travel: number }> = ({ A, pts, travel }) => {
  const d = polyD(pts.map((q) => A.P.p(...q)), false);
  const Z = pts[0][2];
  const h = -pts.reduce((s, q) => s + q[1], 0) / pts.length;
  const r = A.P.r(Z);
  const w = Math.max(m(0.05) * r, 1.4 / A.k);
  const link = m(0.13) * r;
  const gap = m(0.11) * r;
  return (
    <g>
      <path d={d} fill="none" stroke={A.tone(IRON.dark, Z, h)} strokeWidth={w * 1.25} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={A.tone(IRON.lit, Z, h)} strokeWidth={w * 0.6} strokeDasharray={`${link.toFixed(2)} ${gap.toFixed(2)}`} strokeDashoffset={(-m(travel) * r).toFixed(2)} strokeLinecap="round" />
    </g>
  );
};
/** the soft belly of a slack chain: a bow to the right (m) at the span's middle */
const bowed = (a: V3, b: V3, bow: number, N = 14): V3[] =>
  Array.from({ length: N + 1 }, (_, i) => {
    const u = i / N;
    return [a[0] + (b[0] - a[0]) * u + m(bow) * 4 * u * (1 - u), a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u] as V3;
  });
/** the whole lift at frame f, the rider on the deck */
const MastLift: React.FC<{ A: AirWorld; frame: number; rider: React.ReactNode }> = ({ A, frame, rider }) => {
  const L = LIFT;
  const pz = platZ();
  const zM = pz.zM;
  const zMast0 = zM - m(L.mastD / 2);
  const zMast1 = zM + m(L.mastD / 2);
  const zChain = zMast0 - 8;
  const dk = deckTopAt(frame);
  const db = dk - L.deckT;
  const rise = dk - L.deck0Top;
  const collarTop = dk + L.collarUp;
  const collarBot = db - L.braceDrop;
  const travel = wound(frame);
  const els: React.ReactNode[] = [];
  // the deck's contact shadow while it sits low, the mast's and the crank's
  els.push(<AirShadow key="sd" A={A} X={m((L.deckX0 + L.deckX1) / 2)} Z={zM} w={m(1.3)} d={m(0.75)} uid="ebpLsD" amt={0.5 * (1 - c01(rise / 0.9))} />);
  els.push(<AirShadow key="sm" A={A} X={m((L.mastX0 + L.mastX1) / 2)} Z={zM} w={m(0.35)} d={m(0.3)} uid="ebpLsM" amt={0.6} />);
  els.push(<AirShadow key="sc" A={A} X={m(L.crank.X)} Z={zChain - m(0.3)} w={m(0.75)} d={m(0.45)} uid="ebpLsC" amt={0.6} />);
  // the back knee brace (behind the mast and the deck)
  const braceTo = 0.45;
  els.push(<Strut key="bb" A={A} a={[m(L.collarX0), hy(collarBot + 0.06), pz.zB - m(0.12)]} b={[m(braceTo), hy(db), pz.zB - m(0.12)]} w={m(0.13)} />);
  // the mast, its rack and the chain's up strand on its front
  els.push(<AirBox key="mast" A={A} X0={m(L.mastX0)} X1={m(L.mastX1)} Y0={hy(L.mastTop)} Y1={0} Z0={zMast0} Z1={zMast1} mat={TIMBER} uid="ebpMast" lw={lwT(A, 1.0)} />);
  let teeth = "";
  for (let h = L.rackH0; h <= L.rackH1 + 1e-6; h += L.rackStep) {
    const a = A.P.p(m(L.mastX0 - 0.05), hy(h + 0.075), zMast0 - 4);
    const b = A.P.p(m(L.mastX0 + 0.08), hy(h), zMast0 - 4);
    teeth += `M${Pt(a)}L${Pt([b[0], a[1]])}L${Pt(b)}L${Pt([a[0], b[1]])}Z`;
  }
  els.push(<path key="rack" d={teeth} fill={A.tone(IRON.mid, zMast0, m(2.5))} stroke={A.tone(lineOf(IRON), zMast0, m(2.5))} strokeWidth={lwT(A, 0.7)} />);
  const ts = L.topSpr;
  els.push(<Chain key="cu" A={A} pts={[[m(L.chainUpX), hy(collarTop - 0.05), zChain], [m(L.chainUpX), hy(ts.h), zChain]]} travel={travel} />);
  // the carriage collar (iron-banded timber) and its pinion on the rack
  els.push(<AirBox key="col" A={A} X0={m(L.collarX0)} X1={m(L.collarX1)} Y0={hy(collarTop)} Y1={hy(collarBot)} Z0={zM - m(0.24)} Z1={zM + m(0.24)} mat={IRON} uid="ebpCol" lw={lwT(A, 1.0)} />);
  const band = (h: number) => `M${Pt(A.P.p(m(L.collarX0), hy(h), zM - m(0.24) - 2))}L${Pt(A.P.p(m(L.collarX1), hy(h), zM - m(0.24) - 2))}`;
  els.push(<path key="colb" d={band(collarTop - 0.1) + band(collarBot + 0.1)} stroke={A.tone(IRON.lit, zM, m(dk))} strokeWidth={lwT(A, 1.2)} strokeOpacity={0.7} />);
  els.push(<Wheel key="pin" A={A} X={L.collarX0 + 0.13} h={db + 0.05} Z={zM - m(0.24) - 6} R={0.11} turn={-rise / 0.11} spokes={3} />);
  // the deck (cantilevered off the collar) with its planks, the front knee brace under it, the rider on it
  els.push(<AirBox key="deck" A={A} X0={m(L.deckX0)} X1={m(L.deckX1)} Y0={hy(dk)} Y1={hy(db)} Z0={pz.zF} Z1={pz.zB} mat={TIMBER} uid="ebpDeck" lw={lwT(A, 1.0)} />);
  let planks = "";
  for (let i = 1; i < 6; i++) {
    const x = m(L.deckX0 + ((L.deckX1 - L.deckX0) * i) / 6);
    planks += `M${Pt(A.P.p(x, hy(dk), pz.zF))}L${Pt(A.P.p(x, hy(db), pz.zF))}`;
    if (hy(dk) > A.P.horizonY) planks += `M${Pt(A.P.p(x, hy(dk), pz.zF))}L${Pt(A.P.p(x, hy(dk), pz.zB))}`;
  }
  els.push(<path key="pl" d={planks} stroke={A.tone(lineOf(TIMBER), zM, m(dk))} strokeWidth={lwT(A, 0.8)} strokeOpacity={0.55} />);
  els.push(<Strut key="bf" A={A} a={[m(L.collarX0), hy(collarBot + 0.06), pz.zF + m(0.12)]} b={[m(braceTo), hy(db), pz.zF + m(0.12)]} w={m(0.13)} />);
  els.push(<g key="rider">{rider}</g>);
  // the top sprocket, the chain over it and down (its slack belly at f0) to the crank wheel
  const cr = L.crank;
  const down = bowed([m(L.chainDownX), hy(ts.h), zChain], [m(L.chainDownX), hy(cr.h), zChain], 0.22 * slackAt(frame));
  const over: V3[] = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI - (Math.PI * i) / 6;
    return [m(ts.X + ts.R * Math.cos(a)), hy(ts.h + ts.R * Math.sin(a)), zChain] as V3;
  });
  els.push(<Chain key="cd" A={A} pts={[...over, ...down.slice(1)]} travel={travel} />);
  els.push(<Wheel key="ts" A={A} X={ts.X} h={ts.h} Z={zChain - 4} R={ts.R * 0.8} turn={-travel / ts.R} spokes={3} />);
  // the crank: an A-trestle, the wheel (the chain wound on its hub), the iron arm and the timber handle
  const zC = zChain - 10;
  const legs = (zz: number, k: string) => (
    <g key={k}>
      <Strut A={A} a={[m(cr.X - 0.55), 0, zz]} b={[m(cr.X), hy(cr.h + 0.1), zz]} w={m(0.13)} />
      <Strut A={A} a={[m(cr.X + 0.55), 0, zz]} b={[m(cr.X), hy(cr.h + 0.1), zz]} w={m(0.13)} />
      <Strut A={A} a={[m(cr.X - 0.38), hy(0.32), zz]} b={[m(cr.X + 0.38), hy(0.32), zz]} w={m(0.1)} />
    </g>
  );
  els.push(legs(zC + m(0.35), "lb"));
  els.push(<Wheel key="cw" A={A} X={cr.X} h={cr.h} Z={zC} R={cr.R} turn={crankAt(frame)} spokes={5} mt={TIMBER} />);
  els.push(legs(zC - m(0.3), "lf"));
  const ca = crankAt(frame);
  const cF = A.P.p(m(cr.X), hy(cr.h), zC - m(0.34));
  const hx: P2 = [cF[0] + m(cr.arm) * A.P.r(zC - m(0.34)) * Math.cos(ca), cF[1] + m(cr.arm) * A.P.r(zC - m(0.34)) * Math.sin(ca)];
  const hz = zC - m(0.34);
  const hOut = A.P.p(m(cr.X) + m(cr.arm) * Math.cos(ca), hy(cr.h) + m(cr.arm) * Math.sin(ca), hz - m(0.4));
  els.push(<path key="arm" d={`M${Pt(cF)}L${Pt(hx)}`} stroke={A.tone(IRON.mid, hz, m(cr.h))} strokeWidth={m(0.06) * A.P.r(hz)} strokeLinecap="round" />);
  els.push(<circle key="ax" cx={cF[0]} cy={cF[1]} r={m(0.07) * A.P.r(hz)} fill={A.tone(IRON.dark, hz, m(cr.h))} />);
  els.push(<path key="hd" d={`M${Pt(hx)}L${Pt(hOut)}`} stroke={A.tone(TIMBER.lit, hz, m(cr.h))} strokeWidth={m(0.075) * A.P.r(hz)} strokeLinecap="round" />);
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE EVOLUTION PLATE (on its own short timber signpost right of the crank, at the mast's foot)
// ===================================================================================================================
export const PLATE = { X: 3.35, h: 2.45, capM: 0.34, postW: 0.13 };
const Plate: React.FC<{ A: AirWorld }> = ({ A }) => {
  const Z = platZ().zM - m(0.45);
  return (
    <g>
      <AirShadow A={A} X={m(PLATE.X)} Z={Z} w={m(0.25)} d={m(0.2)} uid="ebpPlS" amt={0.55} />
      <AirBox A={A} X0={m(PLATE.X - PLATE.postW / 2)} X1={m(PLATE.X + PLATE.postW / 2)} Y0={hy(PLATE.h)} Y1={0} Z0={Z} Z1={Z + m(PLATE.postW)} mat={TIMBER} uid="ebpPlP" lw={lwT(A, 1.0)} />
      <SoftPlate A={A} X={m(PLATE.X)} Y={hy(PLATE.h)} Z={Z - 8} text="EVOLUTION" capM={PLATE.capM} t={1} uid="ebpPlate" />
    </g>
  );
};
const EvolutionBarelyPushed: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camTrack(frame), frame);
  const A = towerAirOf({ cam, rest: REST, frame });
  const spot = { X: m(RIDER_U), Y: hy(deckTopAt(frame)), Z: platZ().zM + 20 };
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <TowerFloor A={A} uid="ebpFl" />
        <SpeciesTower A={A} frame={frame} show={{ dashed: 0 }} human={false} occupants={{ chimp: chimpOccupant }} uid="tw" />
        <ChimpNicheSpill A={A} />
        <MastLift A={A} frame={frame} rider={<TowerHuman A={A} spot={spot} frame={frame} uid="twRider" shadow={0.6} />} />
        <Plate A={A} />
      </WorldSvg>
    </AirStage>
  );
};

export default EvolutionBarelyPushed;
