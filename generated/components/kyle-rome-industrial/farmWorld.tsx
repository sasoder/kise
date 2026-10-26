// ---------------------------------------------------------------------------
// farmWorld: THE ROMAN FARM drawn (kyle-rome-industrial, shared by cut 13 MostlyFarmers and cut 20
// ModernYieldsMissing). Dwarkesh 3D style (styles/dwarkesh-3d.md) on the kit kits/dwarkesh-3d/dwarkesh3d: the valley of
// ./farmPlan (layout, eye, people, ox team, cart) inside the teal air, mood day, fog by world depth. No orange anywhere
// (no technology on a Roman farm): wheat pale khaki, stubble straw, turned soil umber, tiles red-brown, stone grey-umber.
//
// API
//   farmAirOf(eye, rest, frame)  -> { A (the kit's AirWorld), cam, depth }: the medium of one frame from a FarmEye
//   <FarmStage A frame>{...}</FarmStage>   AirStage (no bloom: nothing orange) + WorldSvg on A.cam
//   <FarmWorld A frame items? hide? uid? />   the whole valley in painter's order: hills, the ground (fields by
//       material, furrows, stubble, tracks), then every standing thing sorted far -> near (wheat in depth slices,
//       walls in segments, trees, stones, sheaves and stooks, villa, town, farmers, the ox team, the cart).
//       items: extra { z, el } entries a cut sorts into the same order (z = the thing's world depth);
//       hide: ids not to draw ("hero", a farmer id, "oxTeam", "cart", "wheat:<fieldId>", "town", "villa")
//   Pieces a cut can draw on its own (world coordinates; A from farmAirOf):
//     <WheatTufts A frame tufts r? />   a list of tufts (farmPlan Tuft), one slice; drawn as stalks + ears
//     <FarmerFig A f frame />           one farmer (farmPlan Farmer) with sickle, handful, pile, contact shadow
//     <OxTeamFig A frame />             the two oxen, yoke, pole, ard and ploughman (farmPlan OX_TEAM)
//     <Ox A X Z dir phase coat uid />   one ox (the painted cast manner: soft crescent shade, gouache texture)
//     <Sheaf A X Z dir uid lying? />  <Stook A X Z n uid />  <GrainHeap A X Z w h uid />  <Sickle .../>
//     <OliveTree A t uid />  <Cart A frame />
//   Poses (romeFolk FigPose, facing dir): reapPose(dir, u), bindPose(dir, u), gleanPose(dir, u), ploughPose(dir, u)
//     reapGrip(u) -> the handful's state (0 none .. 1 in hand) and the drop count
//   FarmPaint: romeFolk's Paint (crescent shade per shape, the gouache texture) for any shape list in cast units
//
// THE CAST: RomeFolk (kyle-rome-slavery/romeFolk, read-only) freemen and slaves in muted tunics (the ochre tunic muted
// to khaki #9A9070), fogged by their own depth (A.folkFog). The oxen, sheaves, sickle, ard, cart and trees are new
// props drawn here in the cast's painted manner (flat matte shapes, one crescent shadow each from the upper-left light,
// the same gouache filter): simple, cute, lit volumes.
// ---------------------------------------------------------------------------
import React from "react";
import { add, rot } from "../kits/maps/stringsMotion";
import { figureRig } from "../kits/maps/texcocoFigures";
import { closedD, tubeD, ellD, lineD, FU } from "../kyle-rome-slavery/romeFolkBody";
import {
  AIR,
  AirBox,
  AirHorizonHazeW,
  AirShadow,
  AirStage,
  MAT,
  Paint as PaintKit,
  RomeFolk,
  WorldSvg,
  airWorldOf,
  lineOf,
  mixHex,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import type { FigPose } from "../kyle-rome-slavery/romeFolk";
import {
  CART,
  CROSS_LANE,
  CROSS_TRACK,
  FARMERS,
  FARM_FIG_FOG,
  FIG_SCALE,
  FARM_SCENE,
  FIELDS,
  HILLS,
  LANE,
  OX_LEN,
  OX_TEAM,
  PLOUGH,
  STONES,
  TOWN,
  TREES,
  TUFTS,
  VILLA,
  WALLS,
  cartX,
  farmView,
  oxTeamX,
  shareX,
  standingAt,
  standingSpan,
  townRise,
  windAt,
  type FarmEye,
  type Farmer,
  type Field,
  type Tree,
  type Tuft,
} from "./farmPlan";

type Shape = PaintKit.Shape;
const { mixC, folkTexDefs, PAINT } = PaintKit;
const PAL = AIR.A;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const n2 = (v: number) => v.toFixed(2);
const n1 = (v: number) => v.toFixed(1);
const Pt = (v: P2) => `${n2(v[0])},${n2(v[1])}`;

// ===================================================================================================================
// MATERIALS (local colours before fog; nothing near the orange hue)
// ===================================================================================================================
export const FARM_MAT = {
  verge: "#958865",
  stubble: "#B2A47E",
  wheatGround: "#958660",
  soil: "#8D7258",
  soilDark: "#6A5440",
  soilRidge: "#AE9474",
  fallow: "#8B805F",
  grove: "#857A5A",
  track: "#A2927A",
  rut: "#776650",
  stalk: "#A89A6E",
  stalkDark: "#8A7D57",
  ear: "#BFAF84",
  earLit: "#D6C9A2",
  straw: "#C4B48A",
  strawDark: "#9C8C63",
  band: "#7A6648",
  tile: { lit: "#A86A52", mid: "#8E4F36", dark: "#5A3224" } as Mat,
  plaster: { lit: "#E3D6BC", mid: "#C6B596", dark: "#8A7B62" } as Mat,
  wallStone: { lit: "#A39580", mid: "#7E7262", dark: "#4A4137" } as Mat,
  olive: "#7C8A6C",
  oliveDark: "#5E6C55",
  oliveLit: "#9EAA88",
  bark: "#5E5146",
  hill: "#6E7A68",
};

// ===================================================================================================================
// THE MEDIUM FROM AN EYE
// ===================================================================================================================
export const farmAirOf = (eye: FarmEye, rest: FarmEye, frame: number, sway: (c: Cam, f: number) => Cam = (c) => c) => {
  const v = farmView(eye);
  const v0 = farmView(rest);
  const cam = sway(v.cam, frame);
  const A0 = airWorldOf({ cam, rest: v0.cam, depth: v.depth, frame, scene: FARM_SCENE, fogBy: "depth", figFog: FARM_FIG_FOG });
  // world depths are shifted onto londonDepth's front plane (zOff, farmPlan.farmView); fog keeps using world Z
  const o = v.zOff;
  const P0 = A0.P;
  const A: AirWorld = o === 0 ? A0 : { ...A0, P: { ...P0, r: (Z) => P0.r(Z - o), p: (X, Y, Z) => P0.p(X, Y, Z - o), at: (X, Z) => P0.at(X, Z - o), zNear: P0.zNear + o } };
  return { A, cam, depth: v.depth as DepthOpts, zOff: o };
};
/** lowAir (0..1): the frame's foot sinks a little into the denser low air (styles/dwarkesh-3d.md, lower frame) */
export const FarmStage: React.FC<{ A: AirWorld; children?: React.ReactNode; shafts?: number; lowAir?: number }> = ({ A, children, shafts = 1, lowAir = 0 }) => (
  <AirStage v={A.v} bloom={0} shafts={shafts}>
    <WorldSvg cam={A.cam}>{children}</WorldSvg>
    {lowAir > 0 ? (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 1380,
          width: 1080,
          height: 540,
          background: `linear-gradient(to bottom, ${A.screenAir(A.cam.cy + 420 / A.cam.k)}00 0%, ${A.screenAir(A.cam.cy + 900 / A.cam.k)}${Math.round(lowAir * 255)
            .toString(16)
            .padStart(2, "0")} 100%)`,
        }}
      />
    ) : null}
  </AirStage>
);

// screen helpers (culling)
const scr = (A: AirWorld, p: P2): P2 => [540 + (p[0] - A.cam.cx) * A.cam.k, 960 + (p[1] - A.cam.cy) * A.cam.k];
const onScreen = (A: AirWorld, X: number, Z: number, halfW: number, hgt: number) => {
  const P = A.P;
  if (Z < P.zNear + 30) return false;
  const b = scr(A, P.p(X, 0, Z));
  const s = P.r(Z) * A.cam.k;
  return b[0] + halfW * s > -20 && b[0] - halfW * s < 1100 && b[1] > -20 && b[1] - hgt * s < 1940;
};

// ===================================================================================================================
// THE PAINT (romeFolk's optimised Paint: one crescent shadow per shape from the upper left, the gouache texture)
// ===================================================================================================================
const boxOf = (d: string): [number, number, number, number] => {
  const v = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < v.length; i += 2) {
    if (v[i] < x0) x0 = v[i];
    if (v[i] > x1) x1 = v[i];
    if (v[i + 1] < y0) y0 = v[i + 1];
    if (v[i + 1] > y1) y1 = v[i + 1];
  }
  return [x0, y0, x1, y1];
};
const SHADE = { amt: 0.4, to: "#2C3433" };
/** shapes from romeFolkBody's closedD / tubeD / ellD (folk units = cast units x FU); at = the feet (2D world); scale =
 *  2D world px per cast unit; fog = { to, amount } mixes every fill toward the air */
