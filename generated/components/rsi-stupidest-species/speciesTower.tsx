// ---------------------------------------------------------------------------
// speciesTower — THE SPECIES TOWER, the shared world W1 of rsi-stupidest-species (cuts A, B, C, F). Dwarkesh 3D style
// (styles/dwarkesh-3d.md), kit kits/dwarkesh-3d/dwarkesh3d. Read-only for cut builders: additions go through the
// director (keep old names, log new ones in animation_source/notes/SHARED_CHANGES.md). Marker: TOWER_READY.md.
//
// THE PICTURE: INTELLIGENCE IS HEIGHT. One tall round stone tower (gently tapering, courses of big blocks, warm
// grey-umber stone, cream rims upper left) stands on the sandy floor in the misty teal air. Up its front, arched
// alcoves (NICHES), dark inside and cream-rimmed: a centre column (the chimp's, the human's, the empty GRAND niche
// under the capital) and four flanking columns at +-30 and +-58 deg (all empty). A broad drum: 24 m wide, the stone
// 15.6 m tall, the dashed part rising to 35 m (so cut A's wide holds the lit niche AND the ceiling at a readable size). Low down a moulded CORNICE rings
// the tower = THE TECHNOLOGICAL-CIVILIZATION LINE; the chimp's niche is just below it, the human's (the one lit, warm
// cream) sits right on it. The stone ends at the CAPITAL = THE SMARTEST POSSIBLE BIOLOGICAL SPECIES. Above it the
// tower runs on as a DASHED ORANGE outline (its silhouette, four course rings) into the bright high air, to the dashed
// crowning CEILING band = the superintelligence ceiling (orange = intelligence; dashed = it does not exist yet).
// THE HOIST (F): a timber gallows in front of the human column, a winch with a crank at its foot, the rope up the post,
// over two sheaves, down to a bridle over a little timber platform that rides up the face to the human's sill.
// THE IDEAL OCCUPANT (C): a dashed orange outline of the big-headed figure the human's alcove would fit, drawn by a
// moving tip.
//
// UNITS: the cast's (U = 178 per metre; a man 312 = 1.75 m). X across, Y height (floor Y = 0, up - Y), Z depth behind
// the front plane. Draw inside <WorldSvg cam>. Constants in METRES above the floor (speciesTowerGeom.ts):
//   TOWER.R0 12 (radius at the floor), taper 0.02 / m, zFront 600 (the front face at the floor), ZC (the axis' Z)
//   TOWER.cornY 4.5 (the cornice's top = the human's sill = THE LINE), cornice band 3.95-4.5 (+0.8 m), fillet 3.75-3.95
//   TOWER.capitalY 15.6 (the stone's top; necking 12.6-13.0, block 13.0-15.0, cap 15.0-15.6)
//   TOWER.ceilY 35 (the dashed ceiling band 33.6-35, +1.8 m); dashed course rings TOWER.dashCourses 20.0/24.4/28.8
//   NICHES: id, ang (deg, 90 = front), sill, h, w, depth, light: chimp 1.75/1.85/1.75 (W2's sitting Chimp fits, its face ~2.4 m up) · human 4.5/4.6/2.7 (warm, depth
//     1.5) · grand 9.75/2.55/2.0 (dim cream, empty) · l0-l2 / r0-r2 at 90 +- 30 deg and l3-l5 / r3-r5 at 90 +- 58 deg,
//     sills 1.2 5.4 9.4, 2.4 x 1.6.   nicheOf(id), nichePt(n, u, v, inset), archUV(n)
//   ANCHORS (world units): sillAnchor(id, u?, inset?) -> {X, Y, Z} (a niche's floor); HUMAN_SPOT, CHIMP_SPOT;
//     towerPt(phi, h, out) any point on the tower; zFrontAt(h); platformRiderSpot(t) (the feet on the deck)
//   HOIST: deckH(t) (0 = resting on the floor, 1 = flush with the sill), platZ(), crankFor(t) (the crank that wound the
//     rope for t: rise / drum radius), HOIST.plate (EVOLUTION)
//   OCCUPANT: H 4.3 m, head 0.66 m, OCCUPANT_UV the outline (niche-local)
//
// THE CAMERA (speciesTowerGeom.ts): towerDepth(cam) / towerPersp(cam): a londonDepth perspective whose eye rises with
//   the camera (eyeHeightAt: 0.85 x the frame centre's height + 0.6 m, >= 1.7 m), Dc = 30000 (0.058 / k)^0.6 (a long lens
//   in the wide, closer in the close shots). TOWER_CAM presets (2D cams; swayCam them): A_open, A_resolved, B_open,
//   B_resolved, C_open, C_resolved, F_open, F_half. frameAt(k, X, Y, Z, sx, sy) / frameTwo(hA, syA, hB, syB) /
//   kForScale(pxPerM, Z) build framings; screenOf3(cam, X, Y, Z); towerCamTrack(keys, duration) the house damped
//   follow on pchip keys (the crane cut's runner).
// THE AIR: towerAirOf({ cam, rest, frame }) -> AirWorld (the kit's type: pass it to AirFloor / AirShadow / AirBox, and
//   A.v to <AirStage>): fog by world depth (crane-ups), the backdrop and every tone take the HEIGHT RAMP (the crane
//   cut's): dense espresso-teal low, petrol at the capital, the bright sage high air at the ceiling.
//
// COMPONENTS
//   <TowerScene A frame show? human? occupants? hoist? /> = floor + haze + the tower + the dashes + hoist (as shown)
//   <SpeciesTower A frame show occupants human /> the tower alone (stone, niches, occupants, dashed part, plates)
//     show: { dashed? 0..1 (dashedProgress: the moving tip draws the edges up from the capital, the rings as it passes,
//       the ceiling band last; default 1), breathe? (dash glow by frame, default true), idealOccupant? 0..1 (the tip
//       draws the outline), humanGlow? 0..1 (default 1), grandGlow? 0..1 (default 0.55), capitalPlate? 0..1 (SMARTEST
//       POSSIBLE on the capital block: slides up + fades in), corniceLight? 0..1 (a line of cream light travelling round
//       the cornice's top edge, left to right), civPlate? 0..1 (CIVILIZATION on the cornice band, right of the human),
//       hoist? false | { t, crank?, slack?, plate? } }
//     human: true (default: the Commuter v0 standing in his niche, looking up a little) | false | { kind, variant, pose,
//       u } (covidFolk kinds).  occupants: { [nicheId]: (o: { A, anchor, at, scale, frame }) => ReactNode } draws any
//       figure in any niche (painted after the niche's back wall, before the cornice in front of it). The chimp's niche
//       is empty by default: pass W2's Chimp as occupants.chimp (the probe shows how).
//   <TowerHuman A at? pose? .../> the default human as a component (for the platform in F)
//   <Hoist A t crank? slack? plate? rider? /> the gallows, winch, rope, platform (rider: a ReactNode drawn on the deck)
//   <DashedTower A progress breathe frame/>, <IdealOccupant A progress frame />, <SoftPlate .../>
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import {
  ACCENT,
  ACCENT_DEEP,
  AIR,


  AirShadow,
  FIG_FOG,
  MAT,
  ORANGE_LINE,
  PandemicFolk,
  airRamp,
  c01,
  lineOf,
  makeAirView,
  mixHex,
  rgbHex,
  smoothstep,
  type AirWorld,
  type Cam,
  type Mat,
  type P2,
  type RGB,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import * as Covid from "../kyle-covid/covidFolk";
import {
  DRUMS,
  HOIST,
  HUMAN_SPOT,
  NICHES,
  OCCUPANT,
  OCCUPANT_UV,
  Rm,
  TOWER,
  U,
  ZC,
  archUV,
  crankFor,
  deckH,
  hy,
  m,
  nicheOf,
  nichePt,
  platZ,
  platformRiderSpot,
  sillAnchor,
  towerDepth,
  towerPersp,
  towerPt,
  zFrontAt,
  type DrumSpec,
  type Niche,
  type NicheId,
  type SillAnchor,
} from "./speciesTowerGeom";

export * from "./speciesTowerGeom";

const { fontFamily: barlow } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });
export const PLATE_FONT = barlow;

const PAL = AIR.A;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const polyD = (q: P2[], close = true) => `M${q.map(Pt).join("L")}${close ? "Z" : ""}`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type V3 = [number, number, number];

// ===================================================================================================================
// THE AIR (the crane cut's height ramp on the kit's AirWorld)
// ===================================================================================================================
/** the height ramp: ramp t from the dense low air (the floor) to the bright high air (the ceiling) */
export const TOWER_RAMP = { tLow: 0.4, h0: -150, h1: m(37), gamma: 1.7, ZB: 6000 };
export const tOfHeight = (h: number) => TOWER_RAMP.tLow * Math.pow(1 - c01((h - TOWER_RAMP.h0) / (TOWER_RAMP.h1 - TOWER_RAMP.h0)), TOWER_RAMP.gamma);
export const TOWER_SCENE = { look: "A" as const, mood: "day" as const, F: 1000, fogNear: 0, fogVis: 2200, fogMax: 0.9, hLow: 0, hHigh: m(22), moteUnit: 178 };
/** the medium of one frame on the tower's depth camera (rest = the cut's f0 camera: motes and shafts parallax) */
export const towerAirOf = (o: { cam: Cam; rest: Cam; frame: number }): AirWorld => {
  const { cam, rest, frame } = o;
  const depth = towerDepth(cam);
  const P = towerPersp(cam);
  const P0 = towerPersp(rest);
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  // the motes' camera: the long lens' dolly is tamed (a log of the zoom), so a pull-back does not storm the motes
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
  const fog = (Z: number) => c01(base.fogAt(Math.max(0, Z)));
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
/** a line width in world units whose screen width is `px` at the close shots (k ~0.75), thinner in the wide */
export const lwT = (A: AirWorld, px: number) => (px * Math.pow(A.k / 0.75, 0.4)) / A.k;

/** soft form light: ndl (-1..1) -> a colour (the crane cut's formMat) */
export const formMat = (mt: Mat, ndl: number, sink = 0.22) => {
  const t = smoothstep(-0.45, 0.85, ndl);
  const shade = mixHex(mt.dark, PAL.shadow, sink);
  return t < 0.5 ? mixHex(shade, mt.mid, t * 2) : mixHex(mt.mid, mt.lit, (t - 0.5) * 2);
};
/** the light, horizontally: from the left and a little from the front */
const ndlOf = (phi: number) => -0.62 * Math.cos(phi) + 0.3 * Math.sin(phi);
/** the tower's stone: the style's warm grey-umber, a touch lighter so the big front face is not a dull grey */
export const TOWER_STONE: Mat = { lit: "#A6957F", mid: "#7A6C5A", dark: "#3B3128" };
const STONE: Mat = TOWER_STONE;
const STONE_TOP: Mat = { lit: "#A39380", mid: "#7A6D5C", dark: "#3E352C" };
const TIMBER = MAT.timber;
const IRON = MAT.iron;
const HEMP = MAT.hemp;
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ===================================================================================================================
// DRUMS (the shaft and its rings): silhouette = the near half-circles at the top and the bottom (exact for any eye)
// ===================================================================================================================
const nearArc = (A: AirWorld, h: number, out: number, N = 36, reverse = false): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const phi = Math.PI - (Math.PI * i) / N;
    const q = towerPt(phi, h, out);
    pts.push(A.P.p(q[0], q[1], q[2]));
  }
  return reverse ? pts.reverse() : pts;
};
const fullCircle = (A: AirWorld, h: number, out: number, N = 64): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i < N; i++) {
    const phi = (2 * Math.PI * i) / N;
    const q = towerPt(phi, h, out);
    pts.push(A.P.p(q[0], q[1], q[2]));
  }
  return pts;
};
/** the drum's body: the near arc at the top (left -> right), the right edge down, the near arc at the bottom back */
const drumBody = (A: AirWorld, h0: number, h1: number, out: number) => {
  const top = nearArc(A, h1, out);
  const bot = nearArc(A, h0, out, 36, true);
  return polyD([...top, ...bot]);
};
/** the horizontal form-light gradient of a drum at height h (fogged by each stop's depth, the air at that height) */
const DrumGrad: React.FC<{ A: AirWorld; id: string; h: number; out: number; mt: Mat }> = ({ A, id, h, out, mt }) => {
  const N = 12;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const phi = Math.PI - (Math.PI * i) / N;
    const q = towerPt(phi, h, out);
    const s = A.P.p(q[0], q[1], q[2]);
    let c = formMat(mt, ndlOf(phi));
    // reflected air at the far right edge
    if (i >= N - 1) c = mixHex(c, A.airHex(q[2], m(h)), 0.25);
    return { x: s[0], c: A.tone(c, q[2], m(h)) };
  });
  const x0 = pts[0].x;
  const x1 = pts[N].x;
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x0.toFixed(2)} y1="0" x2={x1.toFixed(2)} y2="0">
      {pts.map((p, i) => (
        <stop key={i} offset={c01((p.x - x0) / (x1 - x0 || 1)).toFixed(4)} stopColor={p.c} />
      ))}
    </linearGradient>
  );
};

/** a SHAFT segment: course drums (each its own height tone), block faces with a slight tone variation, course lines
 *  and staggered vertical joints fading with their screen spacing */
const Shaft: React.FC<{ A: AirWorld; d: DrumSpec; uid: string }> = ({ A, d, uid }) => {
  const k = A.k;
  const els: React.ReactNode[] = [];
  const defs: React.ReactNode[] = [];
  const nC = Math.max(1, Math.round((d.h1 - d.h0) / TOWER.course));
  const cH = (d.h1 - d.h0) / nC;
  const scrSpacing = cH * U * k * A.P.r(TOWER.zFront);
  const lineA = smoothstep(5, 16, scrSpacing) * (1 - A.fog(TOWER.zFront));
  const lnW = lwT(A, 1.0);
  let courseD = "";
  let jointD = "";
  let blocksLight = "";
  let blocksDark = "";
  for (let c = 0; c < nC; c++) {
    const ha = d.h0 + c * cH;
    const hb = ha + cH;
    const gid = `${uid}g${c}`;
    defs.push(<DrumGrad key={gid} A={A} id={gid} h={(ha + hb) / 2} out={0} mt={STONE} />);
    els.push(<path key={`c${c}`} d={drumBody(A, ha, hb, 0)} fill={`url(#${gid})`} stroke={`url(#${gid})`} strokeWidth={lnW * 0.6} />);
    if (c > 0) courseD += polyD(nearArc(A, ha, 0, 30), false);
    // blocks: front half, staggered by course
    const nb = TOWER.blocksHalf;
    const off = (c % 2) * 0.5;
    for (let b = 0; b <= nb; b++) {
      const phi = Math.PI * ((b + off) / nb);
      if (phi <= 0.02 || phi >= Math.PI - 0.02) continue;
      if (Math.sin(phi) > 0.12) {
        const p1 = towerPt(phi, ha, 0);
        const p2 = towerPt(phi, hb, 0);
        jointD += `M${Pt(A.P.p(p1[0], p1[1], p1[2]))}L${Pt(A.P.p(p2[0], p2[1], p2[2]))}`;
      }
      // the block between this joint and the next: a slight tone of its own
      const phiN = Math.PI * ((b + 1 + off) / nb);
      const pa = Math.max(0.01, Math.min(Math.PI - 0.01, phi));
      const pb = Math.max(0.01, Math.min(Math.PI - 0.01, phiN));
      if (pb <= pa) continue;
      if (Math.sin(pa) < 0.2 || Math.sin(pb) < 0.2) continue;
      const hv = hash(c * 31 + b * 7 + (d.id === "upper" ? 500 : 0));
      if (Math.abs(hv - 0.5) < 0.18) continue;
      const q: P2[] = [];
      for (let s = 0; s <= 3; s++) {
        const ph = lerp(pa, pb, s / 3);
        const t = towerPt(ph, ha, 0);
        q.push(A.P.p(t[0], t[1], t[2]));
      }
      for (let s = 3; s >= 0; s--) {
        const ph = lerp(pa, pb, s / 3);
        const t = towerPt(ph, hb, 0);
        q.push(A.P.p(t[0], t[1], t[2]));
      }
      if (hv > 0.5) blocksLight += polyD(q);
      else blocksDark += polyD(q);
    }
  }
  const fz = A.fog(TOWER.zFront);
  const ln = A.tone(lineOf(STONE), TOWER.zFront, m((d.h0 + d.h1) / 2));
  return (
    <g>
      <defs>{defs}</defs>
      {els}
      {/* the face's soft vertical light: a little lit at the top, a soft occlusion toward the foot */}
      <defs>
        <linearGradient id={`${uid}vo`} gradientUnits="userSpaceOnUse" x1="0" y1={A.P.p(0, hy(d.h1), TOWER.zFront)[1].toFixed(2)} x2="0" y2={A.P.p(0, hy(d.h0), TOWER.zFront)[1].toFixed(2)}>
          <stop offset="0" stopColor={PAL.cream} stopOpacity={0.07 * (1 - fz)} />
          <stop offset="0.4" stopColor={PAL.shadow} stopOpacity={0} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.2 * (1 - fz)} />
        </linearGradient>
      </defs>
      <path d={drumBody(A, d.h0, d.h1, 0)} fill={`url(#${uid}vo)`} />
      <path d={blocksLight} fill={PAL.cream} fillOpacity={0.045 * (1 - fz)} />
      <path d={blocksDark} fill={PAL.shadow} fillOpacity={0.07 * (1 - fz)} />
      {lineA > 0.02 ? (
        <g>
          <path d={courseD} fill="none" stroke={ln} strokeWidth={lnW} strokeOpacity={0.5 * lineA} />
          <path d={jointD} fill="none" stroke={ln} strokeWidth={lnW * 0.85} strokeOpacity={0.36 * lineA} />
        </g>
      ) : null}
      {/* the cream rim down the lit left edge */}
      <path d={polyD(leftEdge(A, d.h0, d.h1, 0, 0.93), false)} fill="none" stroke={PAL.cream} strokeWidth={lwT(A, 1.6)} strokeOpacity={0.4 * (1 - fz)} strokeLinecap="round" />
    </g>
  );
};
const leftEdge = (A: AirWorld, h0: number, h1: number, out: number, f = 1): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i <= 8; i++) {
    const h = lerp(h0, h1, i / 8);
    const q: V3 = [-m((Rm(h) + out) * f), hy(h), ZC - m((Rm(h) + out) * Math.sqrt(Math.max(0, 1 - f * f)))];
    pts.push(A.P.p(q[0], q[1], q[2]));
  }
  return pts;
};