export const FarmPaint: React.FC<{ shapes: Shape[]; at: P2; scale: number; uid: string; fog?: { to: string; amount: number }; unitPx: number; texture?: boolean; flip?: boolean }> = ({
  shapes,
  at,
  scale: sc0,
  uid,
  fog,
  unitPx,
  texture = true,
  flip,
}) => {
  const scale = sc0 / FU;
  const S = fog && fog.amount > 0.001 ? shapes.map((s) => ({ ...s, fill: mixC(s.fill, fog.to, c01(fog.amount)) })) : shapes;
  const pxf = (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  const shade = (c: string) => mixC(c, SHADE.to, SHADE.amt);
  const off = PAINT.shadeOff;
  const pad = off * 1.2 + blurU * 3 + 2;
  const tex = texture && pxf > 0.06;
  return (
    <g>
      <defs>
        {tex ? folkTexDefs(uid, pxf, unitPx) : null}
        <filter id={`${uid}su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU).toFixed(3)} />
        </filter>
      </defs>
      <g filter={tex ? `url(#${uid}tx)` : undefined}>
        <g transform={`translate(${n2(at[0])} ${n2(at[1])}) scale(${(flip ? -scale : scale).toFixed(5)} ${scale.toFixed(5)})`}>
          {S.map((s, i) => {
            const op = s.op ?? 1;
            if (op <= 0.002) return null;
            if (s.det !== undefined)
              return (
                <path
                  key={i}
                  d={s.d}
                  fill="none"
                  stroke={s.keep ? s.fill : mixC(s.fill, "#1E1611", 0.32)}
                  strokeWidth={(s.det * Math.max(0.45, Math.min(1.3, pxf))).toFixed(2)}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={s.op ?? 0.55}
                />
              );
            const sh = s.sh ?? 1;
            if (sh <= 0 || pxf < 0.12) return <path key={i} d={s.d} fill={s.fill} opacity={op} />;
            const [bx0, by0, bx1, by1] = boxOf(s.d);
            const mx = bx0 - pad;
            const my = by0 - pad;
            const mw = bx1 - bx0 + 2 * pad;
            const mh = by1 - by0 + 2 * pad;
            const mid = `${uid}m${i}`;
            // the light comes from the upper left on screen: a flipped group shifts the mask the other way
            const ox = flip ? off * sh : -off * sh;
            return (
              <g key={i}>
                <path d={s.d} fill={s.fill} opacity={op} />
                <mask id={mid} maskUnits="userSpaceOnUse" x={n2(mx)} y={n2(my)} width={n2(mw)} height={n2(mh)}>
                  <path d={s.d} fill="#fff" />
                  <path d={s.d} fill="#000" transform={`translate(${n2(ox)} ${n2(-off * sh * 1.05)})`} filter={`url(#${uid}su)`} />
                </mask>
                <rect x={n2(mx)} y={n2(my)} width={n2(mw)} height={n2(mh)} mask={`url(#${mid})`} fill={shade(s.fill)} opacity={op} />
              </g>
            );
          })}
        </g>
      </g>
    </g>
  );
};
/** the fog of a prop at depth Z (as the people's) */
const propFog = (A: AirWorld, Z: number, h = 60) => {
  const f = A.folkFog(Z, h - 150);
  return { to: typeof f.rgb === "string" ? f.rgb : "#000000", amount: f.amount };
};

// ===================================================================================================================
// POSES (romeFolk FigPose; dir 1 = facing screen right; armL is then the NEAR arm, his right hand)
// ===================================================================================================================
const RS = RomeFolk.STAND as FigPose;
type Arm = FigPose["armL"];
const arm = (w: P2, fist: number, hand = 0, elbow: P2 = [-0.2, 1]): Arm => ({ w, elbow, fist, hand });
const lerpP = (a: P2, b: P2, t: number): P2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
/** a keyed loop over u 0..1 of 2D points: a periodic cubic Hermite through the keys (slopes from the neighbours), so
 *  the hands keep moving through each key instead of stopping on it. keys[0] and the last key (u 1) are the same pose. */
const loopKeys = (keys: [number, P2][], u0: number): P2 => {
  const u = frac(u0);
  const K = keys.slice(0, -1);
  const n = K.length;
  const at = (i: number): [number, P2] => {
    const j = ((i % n) + n) % n;
    const wrap = Math.floor(i / n);
    return [K[j][0] + wrap, K[j][1]];
  };
  let i = 0;
  while (i < n - 1 && u >= K[i + 1][0]) i++;
  const [ua, pa] = at(i);
  const [ub, pb] = at(i + 1);
  const [um, pm] = at(i - 1);
  const [un, pn] = at(i + 2);
  const h = ub - ua;
  const t = (u - ua) / h;
  const slope = (q0: P2, u0_: number, q1: P2, u1_: number, c: number) => ((q1[c] - q0[c]) / (u1_ - u0_)) * h;
  const out: P2 = [0, 0];
  for (const c of [0, 1]) {
    const m0 = 0.5 * (slope(pm, um, pa, ua, c) + slope(pa, ua, pb, ub, c));
    const m1 = 0.5 * (slope(pa, ua, pb, ub, c) + slope(pb, ub, pn, un, c));
    const t2 = t * t;
    const t3 = t2 * t;
    out[c] = (2 * t3 - 3 * t2 + 1) * pa[c] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * pb[c] + (t3 - t2) * m1;
  }
  return out;
};
const loopNum = (keys: [number, number][], u0: number) => loopKeys(keys.map(([u, v]) => [u, [v, 0] as P2]), u0)[0];
/** elbow hints that turn with the arm (romeCast's perpHint): perpendicular to the shoulder -> wrist line, always on the
 *  same side, so the two-bone IK never flips an elbow as a hand swings past it. side 1 = below / behind the line. */
const MAN_SPEC = RomeFolk.romeSpec("freeman", 0);
type Spec = typeof MAN_SPEC;
/** also keeps every wrist target inside REACH of the arm's length: at full stretch the IK's elbow has an infinite slope
 *  (an arm locking straight snaps), so a target is drawn in smoothly as it nears the reach */
const REACH = 0.9;
const steadyElbows = (q: FigPose, sp: Spec = MAN_SPEC, sideL = 1, sideR = 1): FigPose => {
  const r = figureRig(sp, q);
  const reach = (sp.arm[0] + sp.arm[1]) * REACH;
  const fix = (S: P2, ap: Arm, side: number): Arm => {
    let dx = ap.w[0] - S[0];
    let dy = ap.w[1] - S[1];
    const L = Math.hypot(dx, dy) || 1;
    // a soft limit: lengths up to 0.8 reach pass, beyond they ease toward reach (never reaching it)
    const k0 = 0.8 * reach;
    const Lc = L <= k0 ? L : k0 + (reach - k0) * (1 - Math.exp(-(L - k0) / (reach - k0)));
    dx *= Lc / L;
    dy *= Lc / L;
    return { ...ap, w: [S[0] + dx, S[1] + dy], elbow: [(-dy / Lc) * side, (dx / Lc) * side] };
  };
  return { ...q, armL: fix(r.armL.S, q.armL, sideL), armR: fix(r.armR.S, q.armR, sideR) };
};
const R_REAP: FigPose = { ...RS, yaw: 0.95, headYaw: 0.92, lean: 38, crouch: 24, pitch: 14, footL: [-30, 0], footR: [30, 0], brow: 0.3, lids: 0.35, mouth: 0 };
/** the reaping cycle (u 0..1): the far hand grasps a handful of stalks ahead (u 0..0.18), the sickle in the near hand
 *  sweeps under it and cuts (0.18..0.36), the far hand lifts the cut handful and lays it on his pile beside his near
 *  foot (0.4..0.66), both hands come back for the next (0.66..1) */
export const REAP = {
  /** the cut handful is in the far hand from cutAt to dropAt */
  cutAt: 0.34,
  dropAt: 0.68,
  /** the pile beside him (units from his feet, in the facing frame) */
  pile: [-58, 0] as P2,
};
const REAP_FAR: [number, P2][] = [
  [0, [96, -118]],
  [0.16, [112, -100]],
  [0.36, [106, -106]],
  [0.48, [66, -142]],
  [0.58, [6, -110]],
  [0.68, [-30, -70]],
  [0.82, [28, -124]],
  [1, [96, -118]],
];
const REAP_NEAR: [number, P2][] = [
  [0, [58, -150]],
  [0.14, [54, -156]],
  [0.24, [94, -112]],
  [0.36, [126, -82]],
  [0.5, [98, -110]],
  [0.7, [66, -146]],
  [1, [58, -150]],
];
const REAP_LEAN: [number, number][] = [
  [0, 38],
  [0.2, 42],
  [0.36, 44],
  [0.52, 34],
  [0.66, 41],
  [0.84, 36],
  [1, 38],
];
export const reapPose = (dir: 1 | -1, u: number, sp?: Spec): FigPose => {
  const far = loopKeys(REAP_FAR, u);
  const near = loopKeys(REAP_NEAR, u);
  const uu = frac(u);
  // the fist closes on the stalks (0.08..0.16) and opens to let the handful go (dropAt - 0.02 .. + 0.06)
  const sm = (a: number, b: number, v: number) => ease((v - a) / (b - a));
  const grip = 0.35 + 0.65 * (sm(0.08, 0.16, uu) - sm(REAP.dropAt - 0.02, REAP.dropAt + 0.06, uu));
  const q: FigPose = {
    ...R_REAP,
    lean: loopNum(REAP_LEAN, u),
    armL: arm(near, 1, -10, [-0.4, 1]),
    armR: arm(far, grip, 10, [0.3, 1]),
  };
  const qs = steadyElbows(q, sp);
  return dir === 1 ? qs : RomeFolk.mirrorPose(qs);
};
/** the handful: 0 none, 1 in the far hand; count = handfuls laid on the pile so far */
export const reapGrip = (u: number) => {
  const uu = frac(u);
  return { inHand: uu >= REAP.cutAt && uu < REAP.dropAt ? 1 : 0, laid: Math.floor(u - REAP.dropAt) + 1 };
};
const R_BIND: FigPose = { ...RS, yaw: 0.95, headYaw: 0.95, lean: 30, crouch: 70, pitch: 22, footL: [-66, 4], footR: [-60, 4], liftL: 60, liftR: 60, brow: 0.3, lids: 0.45 };
/** kneeling over a sheaf lying in front (at BIND.sheaf), twisting the straw band round it */
export const BIND = { sheaf: [70, 0] as P2 };
export const bindPose = (dir: 1 | -1, u: number, sp?: Spec): FigPose => {
  const a = 2 * Math.PI * u;
  const q: FigPose = {
    ...R_BIND,
    lean: 30 + 3 * Math.sin(a),
    armL: arm([66 + 10 * Math.cos(a), -54 + 8 * Math.sin(a)], 0.8, 0, [-0.3, 1]),
    armR: arm([84 - 10 * Math.cos(a), -60 - 8 * Math.sin(a)], 0.8, 0, [0.3, 1]),
  };
  const qs = steadyElbows(q, sp);
  return dir === 1 ? qs : RomeFolk.mirrorPose(qs);
};
const R_GLEAN: FigPose = { ...RS, yaw: 0.9, headYaw: 0.9, lean: 36, crouch: 22, pitch: 18, footL: [-20, 0], footR: [24, 0], brow: 0.2, lids: 0.4 };
/** stooping to pick up fallen ears, the near hand holding a small bunch at the chest */
export const gleanPose = (dir: 1 | -1, u: number, sp?: Spec): FigPose => {
  const reach = 0.5 - 0.5 * Math.cos(2 * Math.PI * u);
  const q: FigPose = {
    ...R_GLEAN,
    lean: 30 + 14 * reach,
    armL: arm([30, -170], 1, -20, [-0.6, 1]),
    armR: arm(lerpP([40, -120], [96, -40], reach), mix(0.3, 0.9, reach), 0, [0.3, 1]),
  };
  const qs = steadyElbows(q, sp);
  return dir === 1 ? qs : RomeFolk.mirrorPose(qs);
};
/** the ploughman: walking behind the ard, both hands on the stilt (gripped by world point) */
export const ploughPose = (dir: 1 | -1, u: number): FigPose => {
  const w = RomeFolk.POSES.walk(1, u, 0.7);
  const q: FigPose = { ...w, lean: 16, crouch: 8, pitch: 6, brow: 0.4 };
  return dir === 1 ? q : RomeFolk.mirrorPose(q);
};

// ===================================================================================================================
// PROPS (cast units; feet / base at (0, 0), up - y, facing +x)
// ===================================================================================================================
/** the falx messoria: a short wooden handle in the fist and a curved iron blade (shapes in cast units about the grip,
 *  rotated by ang deg: 0 = the blade's line pointing +x) */
const sickleShapes = (ang: number): Shape[] => {
  const T = (v: P2): P2 => rot(v, ang);
  return [
    { d: tubeD([T([-16, 0]), T([0, 0]), T([10, 0])], [5.2, 5.6, 5]), fill: "#6E5440", sh: 0.4 },
    {
      // the blade runs on from the handle and curls up and back: its inner (cutting) edge faces the reaper
      d: closedD([T([8, 2]), T([26, 10]), T([46, 16]), T([64, 12]), T([74, -2]), T([70, -18]), T([62, -26]), T([66, -12]), T([60, 0]), T([46, 6]), T([28, 2]), T([10, -3])], 0.7),
      fill: "#7C858A",
      sh: 0.5,
    },
  ];
};
/** a sheaf lying on its side (length ~110: the cut ends at -x, the ears at +x), bound with a straw band */
const sheafShapes = (len = 96, girth = 30): Shape[] => {
  // a bound sheaf lying down: straight cut butts at -x, pinched at the tie, the ears fanning out at +x
  const L = len / 2;
  const g = girth / 2;
  const S: Shape[] = [];
  S.push({ d: closedD([[-L, -g * 1.9], [-L * 0.3, -g * 1.5], [-L * 0.05, -g * 1.25], [L * 0.25, -g * 1.6], [L * 0.6, -g * 2.2], [L * 0.6, 0], [L * 0.25, -g * 0.4], [-L * 0.05, -g * 0.55], [-L * 0.3, -g * 0.3], [-L, 0]], 0.6), fill: mixC(FARM_MAT.straw, FARM_MAT.stalk, 0.35) });
  // the ears: a fan of five slim heads
  for (let i = 0; i < 5; i++) {
    const a = -26 + i * 13;
    const c: P2 = add([L * 0.55, -g * 1.1], rot([L * 0.42, 0], a));
    S.push({ d: ellD(c, L * 0.24, g * 0.32, a), fill: i % 2 ? FARM_MAT.ear : mixC(FARM_MAT.ear, FARM_MAT.earLit, 0.35), sh: 0.5 });
  }
  S.push({ d: lineD([[-L * 0.9, -g * 1.4], [L * 0.2, -g * 1.5]]) + lineD([[-L * 0.9, -g * 0.5], [L * 0.2, -g * 0.7]]), fill: FARM_MAT.strawDark, det: 1.1, op: 0.45 });
  S.push({ d: closedD([[-L * 0.12, -g * 1.45], [L * 0.02, -g * 1.4], [L * 0.02, -g * 0.45], [-L * 0.12, -g * 0.4]], 0.4), fill: mixC(FARM_MAT.band, "#4E3F31", 0.2), sh: 0.2 });
  return S;
};
/** a stook: n sheaves standing, leaning together, ears up (~120 tall) */
const stookShapes = (n: number): Shape[] => {
  // n bound sheaves stood together: splayed butts on the ground, a tight tied waist, the ears fanning out above it
  // (an hourglass, the classic sheaf silhouette; it must read at 20-40 px)
  const S: Shape[] = [];
  const w = 24 + 9 * n;
  const body = mixC(FARM_MAT.straw, FARM_MAT.stalk, 0.3);
  S.push({
    d: closedD([[-w, 0], [-w * 0.62, -26], [-w * 0.3, -52], [-w * 0.34, -62], [-w * 0.8, -96], [-w * 1.0, -118], [-w * 0.45, -134], [0, -128], [w * 0.45, -136], [w * 1.0, -120], [w * 0.8, -96], [w * 0.34, -62], [w * 0.3, -52], [w * 0.62, -26], [w, 0], [0, 6]], 0.55),
    fill: body,
  });
  // the ears: a bumpy crown over the fan
  for (let i = 0; i < n + 3; i++) {
    const t = i / (n + 2);
    const x = mix(-w * 0.95, w * 0.95, t);
    const y = -118 - 14 * Math.sin(Math.PI * t);
    S.push({ d: ellD([x, y], 10, 17, (t - 0.5) * 70), fill: i % 2 ? FARM_MAT.ear : mixC(FARM_MAT.ear, FARM_MAT.earLit, 0.4), sh: 0.5 });
  }
  // straw lines below and above the tie, the tie itself (darker, so the waist reads)
  S.push({ d: lineD([[-w * 0.7, -4], [-w * 0.3, -50]]) + lineD([[0, 2], [0, -50]]) + lineD([[w * 0.7, -4], [w * 0.3, -50]]) + lineD([[-w * 0.3, -66], [-w * 0.75, -110]]) + lineD([[w * 0.3, -66], [w * 0.75, -110]]), fill: FARM_MAT.strawDark, det: 1.3, op: 0.5 });
  S.push({ d: closedD([[-w * 0.36, -64], [w * 0.36, -64], [w * 0.33, -52], [-w * 0.33, -52]], 0.3), fill: mixC(FARM_MAT.band, "#4E3F31", 0.3), sh: 0.2 });
  return S;
};
/** a small heap of cut stalks (the reaper's pile): `amt` 0..1+ grows it, each handful a few more strokes */
const pileShapes = (handfuls: number): Shape[] => {
  const S: Shape[] = [];
  const n = Math.max(1, Math.min(9, Math.round(handfuls)));
  for (let i = 0; i < n; i++) {
    // each handful: a slim bundle of stalks, the ears bunched at one end, laid crossing the last a little
    const x = ((i * 11) % 3) * 9 - 9;
    const y = -Math.floor(i / 3) * 6 - (i % 3) * 2;
    const a = -14 + ((i * 37) % 23);
    const T = (v: P2): P2 => add([x, y], rot(v, a));
    S.push({ d: closedD([T([-30, -3]), T([10, -5]), T([20, -6]), T([20, 3]), T([10, 2]), T([-30, 3])], 0.5), fill: i % 2 ? FARM_MAT.stalk : mixC(FARM_MAT.stalk, FARM_MAT.strawDark, 0.4), sh: 0.4 });
    S.push({ d: closedD([T([16, -8]), T([30, -10]), T([40, -6]), T([40, 4]), T([28, 6]), T([16, 4])], 0.8), fill: FARM_MAT.ear, sh: 0.5 });
    S.push({ d: lineD([T([-28, -1]), T([18, -2])]), fill: FARM_MAT.strawDark, det: 1.2, op: 0.5 });
  }
  return S;
};
/** a grain heap on a cloth (cut 20's Roman harvest): w half-width, h height */
const heapShapes = (w: number, h: number): Shape[] => [
  { d: closedD([[-w * 1.18, 0], [-w * 0.6, -h * 0.1], [w * 0.6, -h * 0.1], [w * 1.2, 0], [w * 0.7, 10], [-w * 0.8, 10]], 0.7), fill: "#B8A88A", sh: 0.3 },
  { d: closedD([[-w, -2], [-w * 0.55, -h * 0.62], [0, -h], [w * 0.55, -h * 0.6], [w, -2]], 0.85), fill: "#CDBB8E" },
];

// ---- the ox -----------------------------------------------------------------------------------------------------
export const OX_COATS = {
  // (Oct 26) dun / grey-brown hides, mid value, lighter muzzles: cattle silhouettes at 30-60 px, never pale scraps
  fawn: { body: "#8F7C66", dark: "#685847", muzzle: "#BBAA90", horn: "#E2D8C2", hoof: "#3E342B" },
  brown: { body: "#7A6553", dark: "#57483B", muzzle: "#A8977F", horn: "#DDD2BA", hoof: "#362D25" },
};
export type OxCoat = (typeof OX_COATS)["fawn"];
/** leg hoof offset (x rel. its hip, lift) for a walk phase: planted stance 0..0.62 sliding back at the body's speed */
const hoofOf = (p0: number, stride: number): [number, number] => {
  const p = frac(p0);
  const st = 0.62;
  if (p < st) return [stride / 2 - (p / st) * stride, 0];
  const v = (p - st) / (1 - st);
  return [-stride / 2 + ease(v) * stride, -16 * Math.sin(Math.PI * v)];
};
/** one ox in side view facing +x (cast units: ~430 long, withers ~255 high); phase = its walk (0..1 per stride
 *  cycle), stride = the hoof travel per cycle (0 = standing) */
export const oxShapes = (coat: OxCoat, phase: number, stride: number): Shape[] => {
  const bob = stride > 0 ? 2.5 * Math.sin(4 * Math.PI * phase) : 0;
  const B = (v: P2): P2 => [v[0], v[1] + bob];
  const S: Shape[] = [];
  const leg = (hipX: number, hipY: number, p: number, fore: boolean, far: boolean) => {
    const [hx, lift] = hoofOf(p, stride);
    const hoof: P2 = [hipX + hx, lift];
    const hip: P2 = B([hipX, hipY]);
    const mid: P2 = [mix(hip[0], hoof[0], 0.5) + (fore ? 6 : -12), mix(hip[1], hoof[1], 0.52)];
    const fill = far ? mixC(coat.dark, "#2C3433", 0.2) : coat.body;
    S.push({ d: tubeD([hip, mid, [hoof[0], hoof[1] - 14]], [fore ? 38 : 44, 21, 16]), fill, sh: far ? 0.3 : 0.8 });
    S.push({ d: closedD([[hoof[0] - 10, hoof[1] - 16], [hoof[0] + 10, hoof[1] - 16], [hoof[0] + 13, hoof[1]], [hoof[0] - 10, hoof[1]]], 0.3), fill: coat.hoof, sh: 0 });
  };
  // the far legs (behind the body)
  leg(-150, -150, phase + 0.5, false, true);
  leg(112, -150, phase + 0.75, true, true);
  // the tail
  const sw = 6 * Math.sin(2 * Math.PI * phase + 1);
  S.push({ d: tubeD([B([-206, -222]), B([-220 + sw * 0.3, -170]), B([-224 + sw, -112])], [9, 7, 6]), fill: coat.dark, sh: 0.3 });
  S.push({ d: ellD(B([-224 + sw, -100]), 9, 18, 4), fill: coat.muzzle, sh: 0.3 });
  // the body
  S.push({
    d: closedD([B([-212, -226]), B([-130, -248]), B([0, -246]), B([84, -264]), B([132, -252]), B([170, -218]), B([178, -160]), B([156, -122]), B([92, -110]), B([0, -114]), B([-104, -110]), B([-184, -124]), B([-218, -168])], 0.85),
    fill: coat.body,
  });
  // the dewlap and the neck to the head
  S.push({ d: closedD([B([128, -160]), B([166, -112]), B([196, -140]), B([186, -176])], 0.8), fill: mixC(coat.body, coat.dark, 0.25), sh: 0.4 });
  const nod = stride > 0 ? 4 * Math.sin(2 * Math.PI * phase * 2) : 0;
  const H = (v: P2): P2 => B([v[0], v[1] + nod]);
  S.push({ d: closedD([H([140, -248]), H([200, -232]), H([236, -206]), H([214, -150]), H([170, -150]), H([150, -200])], 0.8), fill: coat.body });
  // the head: a long, gentle face, the muzzle darker
  S.push({ d: closedD([H([196, -236]), H([232, -232]), H([266, -196]), H([290, -158]), H([286, -134]), H([262, -128]), H([236, -150]), H([206, -186])], 0.75), fill: coat.body });
  S.push({ d: closedD([H([268, -166]), H([290, -156]), H([288, -132]), H([264, -128]), H([258, -146])], 0.8), fill: coat.muzzle, sh: 0.3 });
  // horns (curving forward and up), the ear
  S.push({ d: tubeD([H([206, -230]), H([214, -256]), H([236, -272]), H([256, -268])], [13, 10, 7, 4]), fill: coat.horn, sh: 0.4 });
  S.push({ d: ellD(H([190, -222]), 20, 9, 18), fill: mixC(coat.body, coat.dark, 0.35), sh: 0.4 });
  S.push({ d: ellD(H([238, -200]), 4.6, 4.6), fill: "#2A221C", sh: 0 });
  S.push({ d: ellD(H([276, -150]), 2.6, 2.2), fill: "#2A221C", sh: 0, op: 0.7 });
  // the near legs (in front)
  leg(-140, -150, phase, false, false);
  leg(120, -150, phase + 0.25, true, false);
  return S;
};
/** the yoke on the near ox's neck (seen from the side: the beam's end and the bow) */
const yokeShapes = (): Shape[] => [
  { d: closedD([[146, -276], [196, -270], [198, -250], [148, -254]], 0.3), fill: MAT.timber.mid, sh: 0.5 },
  { d: tubeD([[156, -254], [150, -214], [170, -184], [192, -214], [190, -252]], [7, 6, 6, 6, 7]), fill: MAT.timber.dark, sh: 0.2 },
];
/** the ard (the Roman scratch plough): the share in the ground at x 0, the sole, the beam rising forward to the pole,
 *  the stilt rising back to the handle (cast units; +x = forward) */
export const ARD_GEOM = { handle: [-150, -205] as P2, beamFront: [210, -120] as P2 };
const ardShapes = (): Shape[] => [
  { d: tubeD([[-60, -8], [0, -6], [40, 0]], [12, 12, 8]), fill: MAT.timber.mid, sh: 0.5 },
  { d: closedD([[30, -8], [64, 0], [30, 6]], 0.2), fill: "#7C858A", sh: 0.3 },
  { d: tubeD([[-40, -10], [-96, -110], [-150, -205]], [11, 10, 9]), fill: MAT.timber.mid, sh: 0.5 },
  { d: tubeD([[-20, -10], [90, -80], [210, -120]], [12, 11, 10]), fill: mixC(MAT.timber.mid, MAT.timber.lit, 0.3), sh: 0.5 },
];

// ===================================================================================================================
// DRAWN PIECES
// ===================================================================================================================
/** a prop of shapes at world (X, Z), dir mirrors */
const PropAt: React.FC<{ A: AirWorld; X: number; Z: number; shapes: Shape[]; uid: string; dir?: 1 | -1; h?: number; texture?: boolean }> = ({ A, X, Z, shapes, uid, dir = 1, h = 60, texture }) => {
  const { at, scale } = A.P.at(X, Z);
  return <FarmPaint shapes={shapes} at={at} scale={scale} uid={uid} fog={propFog(A, Z, h)} unitPx={A.k} flip={dir === -1} texture={texture} />;
};
export const Sheaf: React.FC<{ A: AirWorld; X: number; Z: number; dir?: 1 | -1; uid: string }> = ({ A, X, Z, dir = 1, uid }) => <PropAt A={A} X={X} Z={Z} shapes={sheafShapes()} uid={uid} dir={dir} h={20} />;
export const Stook: React.FC<{ A: AirWorld; X: number; Z: number; n?: number; uid: string }> = ({ A, X, Z, n = 3, uid }) => <PropAt A={A} X={X} Z={Z} shapes={stookShapes(n)} uid={uid} h={60} />;
export const GrainHeap: React.FC<{ A: AirWorld; X: number; Z: number; w?: number; h?: number; uid: string }> = ({ A, X, Z, w = 70, h = 60, uid }) => <PropAt A={A} X={X} Z={Z} shapes={heapShapes(w, h)} uid={uid} h={h / 2} />;
export const Ox: React.FC<{ A: AirWorld; X: number; Z: number; dir: 1 | -1; phase: number; stride: number; coat: OxCoat; uid: string; yoke?: boolean }> = ({ A, X, Z, dir, phase, stride, coat, uid, yoke }) => (
  <PropAt A={A} X={X} Z={Z} shapes={[...oxShapes(coat, phase, stride), ...(yoke ? yokeShapes() : [])]} uid={uid} dir={dir} h={160} />
);

// ---- the wheat ---------------------------------------------------------------------------------------------------
/** a slice of tufts at about one depth: stalks (thin strokes, a gentle bend), ears (short thick strokes, a lit tip)
 *  drawn as three paths. `w` scales the stroke weights with the row's tuft spacing (far tufts stand for clumps). */
export const WheatTufts: React.FC<{ A: AirWorld; frame: number; tufts: Tuft[]; zMid: number; w?: number; uid?: string }> = ({ A, frame, tufts, zMid, w = 1 }) => {
  const P = A.P;
  const r = P.r(zMid);
  let dS = "";
  let dE = "";
  let dA = "";
  const k = A.cam.k;
  const cx0 = A.cam.cx - 560 / k;
  const cx1 = A.cam.cx + 560 / k;
  const cy1 = A.cam.cy + 980 / k;
  const cy0 = A.cam.cy - 980 / k;
  const many = w <= 1.25;
  const awns = r * k * w > 0.9;
  for (const t of tufts) {
    const b = P.p(t.X, 0, t.Z);
    if (b[0] < cx0 - 40 * r * w || b[0] > cx1 + 40 * r * w || b[1] < cy0 || b[1] - t.h * r > cy1) continue;
    const sway = windAt(t, frame);
    const n = many ? t.n : 1;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * 9 * w;
      const hh = t.h * (1 - 0.08 * Math.abs(i - (n - 1) / 2));
      const top = P.p(t.X + spread * 1.4 + t.lean * hh + sway, -hh, t.Z);
      const mid = P.p(t.X + spread * 0.5 + (t.lean * hh + sway) * 0.3, -hh * 0.55, t.Z);
      dS += `M${n1(b[0] + spread * 0.25 * r)},${n1(b[1])}Q${n1(mid[0])},${n1(mid[1])} ${n1(top[0])},${n1(top[1])}`;
      // the ear: a short slim spindle continuing the stalk's line, nodding a little; near rows add the awns
      const ux = top[0] - mid[0];
      const uy = top[1] - mid[1];
      const L = Math.hypot(ux, uy) || 1;
      const ex = (ux / L) * 15 * r * w + 1.2 * r * w;
      const ey = (uy / L) * 15 * r * w;
      dE += `M${n1(top[0])},${n1(top[1])}l${n1(ex)},${n1(ey)}`;
      if (awns) {
        // fine bristles along the ear, nearly parallel to it, a little longer than the ear
        for (const [a0, sp] of [
          [0.35, -0.07],
          [0.65, 0.05],
          [1, 0],
        ] as [number, number][])
          dA += `M${n1(top[0] + ex * a0)},${n1(top[1] + ey * a0)}l${n1(ex * 1.05 - ey * sp)},${n1(ey * 1.05 + ex * sp)}`;
      }
    }
  }
  if (!dS) return null;
  const sw = 1.7 * r * w;
  return (
    <g>
      <path d={dS} fill="none" stroke={A.tone(FARM_MAT.stalk, zMid, 60)} strokeWidth={n2(sw)} strokeLinecap="round" />
      <path d={dE} fill="none" stroke={A.tone(FARM_MAT.ear, zMid, 110)} strokeWidth={n2(sw * 2.5)} strokeLinecap="round" />
      {dA ? <path d={dA} fill="none" stroke={A.tone(FARM_MAT.earLit, zMid, 120)} strokeWidth={n2(sw * 0.32)} strokeLinecap="round" strokeOpacity={0.55} /> : null}
    </g>
  );
};

// ---- trees -------------------------------------------------------------------------------------------------------
/** an olive: a short twisted grey-brown trunk, a rounded silver-green crown of a few soft lobes (~520 tall) */
const oliveShapes = (seed: number): Shape[] => {
  const j = (k: number) => frac(Math.sin(seed * 91.7 + k * 13.1) * 4375.5);
  const S: Shape[] = [];
  S.push({ d: tubeD([[0, 0], [-14 + 20 * j(1), -90], [10 - 26 * j(2), -170], [-6, -240]], [60, 40, 34, 26]), fill: FARM_MAT.bark, sh: 0.6 });
  S.push({ d: tubeD([[-4, -150], [-60 - 30 * j(3), -230]], [20, 12]), fill: FARM_MAT.bark, sh: 0.5 });
  const lobes: [number, number, number, number][] = [
    [-120, -300, 110, 82],
    [110, -296, 118, 86],
    [-10, -330, 150, 110],
    [-80, -400, 112, 84],
    [70, -410, 120, 86],
    [0, -460, 96, 70],
  ];
  lobes.forEach(([x, y, rx, ry], i) => {
    const jx = (j(10 + i) - 0.5) * 30;
    const jy = (j(20 + i) - 0.5) * 20;
    S.push({ d: ellD([x + jx, y + jy], rx, ry, (j(30 + i) - 0.5) * 30), fill: i % 2 ? FARM_MAT.olive : mixC(FARM_MAT.olive, FARM_MAT.oliveDark, 0.35) });
  });
  // a few lit leaf clusters on the upper left
  S.push({ d: ellD([-60, -420], 46, 26, -15), fill: FARM_MAT.oliveLit, sh: 0.2, op: 0.75 });
  S.push({ d: ellD([-120, -330], 38, 22, -10), fill: FARM_MAT.oliveLit, sh: 0.2, op: 0.6 });
  return S;
};
export const OliveTree: React.FC<{ A: AirWorld; t: Tree; uid: string }> = ({ A, t, uid }) => {
  const { at, scale } = A.P.at(t.X, t.Z);
  return <FarmPaint shapes={oliveShapes(t.seed)} at={at} scale={scale * t.s} uid={uid} fog={propFog(A, t.Z, 300)} unitPx={A.k} />;
};

// ---- the farmers ---------------------------------------------------------------------------------------------------
const roleU = (f: Farmer, frame: number) => frame / f.cyc + f.ph;
export const farmerPose = (f: Farmer, frame: number): FigPose => {
  const u = roleU(f, frame);
  switch (f.role) {
    case "reap":
      return reapPose(f.dir, u, RomeFolk.romeSpec(f.kind, f.variant));
    case "bind":
      return bindPose(f.dir, u, RomeFolk.romeSpec(f.kind, f.variant));
    case "glean":
      return gleanPose(f.dir, u, RomeFolk.romeSpec(f.kind, f.variant));
    case "carry":
      return RomeFolk.POSES.carry(f.dir, frame / RomeFolk.WALK_CYCLE + f.ph, 1);
    case "walk":
      return RomeFolk.POSES.walk(f.dir, frame / RomeFolk.WALK_CYCLE + f.ph, 1);
    default:
      return RomeFolk.idle(RomeFolk.POSES.stand(f.dir), frame + f.ph * 100);
  }
};
/** the X of a moving farmer at a frame (carriers walk at the cast's planted-foot speed) */
export const farmerX = (f: Farmer, frame: number) => (f.role === "carry" || f.role === "walk" ? f.X + f.dir * RomeFolk.walkAdvance(1) * frame : f.X);
/** who wears the straw sun hat: the hero, and about 40% of the men (never the women) */
export const wearsHat = (f: Farmer) => f.id === "hero" || (!RomeFolk.isFemale(f.kind, f.variant) && frac(Math.sin(f.id.length * 12.9 + f.id.charCodeAt(f.id.length - 1) * 78.2) * 4375.5) < 0.4);
/** the PETASOS: a Roman straw sun hat, a low rounded crown and a broad brim drooping a little at its edges, sitting on
 *  the head (world 2D coordinates; follows the head's tilt: headC -> headTop) */
export const Petasos: React.FC<{ headC: P2; headTop: P2; headR: number; fogTo: string; fog: number }> = ({ headC, headTop, headR, fogTo, fog }) => {
  const ux0 = headTop[0] - headC[0];
  const uy0 = headTop[1] - headC[1];
  const L = Math.hypot(ux0, uy0) || 1;
  const u: P2 = [ux0 / L, uy0 / L];
  const v: P2 = [-u[1], u[0]];
  const R = headR;
  const W = (a: number, b: number): P2 => [headC[0] + u[0] * a + v[0] * b, headC[1] + u[1] * a + v[1] * b];
  const c = (hex: string) => mixC(hex, fogTo, fog);
  const yB = R * 0.52;
  const Q = (p: P2) => Pt(p);
  // the brim: a broad flat disc seen nearly edge-on, its two ends drooping a little (smooth curves, no creases)
  const brimD = `M${Q(W(yB - R * 0.2, -R * 1.9))}Q${Q(W(yB + R * 0.42, -R * 1.1))} ${Q(W(yB + R * 0.42, 0))}Q${Q(W(yB + R * 0.42, R * 1.1))} ${Q(W(yB - R * 0.2, R * 1.9))}Q${Q(W(yB - R * 0.02, R * 1.2))} ${Q(W(yB - R * 0.02, 0))}Q${Q(W(yB - R * 0.02, -R * 1.2))} ${Q(W(yB - R * 0.2, -R * 1.9))}Z`;
  // the crown: a low smooth dome
  const crownD = `M${Q(W(yB + R * 0.2, -R * 0.8))}C${Q(W(yB + R * 0.95, -R * 0.82))} ${Q(W(yB + R * 0.95, R * 0.82))} ${Q(W(yB + R * 0.2, R * 0.8))}Z`;
  // one band round the crown's foot
  const bandD = `M${Q(W(yB + R * 0.2, -R * 0.8))}Q${Q(W(yB + R * 0.42, 0))} ${Q(W(yB + R * 0.2, R * 0.8))}L${Q(W(yB + R * 0.34, R * 0.79))}Q${Q(W(yB + R * 0.56, 0))} ${Q(W(yB + R * 0.34, -R * 0.79))}Z`;
  const lw = Math.max(0.3, R * 0.04);
  return (
    <g>
      <path d={brimD} fill={c("#B6A478")} stroke={c("#8C7A55")} strokeWidth={lw} strokeLinejoin="round" />
      <path d={crownD} fill={c("#AA976C")} stroke={c("#8C7A55")} strokeWidth={lw} />
      <path d={bandD} fill={c("#76624A")} />
      <path d={`M${Q(W(yB + R * 0.62, -R * 0.5))}Q${Q(W(yB + R * 0.8, -R * 0.2))} ${Q(W(yB + R * 0.78, R * 0.1))}`} fill="none" stroke={c("#D6C8A2")} strokeWidth={Math.max(0.3, R * 0.09)} strokeLinecap="round" opacity={0.65} />
    </g>
  );
};
/** one farmer with what belongs to him: the contact shadow, his pile and the sheaves he has laid, the sickle, the
 *  handful in his far hand */
export const FarmerFig: React.FC<{ A: AirWorld; f: Farmer; frame: number; texture?: boolean }> = ({ A, f, frame, texture }) => {
  const X = farmerX(f, frame);
  const pa = A.P.at(X, f.Z);
  const at = pa.at;
  const scale = pa.scale * FIG_SCALE;
  const pose = farmerPose(f, frame);
  const fog = A.folkFog(f.Z);
  const pxH = 312 * scale * A.k;
  const tex = texture ?? pxH > 46;
  const u = roleU(f, frame);
  const els: React.ReactNode[] = [];
  els.push(<AirShadow key="sh" A={A} X={X + 20 * f.dir} Z={f.Z} w={f.role === "bind" ? 90 : 76} d={34} uid={`${f.id}s`} amt={0.7} />);
  if (f.role === "reap") {
    // his pile beside his near foot, growing by one handful each cycle; the sheaves he bound earlier lie behind him
    const g = reapGrip(u);
    const base = 2 + Math.floor(frac(f.ph * 7.3) * 3);
    const pile = base + Math.max(0, g.laid);
    for (let i = 0; i < (f.sheaves ?? 1); i++) els.push(<Sheaf key={`sf${i}`} A={A} X={X - f.dir * (210 + 150 * i)} Z={f.Z - 50 + 60 * i} dir={f.dir} uid={`${f.id}sf${i}`} />);
    els.push(<PropAt key="pile" A={A} X={X + f.dir * REAP.pile[0]} Z={f.Z - 18} shapes={pileShapes(pile)} uid={`${f.id}pl`} dir={f.dir} h={10} />);
  }
  if (f.role === "bind") els.push(<Sheaf key="bs" A={A} X={X + f.dir * BIND.sheaf[0]} Z={f.Z - 12} dir={f.dir} uid={`${f.id}bs`} />);
  const figProps = {
    kind: f.kind,
    variant: f.variant,
    pose,
    at,
    scale,
    uid: `${f.id}f`,
    fog,
    unitPx: A.k,
    texture: tex,
    inks: f.tunic ? { tunic: f.tunic } : undefined,
    load: f.role === "carry" ? ("basket" as const) : undefined,
    apron: false,
    pilleus: false,
  };
  if (f.role === "reap" && pxH > 22) {
    // the cut handful is in the FAR hand: drawn before the figure, behind the body like the far arm
    const g = reapGrip(u);
    if (g.inHand) {
      const an0 = RomeFolk.romeAnchors(f.kind, pose, at, scale, { variant: f.variant });
      const farH = an0.handFar as P2;
      const t = c01((frac(u) - REAP.cutAt) / 0.06);
      els.push(<FarmPaint key="hf" shapes={handfulShapes(t)} at={farH} scale={scale} uid={`${f.id}h`} fog={{ to: typeof fog.rgb === "string" ? fog.rgb : "#000", amount: fog.amount }} unitPx={A.k} flip={f.dir === -1} texture={false} />);
    }
  }
  els.push(<RomeFolk.RomeFigure key="fig" {...figProps} />);
  if (wearsHat(f) && pxH > 14) {
    const an = RomeFolk.romeAnchors(f.kind, pose, at, scale, { variant: f.variant });
    const ft = typeof fog.rgb === "string" ? fog.rgb : "#000000";
    els.push(<Petasos key="hat" headC={an.headC as P2} headTop={an.headTop as P2} headR={an.headR as number} fogTo={ft} fog={fog.amount} />);
  }
  if (f.role === "reap" && pxH > 22) {
    const an = RomeFolk.romeAnchors(f.kind, pose, at, scale, { variant: f.variant });
    const near = an.handNear as P2;
    const wrist = (f.dir === 1 ? an.wristL : an.wristR) as P2;
    const ang = (Math.atan2(near[1] - wrist[1], (near[0] - wrist[0]) * f.dir) * 180) / Math.PI;
    els.push(<FarmPaint key="sk" shapes={sickleShapes(ang - 10)} at={near} scale={scale} uid={`${f.id}k`} fog={{ to: typeof fog.rgb === "string" ? fog.rgb : "#000", amount: fog.amount }} unitPx={A.k} flip={f.dir === -1} texture={false} />);
  }
  return <g>{els}</g>;
};
/** the cut handful in the fist: stalks hanging down-forward, ears up (t: 0..1 as it comes free) */
const handfulShapes = (t: number): Shape[] => {
  const S: Shape[] = [];
  for (let i = 0; i < 5; i++) {
    // a tight bundle held near its middle: cut ends below the fist, the ears bunched above it
    const a = -94 + i * 2.2;
    const L = 46 + 3 * (i % 3);
    const T = (v: P2): P2 => rot(v, a);
    S.push({ d: tubeD([T([-26 - 2 * t, (i - 2) * 1.5]), T([L * 0.6, (i - 2) * 2.2]), T([L * 0.95, (i - 2) * 3])], [3, 2.6, 2.2]), fill: FARM_MAT.stalk, sh: 0 });
    S.push({ d: ellD(T([L + 7, (i - 2) * 3.2]), 9, 3.4, a), fill: FARM_MAT.ear, sh: 0.4 });
  }
  return S;
};

// ---- the ox team ------------------------------------------------------------------------------------------------
export const oxPhase = (frame: number) => frame / OX_TEAM.cyc;
const OX_STRIDE = 0.62 * OX_TEAM.cyc * Math.abs(OX_TEAM.vx);
/** the whole team, as separate depth items (the far ox, the pole, the near ox, the ard, the ploughman) */
export const oxTeamItems = (A: AirWorld, frame: number): { z: number; el: React.ReactNode }[] => {
  const d = OX_TEAM.dir;
  const X = oxTeamX(frame);
  const ph = oxPhase(frame);
  const Zn = OX_TEAM.Z;
  const Zf = OX_TEAM.Z + OX_TEAM.farDZ;
  // the body centre is OX_LEN / 2 behind the head end; the shapes' origin is the body centre (x 0)
  const cx = X - d * 260;
  const share = shareX(frame);
  const out: { z: number; el: React.ReactNode }[] = [];
  out.push({ z: Zf, el: <g key="oxf"><AirShadow A={A} X={cx} Z={Zf} w={230} d={60} uid="oxfs" amt={0.6} /><Ox A={A} X={cx + d * 115} Z={Zf} dir={d} phase={ph + 0.5} stride={OX_STRIDE} coat={OX_COATS.brown} uid="oxf" /></g> });
  // the pole: from the yoke (between the two necks) back to the ard's beam
  const yokeX = cx + d * 175;
  const ardBeam = share + d * ARD_GEOM.beamFront[0];
  const Zp = (Zn + Zf) / 2;
  const P = A.P;
  const a = P.p(yokeX, -232, Zp);
  const b = P.p(ardBeam, -ARD_GEOM.beamFront[1] * -1, Zp);
  const pw = 9 * P.r(Zp);
  out.push({
    z: Zp,
    el: <path key="pole" d={`M${Pt(a)}L${Pt(b)}`} stroke={A.tone(MAT.timber.mid, Zp, 160)} strokeWidth={n2(pw)} strokeLinecap="round" />,
  });
  out.push({ z: Zn, el: <g key="oxn"><AirShadow A={A} X={cx} Z={Zn} w={230} d={60} uid="oxns" amt={0.7} /><Ox A={A} X={cx} Z={Zn} dir={d} phase={ph} stride={OX_STRIDE} coat={OX_COATS.fawn} uid="oxn" yoke /></g> });
  // the ard at the share (between the oxen's line, a little nearer), the ploughman behind it
  const Za = Zp - 20;
  out.push({ z: Za, el: <PropAt key="ard" A={A} X={share} Z={Za} shapes={ardShapes()} uid="ard" dir={d} h={60} /> });
  const handle = P.p(share + d * ARD_GEOM.handle[0], ARD_GEOM.handle[1], Za);
  const pmX = share + d * (ARD_GEOM.handle[0] - 120);
  const pose = ploughPose(d, frame / RomeFolk.WALK_CYCLE);
  const pa0 = P.at(pmX, Za - 30);
  const pa = { at: pa0.at, scale: pa0.scale * FIG_SCALE };
  out.push({
    z: Za - 30,
    el: (
      <g key="pm">
        <AirShadow A={A} X={pmX + 20 * d} Z={Za - 30} w={70} d={30} uid="pms" amt={0.65} />
        <RomeFolk.RomeFigure kind="slave" variant={1} apron={false} pilleus={false} pose={pose} at={pa.at} scale={pa.scale} uid="pmf" fog={A.folkFog(Za - 30)} unitPx={A.k} grip={{ L: handle, R: [handle[0] - d * 4 * pa.scale, handle[1] + 6 * pa.scale] }} texture={312 * pa.scale * A.k > 46} />
      </g>
    ),
  });
  return out;
};

// ---- the cart ------------------------------------------------------------------------------------------------------
const cartShapes = (turn: number): Shape[] => {
  const S: Shape[] = [];
  // the load: sheaves stacked crosswise in two layers, ears outward
  const lay = (x: number, y: number, a: number, flip: boolean) => {
    const T = (v: P2): P2 => add([x, y], rot([flip ? -v[0] : v[0], v[1]], a));
    const L = 75;
    const g = 20;
    S.push({ d: closedD([T([-L, -g * 1.6]), T([L * 0.3, -g * 1.7]), T([L * 0.6, -g * 2.2]), T([L * 1.05, -g * 1.6]), T([L * 1.05, -g * 0.2]), T([L * 0.4, 0]), T([-L, -g * 0.1])], 0.7), fill: mixC(FARM_MAT.straw, FARM_MAT.stalk, 0.3) });
    S.push({ d: closedD([T([L * 0.35, -g * 1.75]), T([L * 0.7, -g * 2.35]), T([L * 1.15, -g * 1.7]), T([L * 1.15, -g * 0.4]), T([L * 0.7, 0]), T([L * 0.4, -g * 0.6])], 0.85), fill: FARM_MAT.ear, sh: 0.5 });
    S.push({ d: closedD([T([-L * 0.12, -g * 1.6]), T([0, -g * 1.6]), T([0, -g * 0.1]), T([-L * 0.12, -g * 0.1])], 0.4), fill: mixC(FARM_MAT.straw, FARM_MAT.band, 0.45), sh: 0.2 });
  };
  lay(-90, -150, -4, true);
  lay(90, -150, 4, false);
  lay(-60, -192, -8, true);
  lay(70, -194, 6, false);
  lay(0, -232, 0, false);
  // the bed and the rails
  S.push({ d: closedD([[-190, -150], [190, -150], [186, -110], [-186, -110]], 0.2), fill: MAT.timber.mid });
  S.push({ d: tubeD([[-180, -112], [-180, -200]], [9, 8]), fill: MAT.timber.dark, sh: 0.3 });
  S.push({ d: tubeD([[178, -112], [178, -196]], [9, 8]), fill: MAT.timber.dark, sh: 0.3 });
  // the pole forward
  S.push({ d: tubeD([[180, -128], [610, -246]], [10, 8]), fill: MAT.timber.mid, sh: 0.4 });
  // the solid wheel (a disc of planks with a hub), turning
  S.push({ d: ellD([0, -78], 78, 78), fill: MAT.timber.dark });
  S.push({ d: ellD([0, -78], 64, 64), fill: mixC(MAT.timber.mid, MAT.timber.dark, 0.3), sh: 0.3 });
  const a = turn * 2 * Math.PI;
  S.push({ d: lineD([[Math.cos(a) * 60, -78 + Math.sin(a) * 60], [-Math.cos(a) * 60, -78 - Math.sin(a) * 60]]) + lineD([[Math.cos(a + 1.2) * 60, -78 + Math.sin(a + 1.2) * 60], [-Math.cos(a + 1.2) * 60, -78 - Math.sin(a + 1.2) * 60]]), fill: MAT.timber.dark, det: 2, op: 0.7 });
  S.push({ d: ellD([0, -78], 15, 15), fill: MAT.timber.lit, sh: 0.4 });
  return S;
};
export const cartItems = (A: AirWorld, frame: number): { z: number; el: React.ReactNode }[] => {
  const X = cartX(frame);
  const Z = CART.Z;
  const ph = frame / CART.cyc;
  const turn = (frame * CART.vx) / (2 * Math.PI * 78);
  const stride = 0.62 * CART.cyc * CART.vx;
  return [
    { z: Z + 10, el: <g key="cart"><AirShadow A={A} X={X} Z={Z + 10} w={210} d={60} uid="cts" amt={0.6} /><PropAt A={A} X={X} Z={Z + 10} shapes={cartShapes(turn)} uid="cart" h={120} /></g> },
    { z: Z - 20, el: <g key="cox"><AirShadow A={A} X={X + 435} Z={Z - 20} w={230} d={60} uid="coxs" amt={0.6} /><Ox A={A} X={X + 435} Z={Z - 20} dir={1} phase={ph} stride={stride} coat={OX_COATS.fawn} uid="cox" yoke /></g> },
  ];
};

// ---- buildings ------------------------------------------------------------------------------------------------------
/** a pitched tile roof over a box (ridge along X): the front slope, the hip ends, tile courses */
const Roof: React.FC<{ A: AirWorld; X0: number; X1: number; Z0: number; Z1: number; Y: number; rise: number; uid: string; mat?: Mat; base?: number }> = ({ A, X0, X1, Z0, Z1, Y, rise, uid, mat = FARM_MAT.tile, base = 0 }) => {
  const P = A.P;
  const ov = 40;
  const x0 = X0 - ov;
  const x1 = X1 + ov;
  const z0 = Z0 - ov;
  const z1 = Z1 + ov;
  const zr = (z0 + z1) / 2;
  const yE = Y + base;
  const yR = yE - rise;
  const hip = (z1 - z0) / 2;
  const Zm = (Z0 + Z1) / 2;
  const h = -yR;
  const t = (c: string) => A.tone(c, Zm, h);
  const ln = t(lineOf(mat));
  const w = A.lw();
  const front = [P.p(x0, yE, z0), P.p(x1, yE, z0), P.p(x1 - hip, yR, zr), P.p(x0 + hip, yR, zr)];
  const left = [P.p(x0, yE, z0), P.p(x0 + hip, yR, zr), P.p(x0, yE, z1)];
  const right = [P.p(x1, yE, z0), P.p(x1, yE, z1), P.p(x1 - hip, yR, zr)];
  const back = [P.p(x0, yE, z1), P.p(x1, yE, z1), P.p(x1 - hip, yR, zr), P.p(x0 + hip, yR, zr)];
  const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
  const vx = P.vp[0];
  let courses = "";
  for (let i = 1; i < 5; i++) {
    const s = i / 5;
    const a = P.p(mix(x0, x0 + hip, s), mix(yE, yR, s), mix(z0, zr, s));
    const b = P.p(mix(x1, x1 - hip, s), mix(yE, yR, s), mix(z0, zr, s));
    courses += `M${Pt(a)}L${Pt(b)}`;
  }
  const fz = A.fog(Zm);
  return (
    <g>
      {yR < P.horizonY ? null : <path d={poly(back)} fill={t(mat.mid)} stroke={ln} strokeWidth={w} />}
      {x0 > vx ? <path d={poly(left)} fill={t(mix2(mat.lit, mat.mid, 0.4))} stroke={ln} strokeWidth={w} strokeLinejoin="round" /> : null}
      {x1 < vx ? <path d={poly(right)} fill={t(mat.dark)} stroke={ln} strokeWidth={w} strokeLinejoin="round" /> : null}
      <path d={poly(front)} fill={t(mix2(mat.lit, mat.mid, 0.25))} stroke={ln} strokeWidth={w} strokeLinejoin="round" />
      <path d={courses} stroke={t(mat.dark)} strokeWidth={w * 0.8} strokeOpacity={0.45} fill="none" />
      <path d={`M${Pt(front[3])}L${Pt(front[2])}`} stroke={PAL.cream} strokeOpacity={0.5 * (1 - fz)} strokeWidth={w * 1.2} />
      <g key={uid} />
    </g>
  );
};
const mix2 = (a: string, b: string, t: number) => mixHex(a, b, t);
/** a wall box with a few dark openings (doors, small windows) on its front */
const Building: React.FC<{ A: AirWorld; X0: number; X1: number; Z0: number; Z1: number; h: number; roof: number; base?: number; uid: string; mat?: Mat; doors?: number[]; temple?: boolean }> = ({ A, X0, X1, Z0, Z1, h, roof, base = 0, uid, mat = FARM_MAT.plaster, doors = [], temple }) => {
  const P = A.P;
  const Zm = Z0;
  const t = (c: string) => A.tone(c, Zm, h / 2);
  const ops = doors.map((u, i) => {
    const dw = Math.min(140, (X1 - X0) * 0.12);
    const x = mix(X0, X1, u);
    const isDoor = i === 0;
    const y0 = -base - (isDoor ? h * 0.48 : h * 0.78);
    const y1 = -base - (isDoor ? 0 : h * 0.62);
    const q = [P.p(x - dw / 2, y0, Z0 - 1), P.p(x + dw / 2, y0, Z0 - 1), P.p(x + dw / 2, y1, Z0 - 1), P.p(x - dw / 2, y1, Z0 - 1)];
    return <path key={i} d={`M${q.map(Pt).join("L")}Z`} fill={t("#3B3029")} opacity={0.85} />;
  });
  return (
    <g>
      <AirBox A={A} X0={X0} X1={X1} Y0={-base - h} Y1={-base} Z0={Z0} Z1={Z1} mat={mat} uid={`${uid}b`} />
      {ops}
      <Roof A={A} X0={X0} X1={X1} Z0={Z0} Z1={Z1} Y={-h} base={-base} rise={roof} uid={`${uid}r`} mat={temple ? FARM_MAT.tile : FARM_MAT.tile} />
    </g>
  );
};

// ===================================================================================================================
// THE GROUND
// ===================================================================================================================
const quad = (A: AirWorld, x0: number, x1: number, z0: number, z1: number) => {
  const P = A.P;
  const zz0 = Math.max(z0, P.zNear + 20);
  if (z1 <= zz0) return "";
  const q = [P.p(x0, 0, zz0), P.p(x1, 0, zz0), P.p(x1, 0, z1), P.p(x0, 0, z1)];
  return `M${q.map(Pt).join("L")}Z`;
};
const FIELD_FILL: Record<Field["kind"], keyof typeof FARM_MAT> = { reap: "wheatGround", wheat: "wheatGround", stubble: "stubble", plough: "fallow", olive: "grove", fallow: "fallow" };

export const FarmGround: React.FC<{ A: AirWorld; frame: number; uid: string }> = ({ A, frame, uid }) => {
  const P = A.P;
  const zA = Math.max(P.zNear + 20, -6000);
  // the near end of the gradients: never behind the camera
  const z0 = Math.max(60, zA + 6000);
  const zg = (Z: number) => Z + 6000;
  const zB = 120000;
  // gradients are keyed on Z + 6000 (positive for the geometric spacing)
  const grads = ["verge", "stubble", "wheatGround", "soil", "fallow", "grove", "track"].map((k) => {
    const P2 = A.P;
    const ya = P2.p(0, 0, zA)[1];
    const yb = P2.p(0, 0, zB)[1];
    const N = 22;
    const stops: React.ReactNode[] = [];
    for (let i = 0; i <= N; i++) {
      const g = z0 * Math.pow(zg(zB) / z0, i / N);
      const Z = g - 6000;
      const y = P2.p(0, 0, Z)[1];
      const near = c01(1 - (Z - zA) / 2500);
      const local = mixHex(FARM_MAT[k as keyof typeof FARM_MAT] as string, "#3A3128", 0.1 * near);
      stops.push(<stop key={i} offset={c01((y - ya) / (yb - ya)).toFixed(4)} stopColor={A.tone(local, Math.max(0, Z), 0)} />);
    }
    return (
      <linearGradient key={k} id={`${uid}g${k}`} gradientUnits="userSpaceOnUse" x1="0" y1={n2(ya)} x2="0" y2={n2(yb)}>
        {stops}
      </linearGradient>
    );
  });
  const g = (k: string) => `url(#${uid}g${k})`;
  // the valley floor: verge everywhere, wide
  const floor = quad(A, -60000, 60000, zA, zB);
  // fields by material
  const byMat: Record<string, string> = {};
  for (const f of FIELDS) {
    const m = FIELD_FILL[f.kind];
    if (f.kind === "reap" && f.reap) {
      // the whole field as stubble, the standing wheat (between the teams' lines) on top
      const P2 = A.P;
      const zz0 = Math.max(f.z0, P2.zNear + 20);
      if (f.z1 <= zz0) continue;
      byMat.stubble = (byMat.stubble ?? "") + quad(A, f.x0, f.x1, f.z0, f.z1);
      const a = standingSpan(f, zz0);
      const b = standingSpan(f, f.z1);
      if (a && b) byMat.wheatGround = (byMat.wheatGround ?? "") + `M${[P2.p(a[0], 0, zz0), P2.p(a[1], 0, zz0), P2.p(b[1], 0, f.z1), P2.p(b[0], 0, f.z1)].map(Pt).join("L")}Z`;
      continue;
    }
    byMat[m] = (byMat[m] ?? "") + quad(A, f.x0, f.x1, f.z0, f.z1);
  }
  // tracks: the cross track, the cross lane and the depth lane
  const tracks = quad(A, -60000, 60000, CROSS_TRACK.z0, CROSS_TRACK.z1) + quad(A, -60000, 60000, CROSS_LANE.z0, CROSS_LANE.z1) + quad(A, LANE.x0, LANE.x1, LANE.z0, LANE.z1);
  // the cross track's edges: no hard seam, a soft fringe (a vertical gradient: Z maps to the 2D world row) from the
  // field's own colour on one side to the track's on the other
  const edge = (zf: number, zt: number, fieldHex: string, key: string) => {
    const za = Math.max(Math.min(zf, zt), P.zNear + 20);
    const zb = Math.max(zf, zt);
    if (zb <= za) return null;
    const yf = P.p(0, 0, zf)[1];
    const yt = P.p(0, 0, zt)[1];
    const cf = A.tone(fieldHex, Math.max(0, zf), 0);
    const ct = A.tone(FARM_MAT.track, Math.max(0, zt), 0);
    return (
      <g key={key}>
        <defs>
          <linearGradient id={`${uid}e${key}`} gradientUnits="userSpaceOnUse" x1="0" y1={n2(yf)} x2="0" y2={n2(yt)}>
            <stop offset="0" stopColor={cf} />
            <stop offset="0.55" stopColor={mixHex(cf, ct, 0.45)} />
            <stop offset="1" stopColor={ct} />
          </linearGradient>
        </defs>
        <path d={quad(A, -60000, 60000, za, zb)} fill={`url(#${uid}e${key})`} />
      </g>
    );
  };
  const trackEdges = [edge(-1450, CROSS_TRACK.z0 + 60, FARM_MAT.wheatGround, "n"), edge(-780, CROSS_TRACK.z1 - 60, FARM_MAT.stubble, "f")];
  // furrows in the plough field: the done strips and the furrow being cut up to the share
  const pf = FIELDS.find((f) => f.kind === "plough") as Field;
  let furrows = "";
  for (let Z = PLOUGH.doneZ0 + 30; Z < PLOUGH.doneZ1; Z += PLOUGH.furrow) furrows += `M${Pt(P.p(pf.x0 + 30, 0, Z))}L${Pt(P.p(pf.x1 - 30, 0, Z))}`;
  const sx = shareX(frame);
  const curZ = OX_TEAM.Z + OX_TEAM.farDZ / 2 - 20;
  const curX0 = Math.min(pf.x1 - 30, Math.max(pf.x0 + 30, sx));
  const turned = quad(A, curX0, pf.x1 - 30, PLOUGH.doneZ0, PLOUGH.doneZ1) + quad(A, curX0, pf.x1 - 30, curZ - 60, curZ + 30) + quad(A, pf.x0 + 30, pf.x1 - 30, PLOUGH.doneZ0, Math.min(PLOUGH.doneZ1, curZ - 70));
  furrows += `M${Pt(P.p(curX0, 0, curZ))}L${Pt(P.p(pf.x1 - 30, 0, curZ))}`;
  // the lit ridges between the furrows (running in the plough's direction): the turned earth reads as ground
  let ridges = "";
  for (let Z = PLOUGH.doneZ0 + 30 + PLOUGH.furrow / 2; Z < PLOUGH.doneZ1; Z += PLOUGH.furrow) ridges += `M${Pt(P.p(pf.x0 + 30, 0, Z))}L${Pt(P.p(pf.x1 - 30, 0, Z))}`;
  ridges += `M${Pt(P.p(curX0, 0, curZ - 35))}L${Pt(P.p(pf.x1 - 30, 0, curZ - 35))}`;
  // the stubble's short stalks (near rows only: rows N and A) as ticks in drill rows along X
  let ticks = "";
  const stubbleZ = 1800;
  for (const f of FIELDS) {
    if (f.z0 > stubbleZ) continue;
    if (f.kind !== "reap" && f.kind !== "stubble") continue;
    for (let Z = f.z0 + 20; Z < f.z1; Z += 36) {
      if (Z < P.zNear + 60) continue;
      const r = P.r(Z);
      const sy = scr(A, P.p(0, 0, Z))[1];
      if (sy < -10 || sy > 1940) continue;
      const step = 26;
      for (let X = f.x0 + 10 + ((Z * 0.37) % step); X < f.x1 - 10; X += step) {
        if (f.kind === "reap" && (standingAt(f, X - 20, Z) || standingAt(f, X + 20, Z))) continue;
        const b = P.p(X, 0, Z);
        const s0 = scr(A, b)[0];
        if (s0 < -10 || s0 > 1090) continue;
        const hgt = 14 + ((X * 7 + Z * 3) % 9);
        ticks += `M${n1(b[0])},${n1(b[1])}l${n1(1.5 * r)},${n1(-hgt * r)}`;
      }
    }
  }
  const tickW = 1.6;
  // dry grass tufts on the verges (the cross track's edges, the near field edges): short splayed strokes
  const grassEls: React.ReactNode[] = [];
  const verges: [number, number, number, number?][] = [
    [CROSS_TRACK.z0 - 60, -6000, 6000],
    [CROSS_TRACK.z1 + 50, -6000, 6000],
    // the track's own grass: a crown down its middle and scattered clumps (a farm track, not a flat slab)
    [(CROSS_TRACK.z0 + CROSS_TRACK.z1) / 2, -6000, 6000, 620],
    [CROSS_TRACK.z0 + 110, -6000, 6000, 140],
    [CROSS_TRACK.z1 - 110, -6000, 6000, 140],
    [-1450 + 30, -6000, 6000],
    [-780 - 30, -6000, 6000],
    [1850, -6000, 6000],
  ];
  let pebbles = "";
  for (const [Zv, xa, xb, cnt] of verges) {
    if (Zv < P.zNear + 200) continue;
    let grass = "";
    const N = cnt ?? 260;
    for (let i = 0; i < N; i++) {
      const Z = Zv + ((i * 53) % 90) - 45;
      if (Z < P.zNear + 60) continue;
      const X = xa + (((i * 4673) % 1000) / 1000) * (xb - xa) + (((i * 811) % 97) - 48) * 4;
      const b = P.p(X, 0, Z);
      const sp = scr(A, b);
      if (sp[0] < -30 || sp[0] > 1110 || sp[1] < -10 || sp[1] > 1960) continue;
      const r = P.r(Z);
      const hh = (22 + (i % 5) * 5) * r;
      grass += `M${n1(b[0] - 6 * r)},${n1(b[1])}l${n1(-5 * r)},${n1(-hh * 0.8)}M${n1(b[0])},${n1(b[1])}l${n1(1 * r)},${n1(-hh)}M${n1(b[0] + 6 * r)},${n1(b[1])}l${n1(6 * r)},${n1(-hh * 0.75)}`;
      if (cnt && i % 3 === 0) {
        const q = P.p(X + 60, 0, Z + 35);
        const rr = P.r(Z + 35);
        pebbles += `M${n1(q[0] - 7 * rr)},${n1(q[1])}a${n1(7 * rr)},${n1(3 * rr)} 0 1 0 ${n1(14 * rr)},0a${n1(7 * rr)},${n1(3 * rr)} 0 1 0 ${n1(-14 * rr)},0Z`;
      }
    }
    if (grass) grassEls.push(<path key={Zv} d={grass} stroke={A.tone("#77714F", Math.max(0, Zv), 20)} strokeWidth={n2(2.4 * P.r(Zv))} strokeOpacity={0.8} fill="none" strokeLinecap="round" />);
  }
  return (
    <g>
      <defs>{grads}</defs>
      <path d={floor} fill={g("verge")} />
      {Object.entries(byMat)
        .sort(([a], [b]) => (a === "wheatGround" ? 1 : 0) - (b === "wheatGround" ? 1 : 0))
        .map(([m, d]) => (
          <path key={m} d={d} fill={g(m)} />
        ))}
      <path d={turned} fill={g("soil")} />
      <path d={tracks} fill={g("track")} />
      {trackEdges}
      <path d={furrows} stroke={A.tone(FARM_MAT.soilDark, 2800, 0)} strokeWidth={n2(9 * P.r(2800))} strokeOpacity={0.35} fill="none" strokeLinecap="round" />
      <path d={ridges} stroke={A.tone(FARM_MAT.soilRidge, 2800, 0)} strokeWidth={n2(12 * P.r(2800))} strokeOpacity={0.75} fill="none" strokeLinecap="round" />
      {pebbles ? <path d={pebbles} fill={A.tone(FARM_MAT.wallStone.mid, 0, 0)} opacity={0.55} /> : null}
      {grassEls}
      {ticks ? <path d={ticks} stroke={A.tone(FARM_MAT.strawDark, 0, 10)} strokeWidth={n2(tickW * P.r(0) * 1.1)} strokeOpacity={0.75} fill="none" /> : null}
    </g>
  );
};

/** the far hills and the haze at the horizon (drawn first) */
const Hills: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const P = A.P;
  return (
    <g>
      {HILLS.map((hl, i) => {
        const pts = hl.peaks;
        // a smooth ridge through the peaks (catmull-like), closed down to the ground row at that depth
        const ridge: P2[] = [];
        for (let j = 0; j < pts.length - 1; j++) {
          const [xa, ha] = pts[j];
          const [xb, hb] = pts[j + 1];
          for (let s = 0; s < 8; s++) {
            const t = s / 8;
            const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
            ridge.push(P.p(mix(xa, xb, t), -mix(ha, hb, e), hl.Z));
          }
        }
        const last = pts[pts.length - 1];
        ridge.push(P.p(last[0], -last[1], hl.Z));
        const base0 = P.p(pts[0][0], 200, hl.Z);
        const base1 = P.p(last[0], 200, hl.Z);
        const d = `M${Pt(base0)}L${ridge.map(Pt).join("L")}L${Pt(base1)}Z`;
        const top = P.p(0, -6000, hl.Z)[1];
        const bot = P.p(0, 0, hl.Z)[1];
        return (
          <g key={i}>
            <defs>
              <linearGradient id={`${uid}h${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={n2(top)} x2="0" y2={n2(bot)}>
                <stop offset="0" stopColor={A.tone(mixHex(FARM_MAT.hill, "#9AA790", 0.3), hl.Z, 4000)} />
                <stop offset="1" stopColor={A.tone(FARM_MAT.hill, hl.Z, 0)} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${uid}h${i})`} />
          </g>
        );
      })}
    </g>
  );
};

/** the town on its rise: the hill under it, the wall with towers and a gate, the houses and a temple behind */
/** an AirWorld whose fog acts as if things stood nearer (the far town must stay findable in the haze) */
export const nearerAir = (A: AirWorld, f: number): AirWorld => ({
  ...A,
  fog: (Z) => A.fog(Z * f),
  airHex: (Z, h) => A.airHex(Z * f, h),
  tone: (hex, Z, h) => A.tone(hex, Z * f, h),
  toneO: (hex, Z, h) => A.toneO(hex, Z * f, h),
  figFog: (Z) => A.figFog(Z * f),
  folkFog: (Z, fh) => A.folkFog(Z * f, fh),
});
const Town: React.FC<{ A: AirWorld; uid: string }> = ({ A: A0, uid }) => {
  const A = nearerAir(A0, 0.55);
  const P = A.P;
  const T = TOWN;
  const els: React.ReactNode[] = [];
  // the rise: a gentle mound under the town
  const prof: P2[] = [];
  for (let i = 0; i <= 16; i++) {
    const Z = mix(T.z0 - 2500, T.z1 + 3000, i / 16);
    prof.push([Z, townRise(Z)]);
  }
  const rx0 = T.x0 - 3000;
  const rx1 = T.x1 + 3000;
  const mound = `M${Pt(P.p(rx0, 0, T.z0 - 2500))}L${prof.map(([Z, h]) => Pt(P.p(mix(rx0, T.x0 - 600, c01(h / T.rise)), -h, Z))).join("L")}L${[...prof].reverse().map(([Z, h]) => Pt(P.p(mix(rx1, T.x1 + 600, c01(h / T.rise)), -h, Z))).join("L")}Z`;
  els.push(<path key="mound" d={mound} fill={A.tone(mixHex(FARM_MAT.fallow, FARM_MAT.verge, 0.5), T.z0 + 1500, 120)} />);
  // houses behind the wall (far first)
  const houses = [...T.houses].sort((a, b) => b[2] - a[2]);
  houses.forEach(([x0, x1, z0, z1, h, roof, kind], i) => {
    const base = townRise(z0);
    els.push(<Building key={`h${i}`} A={A} X0={x0} X1={x1} Z0={z0} Z1={z1} h={h} roof={roof} base={base} uid={`${uid}h${i}`} mat={kind === 1 ? MAT.marble : FARM_MAT.plaster} doors={kind === 1 ? [] : [0.3, 0.7]} temple={kind === 1} />);
  });
  // the wall: front segments either side of the gate, side walls, corner towers
  const wb = townRise(T.z0);
  const wallMat = FARM_MAT.wallStone;
  const gw = 300;
  els.push(<AirBox key="wl" A={A} X0={T.x0} X1={T.gateX - gw / 2} Y0={-wb - T.wallH} Y1={-wb} Z0={T.z0} Z1={T.z0 + 160} mat={wallMat} uid={`${uid}wl`} />);
  els.push(<AirBox key="wr" A={A} X0={T.gateX + gw / 2} X1={T.x1} Y0={-wb - T.wallH} Y1={-wb} Z0={T.z0} Z1={T.z0 + 160} mat={wallMat} uid={`${uid}wr`} />);
  // the gate: an arch over the opening, two gate towers
  els.push(<AirBox key="gt" A={A} X0={T.gateX - gw / 2 - 20} X1={T.gateX + gw / 2 + 20} Y0={-wb - T.wallH - 60} Y1={-wb - T.wallH * 0.62} Z0={T.z0 - 10} Z1={T.z0 + 170} mat={wallMat} uid={`${uid}gt`} />);
  const gq = [P.p(T.gateX - gw / 2, -wb - T.wallH * 0.62, T.z0 - 12), P.p(T.gateX + gw / 2, -wb - T.wallH * 0.62, T.z0 - 12), P.p(T.gateX + gw / 2, -wb, T.z0 - 12), P.p(T.gateX - gw / 2, -wb, T.z0 - 12)];
  els.push(<path key="go" d={`M${gq.map(Pt).join("L")}Z`} fill={A.tone("#3B3029", T.z0, 200)} opacity={0.8} />);
  for (const [xa, xb] of [
    [T.gateX - gw / 2 - 260, T.gateX - gw / 2 - 20],
    [T.gateX + gw / 2 + 20, T.gateX + gw / 2 + 260],
    [T.x0 - 60, T.x0 + 220],
    [T.x1 - 220, T.x1 + 60],
  ] as [number, number][])
    els.push(<AirBox key={`tw${xa}`} A={A} X0={xa} X1={xb} Y0={-wb - T.wallH - 190} Y1={-wb} Z0={T.z0 - 40} Z1={T.z0 + 220} mat={wallMat} uid={`${uid}tw${xa}`} />);
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE WORLD IN PAINTER'S ORDER
// ===================================================================================================================
export type FarmItem = { z: number; el: React.ReactNode };
/** the wheat of every field as depth slices: rows N and A in thin slices (the figures stand in them), the far rows
 *  coarser */
const SLICE: Record<string, number> = { N: 24, A: 24, B: 60, C: 110, D: 160, E: 240, G: 400 };
const WEIGHT: Record<string, number> = { N: 1, A: 1, B: 1.15, C: 1.4, D: 1.8, E: 2.3, G: 3.1 };
type Slice = { field: string; row: string; z: number; tufts: Tuft[] };
const SLICES: Slice[] = (() => {
  const out: Slice[] = [];
  for (const f of FIELDS) {
    const ts = TUFTS[f.id];
    if (!ts.length) continue;
    const w = SLICE[f.row];
    const bins = new Map<number, Tuft[]>();
    for (const t of ts) {
      const b = Math.floor((t.Z - f.z0) / w);
      const arr = bins.get(b) ?? [];
      arr.push(t);
      bins.set(b, arr);
    }
    for (const [b, arr] of bins) out.push({ field: f.id, row: f.row, z: f.z0 + (b + 0.5) * w, tufts: arr });
  }
  return out;
})();
/** the walls cut into depth segments (a wall running into depth) so figures beside them sort right */
const WALL_SEGS: { w: (typeof WALLS)[number]; z0: number; z1: number }[] = WALLS.flatMap((w) => {
  if (w.z1 - w.z0 < 400) return [{ w, z0: w.z0, z1: w.z1 }];
  const n = Math.ceil((w.z1 - w.z0) / 300);
  return Array.from({ length: n }, (_, i) => ({ w, z0: w.z0 + ((w.z1 - w.z0) * i) / n, z1: w.z0 + ((w.z1 - w.z0) * (i + 1)) / n }));
});
/** the stooks at the field edges: every reaper's day so far, a couple of sheaves (row by row) */
const STOOKS = FIELDS.filter((f) => f.kind === "reap" || f.kind === "stubble").flatMap((f) => {
  // on the stubble at mid depth (never at a field's near edge, where cut 13's crane passes low over them)
  const n = f.kind === "stubble" ? 5 : 3;
  const out: { X: number; Z: number; n: number; id: string }[] = [];
  const d = f.z1 - f.z0;
  for (let j = 0; j < 24 && out.length < n; j++) {
    const Z = f.z0 + d * (0.35 + 0.4 * (((j * 7) % 5) / 4));
    const X = mix(f.x0 + 160, f.x1 - 160, (((j * 5) % 12) + 0.5) / 12);
    if (f.kind === "reap" && (standingAt(f, X - 170, Z) || standingAt(f, X + 170, Z))) continue;
    if (out.some((o) => Math.abs(o.X - X) < 300 && Math.abs(o.Z - Z) < 300)) continue;
    out.push({ X, Z, n: 2 + ((j + Math.round(f.x0)) % 2 === 0 ? 1 : 0), id: `${f.id}k${j}` });
  }
  return out;
});

export const farmItems = (A: AirWorld, frame: number, hide: Set<string>, uid: string): FarmItem[] => {
  const P = A.P;
  const items: FarmItem[] = [];
  const zMin = P.zNear + 40;
  for (const s of SLICES) {
    if (s.z < zMin || hide.has(`wheat:${s.field}`)) continue;
    items.push({ z: s.z, el: <WheatTufts key={`w${s.field}${s.z}`} A={A} frame={frame} tufts={s.tufts} zMid={s.z} w={WEIGHT[s.row]} /> });
  }
  WALL_SEGS.forEach((sg, i) => {
    if (sg.z1 < zMin) return;
    const z0 = Math.max(sg.z0, zMin);
    items.push({
      z: (z0 + sg.z1) / 2,
      el: <AirBox key={`wl${i}`} A={A} X0={sg.w.x0} X1={sg.w.x1} Y0={-sg.w.h} Y1={0} Z0={z0} Z1={sg.z1} mat={FARM_MAT.wallStone} uid={`${uid}wl${i}`} rim={0.6} />,
    });
  });
  STONES.forEach((s, i) => {
    if (s.Z < zMin) return;
    items.push({ z: s.Z, el: <AirBox key={`st${i}`} A={A} X0={s.X - 22} X1={s.X + 22} Y0={-70} Y1={0} Z0={s.Z - 20} Z1={s.Z + 20} mat={MAT.stone} uid={`${uid}st${i}`} /> });
  });
  TREES.forEach((t, i) => {
    if (t.Z < zMin || !onScreen(A, t.X, t.Z, 260 * t.s, 520 * t.s)) return;
    items.push({ z: t.Z, el: <g key={`t${i}`}><AirShadow A={A} X={t.X + 60} Z={t.Z} w={220 * t.s} d={80 * t.s} uid={`${uid}ts${i}`} amt={0.5} /><OliveTree A={A} t={t} uid={`${uid}t${i}`} /></g> });
  });
  STOOKS.forEach((s) => {
    if (s.Z < zMin || !onScreen(A, s.X, s.Z, 70, 150)) return;
    items.push({ z: s.Z, el: <g key={s.id}><AirShadow A={A} X={s.X + 20} Z={s.Z} w={50} d={24} uid={`${uid}${s.id}s`} amt={0.5} /><Stook A={A} X={s.X} Z={s.Z} n={s.n} uid={`${uid}${s.id}`} /></g> });
  });
  if (!hide.has("villa") && VILLA.z0 > zMin) {
    const V = VILLA;
    items.push({
      z: V.z0,
      el: (
        <g key="villa">
          <Building A={A} X0={V.x0} X1={V.x1} Z0={V.z0} Z1={V.z1} h={V.h} roof={V.ridge} uid={`${uid}vl`} doors={[0.5, 0.2, 0.8]} />
          <Building A={A} X0={V.x1 + 120} X1={V.x1 + 900} Z0={V.z0 + 300} Z1={V.z1 - 100} h={V.h * 0.7} roof={V.ridge * 0.7} uid={`${uid}vb`} doors={[0.5]} />
        </g>
      ),
    });
    items.push({ z: V.yard.z0, el: <AirBox key="yard" A={A} X0={V.yard.x0} X1={V.yard.x1} Y0={-V.yard.h} Y1={0} Z0={V.yard.z0} Z1={V.yard.z0 + 70} mat={FARM_MAT.plaster} uid={`${uid}yd`} /> });
  }
  if (!hide.has("town")) items.push({ z: TOWN.z0 + 2000, el: <Town key="town" A={A} uid={`${uid}tn`} /> });
  for (const f of FARMERS) {
    if (hide.has(f.id) || f.Z < zMin) continue;
    const X = farmerX(f, frame);
    if (!onScreen(A, X, f.Z, 320, 340)) continue;
    items.push({ z: f.Z, el: <FarmerFig key={f.id} A={f.Z > 20000 ? nearerAir(A, 0.55) : A} f={f} frame={frame} /> });
  }
  if (!hide.has("oxTeam") && OX_TEAM.Z > zMin && onScreen(A, oxTeamX(frame) - OX_TEAM.dir * 400, OX_TEAM.Z, 900, 400)) items.push(...oxTeamItems(A, frame));
  if (!hide.has("cart") && CART.Z > zMin && onScreen(A, cartX(frame) + 300, CART.Z, 800, 400)) items.push(...cartItems(A, frame));
  return items;
};

export const FarmWorld: React.FC<{ A: AirWorld; frame: number; items?: FarmItem[]; hide?: string[]; uid?: string }> = ({ A, frame, items = [], hide = [], uid = "fw" }) => {
  const H = new Set(hide);
  const all = [...farmItems(A, frame, H, uid), ...items].sort((a, b) => b.z - a.z);
  void OX_LEN;
  return (
    <g>
      <Hills A={A} uid={`${uid}hl`} />
      <FarmGround A={A} frame={frame} uid={`${uid}gr`} />
      <AirHorizonHazeW A={A} id={`${uid}hz`} below={150} />
      {all.map((it, i) => (
        <React.Fragment key={i}>{it.el}</React.Fragment>
      ))}
    </g>
  );
};