/** a RING (plinth step, cornice, capital parts): the moulded drum, its lit top or dark underside as the eye sees it,
 *  a cream rim along its top's near edge (strongest upper left). light = 0..1 the travelling cream light on its top
 *  edge (the cornice's line, B) */
const Ring: React.FC<{ A: AirWorld; d: DrumSpec; uid: string; light?: number }> = ({ A, d, uid, light = 0 }) => {
  const P = A.P;
  const eyeH = -P.opts.eyeY / U;
  const zF = zFrontAt(d.h1) - m(d.out);
  const fz = A.fog(zF);
  const mid = (d.h0 + d.h1) / 2;
  const ln = A.tone(lineOf(STONE), zF, m(mid));
  const w = lwT(A, 1.0);
  const topSeen = d.h1 < eyeH;
  const botSeen = d.h0 > eyeH;
  const els: React.ReactNode[] = [];
  if (topSeen) {
    els.push(<path key="tp" d={polyD(fullCircle(A, d.h1, d.out))} fill={A.tone(formMat(STONE_TOP, 0.8), zF, m(d.h1))} stroke={ln} strokeWidth={w * 0.8} />);
  }
  if (botSeen) {
    els.push(<path key="bt" d={polyD(fullCircle(A, d.h0, d.out))} fill={A.tone(mixHex(STONE.dark, PAL.shadow, 0.3), zF, m(d.h0))} stroke={ln} strokeWidth={w * 0.8} />);
  }
  els.push(<path key="bd" d={drumBody(A, d.h0, d.h1, d.out)} fill={`url(#${uid}g)`} stroke={ln} strokeWidth={w} strokeLinejoin="round" />);
  // a soft occlusion under the top edge (light from above) and toward the foot
  const top = nearArc(A, d.h1, d.out);
  const rimA = 0.6 * (1 - fz);
  // the rim: cream on the top's near edge, fading from the left to the right
  const x0 = top[0][0];
  const x1 = top[top.length - 1][0];
  const lit = c01(light);
  return (
    <g>
      <defs>
        <DrumGrad A={A} id={`${uid}g`} h={mid} out={d.out} mt={STONE} />
        <linearGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" x1={x0.toFixed(2)} y1="0" x2={x1.toFixed(2)} y2="0">
          <stop offset="0" stopColor={PAL.cream} stopOpacity={rimA} />
          <stop offset="0.5" stopColor={PAL.cream} stopOpacity={rimA * 0.75} />
          <stop offset="1" stopColor={PAL.cream} stopOpacity={rimA * 0.18} />
        </linearGradient>
      </defs>
      {els}
      <path d={polyD(top, false)} fill="none" stroke={`url(#${uid}r)`} strokeWidth={lwT(A, 1.7)} strokeLinecap="round" />
      {lit > 0 ? <TravelLight A={A} pts={top} t={lit} uid={`${uid}tl`} /> : null}
    </g>
  );
};
/** a line of cream light travelling along a polyline (left -> right): the lit part stays, the head brighter */
const TravelLight: React.FC<{ A: AirWorld; pts: P2[]; t: number; uid: string }> = ({ A, pts, t, uid }) => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1];
  const upto = total * c01(t);
  const part: P2[] = [pts[0]];
  let head = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= upto) {
      part.push(pts[i]);
      head = pts[i];
    } else {
      const f = (upto - L[i - 1]) / (L[i] - L[i - 1] || 1);
      head = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
      part.push(head);
      break;
    }
  }
  const w = lwT(A, 3.2);
  const headOn = t < 1 ? 1 : 0;
  return (
    <g>
      <path d={polyD(part, false)} fill="none" stroke={PAL.cream} strokeWidth={w * 3.2} strokeOpacity={0.16} strokeLinecap="round" />
      <path d={polyD(part, false)} fill="none" stroke={PAL.cream} strokeWidth={w} strokeOpacity={0.92} strokeLinecap="round" />
      {headOn ? (
        <g>
          <defs>
            <radialGradient id={uid}>
              <stop offset="0" stopColor="#FFF7E8" stopOpacity={0.95} />
              <stop offset="0.35" stopColor={PAL.cream} stopOpacity={0.45} />
              <stop offset="1" stopColor={PAL.cream} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={head[0]} cy={head[1]} r={w * 6} fill={`url(#${uid})`} />
        </g>
      ) : null}
    </g>
  );
};

// ===================================================================================================================
// NICHES
// ===================================================================================================================
const nicheD = (A: AirWorld, n: Niche, inset: number, N = 28) => {
  const uv = archUV(n, N);
  return polyD(uv.map(([u, v]) => {
    const q = nichePt(n, u, v, inset);
    return A.P.p(q[0], q[1], q[2]);
  }));
};
const WARM = "#F2DFB9";
const WARM_LO = "#C9AE84";
/** one niche: the reveals (the inner walls, vault and floor as one soft vertical shade), the back wall (dark air; the
 *  human's warm-lit; the grand niche cream-lit), occupants between, the cream rim on the arch, the lit sill lip */
const NicheCut: React.FC<{ A: AirWorld; n: Niche; uid: string; glow: number; children?: React.ReactNode }> = ({ A, n, uid, glow, children }) => {
  const P = A.P;
  const front = nicheD(A, n, 0);
  const back = nicheD(A, n, n.depth);
  const zF = nichePt(n, 0, 0, 0)[2];
  const fz = A.fog(zF);
  const hMid = m(n.sill + n.h / 2);
  const t = (hex: string) => A.tone(hex, zF, hMid);
  const yTop = P.p(...nichePt(n, 0, n.h, 0))[1];
  const ySill = P.p(...nichePt(n, 0, 0, 0))[1];
  const isWarm = n.light === "warm";
  const isCream = n.light === "cream";
  const g = c01(glow);
  // the inner shade (the air in the recess)
  const innerAir = mixHex(A.airHex(zF, hMid), PAL.shadow, 0.62);
  const rv = {
    top: t(mixHex(STONE.dark, PAL.shadow, 0.45)),
    mid: t(mixHex(STONE.dark, STONE.mid, 0.25)),
    bot: t(mixHex(STONE.mid, STONE.lit, 0.35)),
  };
  const warmMix = (c: string, a: number) => (isWarm ? mixHex(c, WARM_LO, a * g) : isCream ? mixHex(c, PAL.creamLo, a * 0.55 * g) : c);
  const ln = t(lineOf(STONE));
  const w = lwT(A, 1.0);
  // the rim: the left jamb's upper part and the arch to the crown (upper left)
  const uv = archUV(n, 28);
  const rimPts = uv.slice(1, 1 + 15).map(([u, v]) => P.p(...nichePt(n, u, v, 0)));
  const sillA = P.p(...nichePt(n, -n.w / 2, 0, 0));
  const sillB = P.p(...nichePt(n, n.w / 2, 0, 0));
  const c = P.p(...nichePt(n, 0, n.h * 0.42, n.depth));
  const wPx = Math.abs(sillB[0] - sillA[0]);
  return (
    <g>
      <defs>
        <clipPath id={`${uid}cl`}>
          <path d={front} />
        </clipPath>
        <linearGradient id={`${uid}rv`} gradientUnits="userSpaceOnUse" x1="0" y1={yTop.toFixed(2)} x2="0" y2={ySill.toFixed(2)}>
          <stop offset="0" stopColor={warmMix(rv.top, 0.35)} />
          <stop offset="0.55" stopColor={warmMix(rv.mid, 0.5)} />
          <stop offset="1" stopColor={warmMix(rv.bot, 0.6)} />
        </linearGradient>
        <linearGradient id={`${uid}bw`} gradientUnits="userSpaceOnUse" x1="0" y1={yTop.toFixed(2)} x2="0" y2={ySill.toFixed(2)}>
          <stop offset="0" stopColor={mixHex(innerAir, PAL.shadow, 0.35)} />
          <stop offset="1" stopColor={mixHex(innerAir, STONE.mid, isCream ? 0.2 : 0.25)} />
        </linearGradient>
        {isWarm || isCream ? (
          <radialGradient id={`${uid}gl`} gradientUnits="userSpaceOnUse" cx={c[0].toFixed(2)} cy={c[1].toFixed(2)} r={(wPx * (isWarm ? 0.95 : 0.85)).toFixed(2)} gradientTransform={`translate(${c[0].toFixed(2)} ${c[1].toFixed(2)}) scale(1 1.55) translate(${(-c[0]).toFixed(2)} ${(-c[1]).toFixed(2)})`}>
            <stop offset="0" stopColor={isWarm ? "#FBEFD6" : "#E6DCC6"} stopOpacity={g} />
            <stop offset="0.45" stopColor={isWarm ? WARM : PAL.creamLo} stopOpacity={0.85 * g} />
            <stop offset="1" stopColor={isWarm ? WARM_LO : "#A89C84"} stopOpacity={0.35 * g} />
          </radialGradient>
        ) : null}
      </defs>
      <path d={front} fill={`url(#${uid}rv)`} />
      <g clipPath={`url(#${uid}cl)`}>
        <path d={back} fill={`url(#${uid}bw)`} />
        {isWarm || isCream ? <path d={back} fill={`url(#${uid}gl)`} /> : null}
        {children}
      </g>
      <path d={front} fill="none" stroke={ln} strokeWidth={w} strokeLinejoin="round" />
      <path d={polyD(rimPts, false)} fill="none" stroke={PAL.cream} strokeWidth={lwT(A, 1.5)} strokeOpacity={0.5 * (1 - fz)} strokeLinecap="round" />
      <path d={`M${Pt(sillA)}L${Pt(sillB)}`} stroke={PAL.cream} strokeWidth={lwT(A, 1.3)} strokeOpacity={0.32 * (1 - fz)} strokeLinecap="round" />
    </g>
  );
};
/** the warm light spilling out of the human's niche onto the stone and the cornice (reads at 30 px) */
const NicheSpill: React.FC<{ A: AirWorld; n: Niche; uid: string; glow: number }> = ({ A, n, uid, glow }) => {
  const c = A.P.p(...nichePt(n, 0, n.h * 0.45, 0));
  const a = A.P.p(...nichePt(n, -n.w / 2, 0, 0));
  const b = A.P.p(...nichePt(n, n.w / 2, 0, 0));
  const wPx = Math.abs(b[0] - a[0]);
  const g = c01(glow);
  if (g <= 0) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}sp`}>
          <stop offset="0" stopColor={WARM} stopOpacity={0.3 * g} />
          <stop offset="0.55" stopColor={WARM} stopOpacity={0.12 * g} />
          <stop offset="1" stopColor={WARM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={wPx * 1.35} ry={wPx * 1.55} fill={`url(#${uid}sp)`} />
    </g>
  );
};

// ===================================================================================================================
// THE PEOPLE
// ===================================================================================================================
export type HumanSpec = { kind?: Covid.CovidKind; variant?: number; pose?: Covid.CovidPose; u?: number };
/** the human's default pose: standing, facing us, looking up a little */
export const humanPose = (frame = 0): Covid.CovidPose => {
  const q = Covid.POSES.front();
  return Covid.breathe({ ...q, pitch: (q.pitch ?? 0) - 8, look: [0.05, -0.65] }, frame);
};
/** the default human (covidFolk Commuter v0) at a 3D spot, with his contact shadow */
export const TowerHuman: React.FC<{ A: AirWorld; spot?: SillAnchor; frame?: number; kind?: Covid.CovidKind; variant?: number; pose?: Covid.CovidPose; uid?: string; shadow?: number }> = ({
  A,
  spot = HUMAN_SPOT,
  frame = 0,
  kind = "commuter",
  variant = 0,
  pose,
  uid = "twHuman",
  shadow = 0.8,
}) => {
  const at = A.P.p(spot.X, spot.Y, spot.Z);
  const scale = A.P.r(spot.Z);
  const fog = A.folkFog(spot.Z, -spot.Y);
  return (
    <g>
      <AirShadow A={A} X={spot.X} Z={spot.Z} Y={spot.Y} w={62} d={30} uid={`${uid}s`} amt={shadow} />
      <Covid.CovidFigure kind={kind} variant={variant} pose={pose ?? humanPose(frame)} at={at} scale={scale} uid={uid} fog={{ rgb: fog.rgb, amount: fog.amount }} unitPx={A.k} frame={frame} />
    </g>
  );
};

// ===================================================================================================================
// THE DASHED ORANGE (what does not exist yet)
// ===================================================================================================================
const DASH = { len: 1.5, gap: 0.95 };
/** a dashed orange stroke in world space: a soft glow underlay, a deep-orange edge (it reads on the bright air), the dash */
const DashStroke: React.FC<{ A: AirWorld; d: string; Z: number; h: number; px?: number; a?: number; dash?: [number, number] }> = ({ A, d, Z, h, px = 3.4, a = 1, dash }) => {
  const wpx = px * Math.pow(A.k / 0.058, 0.3);
  const w = wpx / A.k;
  const da = dash ?? [m(DASH.len), m(DASH.gap)];
  const col = A.toneO(ACCENT, Z, h);
  const edge = A.toneO(ACCENT_DEEP, Z, h);
  const dash2 = `${da[0].toFixed(1)} ${da[1].toFixed(1)}`;
  return (
    <g>
      <path d={d} fill="none" stroke={col} strokeWidth={w * 3.4} strokeOpacity={0.14 * a} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={mixHex(edge, ORANGE_LINE, 0.4)} strokeWidth={w * 1.55} strokeOpacity={0.55 * a} strokeDasharray={dash2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeOpacity={a} strokeDasharray={dash2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
const Tip: React.FC<{ A: AirWorld; p: P2; uid: string; px?: number }> = ({ A, p, uid, px = 7 }) => {
  const r = (px * Math.pow(A.k / 0.058, 0.3)) / A.k;
  return (
    <g>
      <defs>
        <radialGradient id={uid}>
          <stop offset="0" stopColor={PAL.orangeHot} stopOpacity={1} />
          <stop offset="0.3" stopColor={ACCENT} stopOpacity={0.7} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={p[0]} cy={p[1]} r={r * 3} fill={`url(#${uid})`} />
      <circle cx={p[0]} cy={p[1]} r={r * 0.55} fill={PAL.orangeHot} />
    </g>
  );
};
/** the partial polyline up to fraction t of its length, and its end point */
const partial = (pts: P2[], t: number): { pts: P2[]; end: P2 } => {
  if (t >= 1) return { pts, end: pts[pts.length - 1] };
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const upto = L[L.length - 1] * c01(t);
  const out: P2[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= upto) out.push(pts[i]);
    else {
      const f = (upto - L[i - 1]) / (L[i] - L[i - 1] || 1);
      const e: P2 = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
      out.push(e);
      return { pts: out, end: e };
    }
  }
  return { pts: out, end: out[out.length - 1] };
};
/** the dashed tower above the capital: the silhouette edges climb from the capital (progress 0 -> 0.8), each course
 *  ring is drawn from both edges as the tips pass it (front half bright, back half faint), the ceiling band last
 *  (0.8 -> 1). breathe: the glow breathes faintly with the frame */
export const DashedTower: React.FC<{ A: AirWorld; progress?: number; frame?: number; breathe?: boolean }> = ({ A, progress = 1, frame = 0, breathe = true }) => {
  const P = A.P;
  const p = c01(progress);
  if (p <= 0) return null;
  const h0 = TOWER.capitalY;
  const hC = TOWER.ceil.h0;
  const pe = c01(p / 0.8);
  const hTip = lerp(h0, hC, 1 - Math.pow(1 - pe, 1.6));
  const br = breathe ? 0.86 + 0.14 * Math.sin((2 * Math.PI * frame) / 64) : 1;
  const edge = (side: -1 | 1, hTop: number): P2[] => {
    const pts: P2[] = [];
    for (let i = 0; i <= 10; i++) {
      const h = lerp(h0, hTop, i / 10);
      pts.push(P.p(side * m(Rm(h)), hy(h), ZC));
    }
    return pts;
  };
  const ring = (h: number, out: number, q: number) => {
    // from both sides toward the front (bright) and toward the back (faint)
    const N = 24;
    const halfF = (s: -1 | 1) => Array.from({ length: N + 1 }, (_, i) => {
      const phi = s < 0 ? Math.PI - (Math.PI / 2) * (i / N) : (Math.PI / 2) * (i / N);
      const v = towerPt(phi, h, out);
      return P.p(v[0], v[1], v[2]);
    });
    const halfB = (s: -1 | 1) => Array.from({ length: N + 1 }, (_, i) => {
      const phi = s < 0 ? Math.PI + (Math.PI / 2) * (i / N) : -(Math.PI / 2) * (i / N);
      const v = towerPt(phi, h, out);
      return P.p(v[0], v[1], v[2]);
    });
    const parts = [halfF(-1), halfF(1)].map((a) => partial(a, q).pts);
    const backs = [halfB(-1), halfB(1)].map((a) => partial(a, q).pts);
    return { front: parts.map((a) => polyD(a, false)).join(""), back: backs.map((a) => polyD(a, false)).join("") };
  };
  const els: React.ReactNode[] = [];
  const zE = ZC;
  // the edges
  const eL = edge(-1, hTip);
  const eR = edge(1, hTip);
  els.push(<DashStroke key="eL" A={A} d={polyD(eL, false)} Z={zE} h={m((h0 + hTip) / 2)} a={br} />);
  els.push(<DashStroke key="eR" A={A} d={polyD(eR, false)} Z={zE} h={m((h0 + hTip) / 2)} a={br} />);
  // the course rings
  TOWER.dashCourses.forEach((hc, i) => {
    const q = c01((hTip - hc) / 3.2);
    if (q <= 0) return;
    const r = ring(hc, 0, q);
    els.push(<DashStroke key={`rb${i}`} A={A} d={r.back} Z={ZC + m(Rm(hc))} h={m(hc)} a={0.38 * br} px={2.6} />);
    els.push(<DashStroke key={`rf${i}`} A={A} d={r.front} Z={zFrontAt(hc)} h={m(hc)} a={br} />);
  });
  // the ceiling band: the shaft's last ring, the band's verticals, its bottom and top rings
  const pc = c01((p - 0.8) / 0.2);
  if (pc > 0) {
    const C = TOWER.ceil;
    const qa = c01(pc / 0.45);
    const qb = c01((pc - 0.25) / 0.45);
    const qc = c01((pc - 0.5) / 0.5);
    const r0 = ring(C.h0, 0, qa);
    const r1 = ring(C.h0, C.out, qb);
    const r2 = ring(C.h1, C.out, qc);
    els.push(<DashStroke key="c0b" A={A} d={r0.back} Z={ZC + m(Rm(C.h0))} h={m(C.h0)} a={0.38 * br} px={2.6} />);
    els.push(<DashStroke key="c1b" A={A} d={r1.back} Z={ZC + m(Rm(C.h0) + C.out)} h={m(C.h0)} a={0.38 * br} px={2.6} />);
    els.push(<DashStroke key="c2b" A={A} d={r2.back} Z={ZC + m(Rm(C.h1) + C.out)} h={m(C.h1)} a={0.45 * br} px={2.8} />);
    els.push(<DashStroke key="c0f" A={A} d={r0.front} Z={zFrontAt(C.h0)} h={m(C.h0)} a={br} />);
    els.push(<DashStroke key="c1f" A={A} d={r1.front} Z={zFrontAt(C.h0) - m(C.out)} h={m(C.h0)} a={br} px={3.8} />);
    els.push(<DashStroke key="c2f" A={A} d={r2.front} Z={zFrontAt(C.h1) - m(C.out)} h={m(C.h1)} a={br} px={3.8} />);
    if (qb > 0) {
      for (const s of [-1, 1] as const) {
        const a = P.p(s * m(Rm(C.h0) + C.out), hy(C.h0), ZC);
        const b = P.p(s * m(Rm(C.h1) + C.out), hy(lerp(C.h0, C.h1, qb)), ZC);
        els.push(<DashStroke key={`cv${s}`} A={A} d={`M${Pt(a)}L${Pt(b)}`} Z={ZC} h={m(C.h1)} a={br} px={3.8} dash={[m(0.7), m(0.45)]} />);
      }
    }
  }
  // the tips while the edges climb
  if (pe < 1) {
    els.push(<Tip key="tL" A={A} p={eL[eL.length - 1]} uid="dtTipL" />);
    els.push(<Tip key="tR" A={A} p={eR[eR.length - 1]} uid="dtTipR" />);
  }
  return <g>{els}</g>;
};

/** the IDEAL OCCUPANT: a dashed orange outline of the big-headed figure the human's alcove was made for, drawn from
 *  the left foot up the left side, round the head, down the right side, by a moving tip (progress 0..1) */
export const IdealOccupant: React.FC<{ A: AirWorld; progress?: number; frame?: number; niche?: NicheId; breathe?: boolean }> = ({ A, progress = 1, frame = 0, niche = "human", breathe = true }) => {
  const p = c01(progress);
  if (p <= 0) return null;
  const n = nicheOf(niche);
  const pts = OCCUPANT_UV.map(([u, v]) => A.P.p(...nichePt(n, u, v, OCCUPANT.inset)));
  pts.push(pts[0]);
  const part = partial(pts, p);
  const Z = nichePt(n, 0, 0, OCCUPANT.inset)[2];
  const br = breathe ? 0.88 + 0.12 * Math.sin((2 * Math.PI * frame) / 64) : 1;
  return (
    <g>
      <DashStroke A={A} d={polyD(part.pts, false)} Z={Z} h={m(n.sill + 2)} a={br} px={2.1} dash={[m(OCCUPANT.dash), m(OCCUPANT.gap)]} />
      {p < 1 ? <Tip A={A} p={part.end} uid="occTip" px={2.4} /> : null}
    </g>
  );
};

// ===================================================================================================================
// SOFT PLATES (cream type on a soft dark plate, world space; enter by sliding up while fading in)
// ===================================================================================================================
export const SoftPlate: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; text: string; capM: number; t: number; padM?: number; uid: string; track?: number }> = ({ A, X, Y, Z, text, capM, t, padM, uid, track = 0.06 }) => {
  const e = c01(t);
  if (e <= 0) return null;
  const r = A.P.r(Z);
  const ease = 1 - Math.pow(1 - e, 3);
  const c = A.P.p(X, Y + m(0.35) * (1 - ease), Z);
  const fs = (m(capM) / 0.7) * r; // Barlow's cap height ~0.7 em
  const wText = text.length * fs * (0.46 + track);
  const pad = m(padM ?? capM * 0.7) * r;
  const wP = wText + pad * 2;
  const hP = fs * 0.7 + pad * 1.5;
  return (
    <g opacity={ease}>
      <defs>
        <filter id={`${uid}f`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation={(hP * 0.08).toFixed(2)} />
        </filter>
      </defs>
      <rect x={c[0] - wP / 2} y={c[1] - hP / 2} width={wP} height={hP} rx={hP * 0.22} fill={PAL.shadow} fillOpacity={0.5} filter={`url(#${uid}f)`} />
      <rect x={c[0] - wP / 2} y={c[1] - hP / 2} width={wP} height={hP} rx={hP * 0.22} fill={mixHex(PAL.shadow, "#3A3128", 0.5)} fillOpacity={0.55} />
      <text x={c[0]} y={c[1] + fs * 0.35} textAnchor="middle" fontFamily={barlow} fontWeight={600} fontSize={fs} letterSpacing={fs * track} fill={PAL.cream}>
        {text}
      </text>
    </g>
  );
};

// ===================================================================================================================
// THE HOIST
// ===================================================================================================================
const Beam: React.FC<{ A: AirWorld; a: V3; b: V3; w: number; mt?: Mat; uid: string }> = ({ A, a, b, w, mt = TIMBER, uid }) => {
  const P = A.P;
  const pa = P.p(...a);
  const pb = P.p(...b);
  const dx = pb[0] - pa[0];
  const dy = pb[1] - pa[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  const wa = (w * P.r(a[2])) / 2;
  const wb = (w * P.r(b[2])) / 2;
  const lit = nx * -0.55 + ny * -0.83 > 0 ? 1 : -1;
  const q: P2[] = [
    [pa[0] + nx * wa, pa[1] + ny * wa],
    [pb[0] + nx * wb, pb[1] + ny * wb],
    [pb[0] - nx * wb, pb[1] - ny * wb],
    [pa[0] - nx * wa, pa[1] - ny * wa],
  ];
  const band = (f0: number, f1: number): P2[] => [
    [pa[0] + lit * nx * wa * f0, pa[1] + lit * ny * wa * f0],
    [pb[0] + lit * nx * wb * f0, pb[1] + lit * ny * wb * f0],
    [pb[0] + lit * nx * wb * f1, pb[1] + lit * ny * wb * f1],
    [pa[0] + lit * nx * wa * f1, pa[1] + lit * ny * wa * f1],
  ];
  const Z = (a[2] + b[2]) / 2;
  const h = -(a[1] + b[1]) / 2;
  const t = (hex: string) => A.tone(hex, Z, h);
  void uid;
  return (
    <g>
      <path d={polyD(q)} fill={t(mt.mid)} />
      <path d={polyD(band(1, 0.25))} fill={t(mixHex(mt.lit, mt.mid, 0.3))} />
      <path d={polyD(band(-0.2, -1))} fill={t(mixHex(mt.dark, PAL.shadow, 0.2))} />
      <path d={polyD(q)} fill="none" stroke={t(lineOf(mt))} strokeWidth={lwT(A, 1.0)} strokeLinejoin="round" />
      <path d={`M${Pt([pa[0] + lit * nx * wa * 0.85, pa[1] + lit * ny * wa * 0.85])}L${Pt([pb[0] + lit * nx * wb * 0.85, pb[1] + lit * ny * wb * 0.85])}`} stroke={PAL.cream} strokeWidth={lwT(A, 1.2)} strokeOpacity={0.45 * (1 - A.fog(Z))} strokeLinecap="round" />
    </g>
  );
};
const Rope: React.FC<{ A: AirWorld; pts: V3[] }> = ({ A, pts }) => {
  const d = polyD(
    pts.map((q) => A.P.p(...q)),
    false,
  );
  const Z = pts[0][2];
  const h = -pts.reduce((s, q) => s + q[1], 0) / pts.length;
  const w = Math.max(m(0.045) * A.P.r(Z), 1.3 / A.k);
  return (
    <g>
      <path d={d} fill="none" stroke={A.tone(HEMP.dark, Z, h)} strokeWidth={w + lwT(A, 1.0)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={A.tone(HEMP.mid, Z, h)} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
const Sheave: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; R: number; turn: number }> = ({ A, X, Y, Z, R, turn }) => {
  const c = A.P.p(X, Y, Z);
  const r = R * A.P.r(Z);
  let marks = "";
  for (let j = 0; j < 3; j++) {
    const a = turn + (j * 2 * Math.PI) / 3;
    marks += `M${Pt([c[0] + 0.25 * r * Math.cos(a), c[1] + 0.25 * r * Math.sin(a)])}L${Pt([c[0] + 0.75 * r * Math.cos(a), c[1] + 0.75 * r * Math.sin(a)])}`;
  }
  const h = -Y;
  return (
    <g>
      <circle cx={c[0]} cy={c[1]} r={r} fill={A.tone(TIMBER.mid, Z, h)} stroke={A.tone(lineOf(TIMBER), Z, h)} strokeWidth={lwT(A, 1.0)} />
      <circle cx={c[0]} cy={c[1]} r={r * 0.82} fill="none" stroke={A.tone(TIMBER.dark, Z, h)} strokeWidth={lwT(A, 0.9)} strokeOpacity={0.6} />
      <path d={marks} stroke={A.tone(lineOf(TIMBER), Z, h)} strokeWidth={lwT(A, 1.1)} strokeLinecap="round" />
      <circle cx={c[0]} cy={c[1]} r={r * 0.2} fill={A.tone(IRON.mid, Z, h)} stroke={A.tone(lineOf(IRON), Z, h)} strokeWidth={lwT(A, 0.8)} />
    </g>
  );
};
/** a sagging rope between two points: slack 0 = taut (straight), 1 = a soft belly (~6 % of the span) */
const sag = (a: V3, b: V3, slack: number, N = 12): V3[] => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    const s = 4 * t * (1 - t) * 0.06 * L * c01(slack);
    return [lerp(a[0], b[0], t) + s * 0.25, lerp(a[1], b[1], t) + s, lerp(a[2], b[2], t)] as V3;
  });
};
export type HoistState = { t: number; crank?: number; slack?: number; plate?: number };
/** THE HOIST: the gallows (post, arm, brace) in front of the human column, two sheaves, the winch (drum + crank) at the
 *  post's foot, the rope, the bridle and the platform at height t (0 floor .. 1 the human's sill). rider: drawn on the
 *  deck (after the deck, before the bridle's front ropes). crank defaults to crankFor(t) (cause before effect) */
export const Hoist: React.FC<{ A: AirWorld; t: number; crank?: number; slack?: number; plate?: number; rider?: React.ReactNode; uid?: string }> = ({ A, t, crank, slack = 0, plate = 0, rider, uid = "hoist" }) => {
  const H = HOIST;
  const P = A.P;
  const pz = platZ();
  const zG = pz.zM; // the gallows stands in the platform's depth
  const zW = pz.zF - m(0.6); // the winch a little in front
  const dk = deckH(t);
  const ca = crank ?? crankFor(t);
  const ringY = hy(dk + H.ringAbove);
  const els: React.ReactNode[] = [];
  // ---- the gallows
  els.push(<AirShadow key="gs" A={A} X={m(H.postX)} Z={zG} w={m(0.5)} d={60} uid={`${uid}gs`} amt={0.6} />);
  els.push(<Beam key="post" A={A} a={[m(H.postX), 0, zG]} b={[m(H.postX), hy(H.postTop), zG]} w={m(H.postW)} uid={`${uid}p`} />);
  els.push(<Beam key="arm" A={A} a={[m(H.armX0), hy(H.armY + 0.15), zG - 10]} b={[m(H.postX + 0.55), hy(H.armY + 0.15), zG - 10]} w={m(0.3)} uid={`${uid}a`} />);
  els.push(<Beam key="brace" A={A} a={[m(H.postX), hy(H.armY - 1.6), zG - 14]} b={[m(H.postX - 1.25), hy(H.armY), zG - 14]} w={m(0.16)} uid={`${uid}b`} />);
  // ---- the rope: drum (left tangent) up the post's right side to the right sheave, over to the left sheave, down to
  // the ring
  const sL = H.sheaveL;
  const sR = H.sheaveR;
  const drumTop: V3 = [m(H.drumX - H.drumR), hy(H.drumH), zW + m(0.1)];
  const upR: V3 = [m(sR.X + sR.R), hy(sR.Y), zG - 30];
  const overR: V3 = [m(sR.X), hy(sR.Y + sR.R), zG - 30];
  const overL: V3 = [m(sL.X), hy(sL.Y + sL.R), zG - 30];
  const downL: V3 = [m(sL.X - sL.R), hy(sL.Y), zG - 30];
  const ring: V3 = [m(sL.X - sL.R * 0.2), ringY, zG - 30];
  const arc = (c: { X: number; Y: number; R: number }, a0: number, a1: number): V3[] =>
    Array.from({ length: 7 }, (_, i) => {
      const a = lerp(a0, a1, i / 6);
      return [m(c.X + c.R * Math.cos(a)), hy(c.Y + c.R * Math.sin(a)), zG - 30] as V3;
    });
  // the rope to the winch: from the right sheave's right side down to the drum (a slight lead off the vertical)
  els.push(<Rope key="rw" A={A} pts={sag(upR, drumTop, slack * 0.4)} />);
  els.push(<Rope key="ro" A={A} pts={[...arc(sR, 0, Math.PI / 2), overR, overL, ...arc(sL, Math.PI / 2, Math.PI)]} />);
  els.push(<Rope key="rd" A={A} pts={sag(downL, ring, slack)} />);
  const turnL = -(dk - deckH(0)) / sL.R;
  els.push(<Sheave key="sR" A={A} X={m(sR.X)} Y={hy(sR.Y)} Z={zG - 36} R={m(sR.R)} turn={turnL} />);
  els.push(<Sheave key="sL" A={A} X={m(sL.X)} Y={hy(sL.Y)} Z={zG - 36} R={m(sL.R)} turn={turnL} />);
  // ---- the platform: the deck box, the bridle (back ropes behind the rider, front ropes in front)
  const x0 = -m(H.platHalfW);
  const x1 = m(H.platHalfW);
  const yT = hy(dk);
  const yB = hy(dk - H.platT);
  const ringP = P.p(ring[0], ring[1], ring[2]);
  const corner = (x: number, z: number) => P.p(x, yT, z);
  const bridle = (z: number) => `M${Pt(corner(x0 + 30, z))}L${Pt(ringP)}L${Pt(corner(x1 - 30, z))}`;
  const ropeC = A.tone(HEMP.mid, zG, -yT);
  const ropeW = Math.max(m(0.03) * P.r(zG), 1.1 / A.k);
  els.push(<AirShadow key="ps" A={A} X={0} Z={pz.zM} w={m(H.platHalfW) * 1.05} d={m(0.7)} uid={`${uid}ps`} amt={0.55 * (1 - c01(t * 3))} />);
  els.push(<path key="bb" d={bridle(pz.zB - 20)} fill="none" stroke={ropeC} strokeWidth={ropeW} strokeOpacity={0.8} />);
  els.push(<DeckBox key="deck" A={A} x0={x0} x1={x1} yT={yT} yB={yB} zF={pz.zF} zB={pz.zB} uid={`${uid}dk`} />);
  if (rider) els.push(<g key="rider">{rider}</g>);
  els.push(<path key="bf" d={bridle(pz.zF + 20)} fill="none" stroke={ropeC} strokeWidth={ropeW} />);
  els.push(<circle key="ring" cx={ringP[0]} cy={ringP[1]} r={m(0.09) * P.r(zG)} fill="none" stroke={A.tone(IRON.mid, zG, -ring[1])} strokeWidth={m(0.035) * P.r(zG)} />);
  // ---- the winch at the post's foot: two A-trestles, the drum (axis along Z) with the rope wound, the crank
  els.push(<Winch key="w" A={A} z={zW} crank={ca} uid={`${uid}w`} />);
  if (plate > 0) els.push(<SoftPlate key="pl" A={A} X={m(H.plate.X)} Y={hy(H.plate.h)} Z={zG - 60} text="EVOLUTION" capM={0.27} t={plate} uid={`${uid}pl`} />);
  return <g>{els}</g>;
};
const DeckBox: React.FC<{ A: AirWorld; x0: number; x1: number; yT: number; yB: number; zF: number; zB: number; uid: string }> = ({ A, x0, x1, yT, yB, zF, zB, uid }) => {
  const P = A.P;
  const t = (hex: string) => A.tone(hex, (zF + zB) / 2, -yT);
  const ln = t(lineOf(TIMBER));
  const w = lwT(A, 1.0);
  const topSeen = yT > P.horizonY;
  const fr: P2[] = [P.p(x0, yT, zF), P.p(x1, yT, zF), P.p(x1, yB, zF), P.p(x0, yB, zF)];
  const tp: P2[] = [P.p(x0, yT, zF), P.p(x1, yT, zF), P.p(x1, yT, zB), P.p(x0, yT, zB)];
  const bt: P2[] = [P.p(x0, yB, zF), P.p(x1, yB, zF), P.p(x1, yB, zB), P.p(x0, yB, zB)];
  // planks on the top and the front
  let planks = "";
  for (let i = 1; i < 6; i++) {
    const x = lerp(x0, x1, i / 6);
    planks += `M${Pt(P.p(x, yT, zF))}L${Pt(P.p(x, yT, zB))}M${Pt(P.p(x, yT, zF))}L${Pt(P.p(x, yB, zF))}`;
  }
  void uid;
  return (
    <g>
      {!topSeen ? <path d={polyD(bt)} fill={t(mixHex(TIMBER.dark, PAL.shadow, 0.25))} stroke={ln} strokeWidth={w} /> : null}
      {topSeen ? <path d={polyD(tp)} fill={t(TIMBER.lit)} stroke={ln} strokeWidth={w} /> : null}
      <path d={polyD(fr)} fill={t(TIMBER.mid)} stroke={ln} strokeWidth={w} />
      <path d={planks} stroke={ln} strokeWidth={w * 0.8} strokeOpacity={0.55} />
      <path d={`M${Pt(fr[0])}L${Pt(fr[1])}`} stroke={PAL.cream} strokeWidth={lwT(A, 1.3)} strokeOpacity={0.5 * (1 - A.fog(zF))} strokeLinecap="round" />
    </g>
  );
};
const Winch: React.FC<{ A: AirWorld; z: number; crank: number; uid: string }> = ({ A, z, crank, uid }) => {
  const H = HOIST;
  const P = A.P;
  const X = m(H.drumX);
  const Y = hy(H.drumH);
  const zF = z - m(H.drumW / 2);
  const zB = z + m(H.drumW / 2);
  const legs = (zz: number, k: string) => (
    <g key={k}>
      <Beam A={A} a={[X - m(0.78), 0, zz]} b={[X, Y - m(0.16), zz]} w={m(0.16)} uid={`${uid}${k}a`} />
      <Beam A={A} a={[X + m(0.78), 0, zz]} b={[X, Y - m(0.16), zz]} w={m(0.16)} uid={`${uid}${k}b`} />
      <Beam A={A} a={[X - m(0.55), hy(0.36), zz]} b={[X + m(0.55), hy(0.36), zz]} w={m(0.11)} uid={`${uid}${k}c`} />
    </g>
  );
  const cF = P.p(X, Y, zF);
  const cB = P.p(X, Y, zB);
  const rF = m(H.drumR) * P.r(zF);
  const rB = m(H.drumR) * P.r(zB);
  const t = (hex: string, zz = z) => A.tone(hex, zz, -Y);
  const ln = t(lineOf(TIMBER));
  // the drum's barrel between the two faces (a capsule between the circles), the rope coils on it
  const barrel = `M${Pt([cF[0], cF[1] - rF])}L${Pt([cB[0], cB[1] - rB])}A${rB.toFixed(2)},${rB.toFixed(2)} 0 0 1 ${Pt([cB[0], cB[1] + rB])}L${Pt([cF[0], cF[1] + rF])}Z`;
  let coils = "";
  for (let i = 1; i < 7; i++) {
    const zz = lerp(zF, zB, i / 7);
    const c = P.p(X, Y, zz);
    const r = m(H.drumR) * P.r(zz);
    coils += `M${Pt([c[0], c[1] - r])}L${Pt([c[0], c[1] + r])}`;
  }
  // the crank on the front face: an iron arm from the axle and a timber handle
  const arm = m(H.crankR) * P.r(zF - 30);
  const hx = cF[0] + arm * Math.cos(crank);
  const hy2 = cF[1] + arm * Math.sin(crank);
  let spokes = "";
  for (let j = 0; j < 4; j++) {
    const a = crank + (j * Math.PI) / 2 + Math.PI / 4;
    spokes += `M${Pt([cF[0] + rF * 0.2 * Math.cos(a), cF[1] + rF * 0.2 * Math.sin(a)])}L${Pt([cF[0] + rF * 0.8 * Math.cos(a), cF[1] + rF * 0.8 * Math.sin(a)])}`;
  }
  return (
    <g>
      <AirShadow A={A} X={X} Z={z} w={m(0.9)} d={m(0.7)} uid={`${uid}sh`} amt={0.7} />
      {legs(zB + 20, "lb")}
      <path d={barrel} fill={t(HEMP.mid)} stroke={ln} strokeWidth={lwT(A, 1.0)} />
      <path d={coils} stroke={t(HEMP.dark)} strokeWidth={lwT(A, 0.9)} strokeOpacity={0.6} />
      <circle cx={cF[0]} cy={cF[1]} r={rF} fill={t(TIMBER.mid, zF)} stroke={ln} strokeWidth={lwT(A, 1.1)} />
      <path d={spokes} stroke={t(lineOf(TIMBER), zF)} strokeWidth={lwT(A, 1.2)} strokeLinecap="round" />
      {legs(zF - 20, "lf")}
      <path d={`M${Pt(cF)}L${Pt([hx, hy2])}`} stroke={t(IRON.mid, zF)} strokeWidth={m(0.06) * P.r(zF)} strokeLinecap="round" />
      <circle cx={cF[0]} cy={cF[1]} r={m(0.07) * P.r(zF)} fill={t(IRON.dark, zF)} />
      <path d={`M${Pt([hx, hy2])}L${Pt(P.p(X + m(H.crankR) * Math.cos(crank), Y + m(H.crankR) * Math.sin(crank), zF - m(0.45)))}`} stroke={t(TIMBER.lit, zF)} strokeWidth={m(0.075) * P.r(zF)} strokeLinecap="round" />
    </g>
  );
};

// ===================================================================================================================
// THE TOWER
// ===================================================================================================================
export type OccupantFn = (o: { A: AirWorld; anchor: SillAnchor; at: P2; scale: number; frame: number }) => React.ReactNode;
export type TowerShow = {
  dashed?: number;
  breathe?: boolean;
  idealOccupant?: number;
  humanGlow?: number;
  grandGlow?: number;
  capitalPlate?: number;
  corniceLight?: number;
  civPlate?: number;
};
export const SpeciesTower: React.FC<{
  A: AirWorld;
  frame: number;
  show?: TowerShow;
  human?: boolean | HumanSpec;
  occupants?: Partial<Record<NicheId, OccupantFn>>;
  uid?: string;
}> = ({ A, frame, show = {}, human = true, occupants = {}, uid = "tw" }) => {
  const P = A.P;
  const eyeH = -P.opts.eyeY / U;
  const dist = (d: DrumSpec) => (eyeH < d.h0 ? d.h0 - eyeH : eyeH > d.h1 ? eyeH - d.h1 : 0);
  const order = DRUMS.map((d, i) => ({ d, i })).sort((a, b) => dist(b.d) - dist(a.d) || a.i - b.i);
  const humanGlow = show.humanGlow ?? 1;
  const occupantOf = (n: Niche): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    if (n.id === "human" && (show.idealOccupant ?? 0) > 0) parts.push(<IdealOccupant key="io" A={A} progress={show.idealOccupant} frame={frame} breathe={show.breathe ?? true} />);
    const fn = occupants[n.id];
    if (fn) {
      const anchor = sillAnchor(n.id);
      parts.push(<g key="oc">{fn({ A, anchor, at: P.p(anchor.X, anchor.Y, anchor.Z), scale: P.r(anchor.Z), frame })}</g>);
    }
    if (n.id === "human" && human) {
      const spec: HumanSpec = typeof human === "object" ? human : {};
      const spot = spec.u ? sillAnchor("human", spec.u, 0.55) : HUMAN_SPOT;
      parts.push(<TowerHuman key="hm" A={A} spot={spot} frame={frame} kind={spec.kind} variant={spec.variant} pose={spec.pose} uid={`${uid}hum`} />);
    }
    return parts.length ? parts : null;
  };
  const els: React.ReactNode[] = [];
  for (const { d } of order) {
    if (d.kind === "shaft") {
      els.push(<Shaft key={d.id} A={A} d={d} uid={`${uid}${d.id}`} />);
      const ns = NICHES.filter((n) => n.shaft === d.id).filter((n) => Math.sin((n.ang * Math.PI) / 180) > 0.2);
      // the far-side flanks first, then the centre (painter's order is irrelevant on one face; keep it stable)
      if (d.id === "upper") els.push(<NicheSpill key="spill" A={A} n={NICHES[1]} uid={`${uid}sp`} glow={humanGlow} />);
      for (const n of ns) {
        const glow = n.light === "warm" ? humanGlow : n.light === "cream" ? (show.grandGlow ?? 0.55) : 0;
        els.push(
          <NicheCut key={n.id} A={A} n={n} uid={`${uid}n${n.id}`} glow={glow}>
            {occupantOf(n)}
          </NicheCut>,
        );
      }
    } else {
      els.push(<Ring key={d.id} A={A} d={d} uid={`${uid}${d.id}`} light={d.id === "cornice" ? show.corniceLight ?? 0 : 0} />);
    }
  }
  // the projecting rings cast a soft shadow on the face below them (light from above): the cornice, the capital
  const casts = [
    { h: TOWER.cornice.band.h0, drop: 1.05, a: 0.42 },
    { h: TOWER.capital.block.h0, drop: 1.2, a: 0.42 },
    { h: TOWER.capital.cap.h0, drop: 0.5, a: 0.3 },
  ].map((c, i) => {
    const top = nearArc(A, c.h, 0, 30);
    const bot = nearArc(A, c.h - c.drop, 0, 30, true);
    const y0 = A.P.p(0, hy(c.h), zFrontAt(c.h))[1];
    const y1 = A.P.p(0, hy(c.h - c.drop), zFrontAt(c.h))[1];
    const fz = A.fog(TOWER.zFront);
    return (
      <g key={`cs${i}`}>
        <defs>
          <linearGradient id={`${uid}cs${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={y1.toFixed(2)}>
            <stop offset="0" stopColor={PAL.shadow} stopOpacity={c.a * (1 - fz)} />
            <stop offset="0.45" stopColor={PAL.shadow} stopOpacity={c.a * 0.4 * (1 - fz)} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={polyD([...top, ...bot])} fill={`url(#${uid}cs${i})`} />
      </g>
    );
  });
  // plates: SMARTEST POSSIBLE on the capital block, CIVILIZATION on the cornice band (right of the human)
  const cb = TOWER.capital.block;
  const capZ = zFrontAt((cb.h0 + cb.h1) / 2) - m(cb.out) - 6;
  const cor = TOWER.cornice.band;
  const civU = 2.35;
  const civPt = towerPt(Math.PI / 2 - civU / (Rm(cor.h0) + cor.out), (cor.h0 + cor.h1) / 2, cor.out);
  return (
    <g>
      {/* the tower's soft contact shadow on the floor */}
      <AirShadow A={A} X={0} Z={ZC} w={m(TOWER.R0 + 2.6)} d={m(TOWER.R0 + 2.0)} uid={`${uid}fs`} amt={1} />
      {els}
      {casts}
      <SoftPlate A={A} X={0} Y={hy((cb.h0 + cb.h1) / 2)} Z={capZ} text="SMARTEST POSSIBLE" capM={0.7} t={show.capitalPlate ?? 0} uid={`${uid}cp`} />
      <SoftPlate A={A} X={civPt[0]} Y={civPt[1]} Z={civPt[2] - 6} text="CIVILIZATION" capM={0.24} t={show.civPlate ?? 0} uid={`${uid}civ`} />
      <DashedTower A={A} progress={show.dashed ?? 1} frame={frame} breathe={show.breathe ?? true} />
    </g>
  );
};

/** THE FLOOR: the sand-umber ground graded by SCREEN ROW, not by depth (under the long lens everything behind the
 *  tower's foot squeezes into a few px, so a depth fog would make a hard horizon): the haze zone just under the
 *  horizon, the sand round the foot, sinking into the dense low air toward the bottom edge. One opaque sheet from the
 *  horizon row to below the frame. */
export const FLOOR_LOOK = { haze: 105, lowFrom: 1330, lowTo: 1920, lowAmt: 0.72, lowT: 0.52 };
/** the floor in the WIDE (the tower small, e.g. A's resolved frame): the field behind the tower melts into the horizon
 *  air, and below the tower's foot the dense low air takes the bottom of the frame (no big empty brown field). Blended
 *  in by the front plane's scale: full wide at <= pxWide px per metre, none at >= pxClose */
export const FLOOR_WIDE = { pxWide: 40, pxClose: 90, haze: 300, lowBelow: 20, lowSpan: 300, lowAmt: 0.96, lowT: 0.56 };
export const TowerFloor: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const { cam, P } = A;
  const hz = 960 + (P.opts.eyeY - cam.cy) * cam.k;
  const y0 = Math.max(hz, -200);
  const y1 = 2100;
  if (y0 >= y1) return null;
  const wy = (sy: number) => cam.cy + (sy - 960) / cam.k;
  const sand = mixHex(MAT.ground.lit, MAT.ground.mid, 0.38);
  const horizonAir = rgbHex(A.v.airAtScreen(hz - 4));
  // how wide the shot is (1 = the tower small in frame) and the tower's foot row
  const pxPerM = cam.k * P.r(TOWER.zFront) * U;
  const W = 1 - smoothstep(FLOOR_WIDE.pxWide, FLOOR_WIDE.pxClose, pxPerM);
  const footY = 960 + (P.p(0, 0, TOWER.zFront)[1] - cam.cy) * cam.k;
  const haze = lerp(FLOOR_LOOK.haze, FLOOR_WIDE.haze, W);
  const lowFrom = lerp(FLOOR_LOOK.lowFrom, footY + FLOOR_WIDE.lowBelow, W);
  const lowTo = lerp(FLOOR_LOOK.lowTo, footY + FLOOR_WIDE.lowBelow + FLOOR_WIDE.lowSpan, W);
  const lowAmt = lerp(FLOOR_LOOK.lowAmt, FLOOR_WIDE.lowAmt, W);
  const lowAir = rgbHex(airRamp("A", lerp(FLOOR_LOOK.lowT, FLOOR_WIDE.lowT, W)));
  const N = 24;
  const stops = Array.from({ length: N + 1 }, (_, i) => {
    const sy = lerp(y0, y1, Math.pow(i / N, 1.35));
    const d = sy - hz;
    const a = Math.exp(-Math.max(0, d) / haze);
    const b = lowAmt * smoothstep(lowFrom, lowTo, sy);
    // the sand darkens a little toward the viewer (light from above, seen more steeply)
    const local = mixHex(sand, MAT.ground.dark, 0.18 * smoothstep(hz + 150, 1900, sy));
    return { o: (sy - y0) / (y1 - y0), c: mixHex(mixHex(local, horizonAir, a), lowAir, b) };
  });
  const x0 = cam.cx - 900 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}fl`} gradientUnits="userSpaceOnUse" x1="0" y1={wy(y0).toFixed(2)} x2="0" y2={wy(y1).toFixed(2)}>
          {stops.map((s, i) => (
            <stop key={i} offset={s.o.toFixed(4)} stopColor={s.c} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={wy(y0).toFixed(2)} width={(1800 / cam.k).toFixed(2)} height={((y1 - y0) / cam.k).toFixed(2)} fill={`url(#${uid}fl)`} />
    </g>
  );
};

/** the whole stage: the floor, the tower, the dashed part and (when given) the hoist */
export const TowerScene: React.FC<{
  A: AirWorld;
  frame: number;
  show?: TowerShow;
  human?: boolean | HumanSpec;
  occupants?: Partial<Record<NicheId, OccupantFn>>;
  hoist?: false | (HoistState & { rider?: React.ReactNode });
  uid?: string;
}> = ({ A, frame, show, human = true, occupants, hoist = false, uid = "tw" }) => (
  <g>
    <TowerFloor A={A} uid={`${uid}fl`} />
    <SpeciesTower A={A} frame={frame} show={show} human={human} occupants={occupants} uid={uid} />
    {hoist ? <Hoist A={A} t={hoist.t} crank={hoist.crank} slack={hoist.slack} plate={hoist.plate} rider={hoist.rider} uid={`${uid}ho`} /> : null}
  </g>
);

/** the human riding the platform at height t (for F): pass as Hoist's rider */
export const PlatformHuman: React.FC<{ A: AirWorld; t: number; frame?: number; pose?: Covid.CovidPose; kind?: Covid.CovidKind; variant?: number }> = ({ A, t, frame = 0, pose, kind, variant }) => (
  <TowerHuman A={A} spot={platformRiderSpot(t)} frame={frame} pose={pose} kind={kind} variant={variant} uid="twRider" shadow={0.6} />
);
