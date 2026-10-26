// ---------------------------------------------------------------------------
// WheatForGlass (kyle-rome-industrial, cut 45). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 295 frames. RENDER WITH --gl=angle (the map ground is WebGL2).
// One continuous pinhole camera over the shared Mediterranean map world (medMapWorld.tsx; the RodentFromCentralAsia
// pattern): a quay at Alexandria close up, then a climb that opens the map, then a drift north-east to the Levant.
//
// CHECK LINE: "trade let each region make what it was good at — Egypt grows the wheat, Syria makes the glass — and
// ships swap them across the Mediterranean."
//
// THE LINE: "[productivity growth comes from markets,] from trade, where you get, you know, comparative advantage. In
// Egypt, I'm really good at growing wheat. You can make glass in Syria and then we'll trade. [Cities…]"
// WORD -> FRAME (Whisper, heard ~6 frames later): trade 16 · where 31 · you 39 · get 54 · you 64 · know 78 ·
//   comparative 83 · advantage 96 · In 111 · EGYPT 120 · I'm 131 · really 135 · good 139 · at 144 · growing 147 ·
//   WHEAT 151 · You 168 · can 184 · make 189 · GLASS 202 · in 214 · SYRIA 228 · and 259 · then 271 · we'll 274 ·
//   TRADE 277 · (Cities, on camera, 292)
// DURATION: the slot 45.512 -> 55.355 s = 9.843 s x 29.97 = 295 frames (f0..f294).
//
// THE MOTION: f0-90 close on a quay at Alexandria (~900 px figures): an Egyptian farmer (plain linen tunic, a sack of
// wheat hanging from his hand, more sacks behind him) and a Syrian glass merchant (red-brown tunic, a straw crate of glass
// beside him) swap: the merchant holds out a pale green-blue flask, the farmer's far hand takes it (CONTACT f40, the
// flask moves with his hand from f40; the merchant lets go f46); the farmer swings the sack up from his side (his near
// hand on its neck from f0) into the merchant's arms (the merchant's hands touch the sack f70, he carries it from f74,
// the farmer lets go f74). A grain ship lies in the harbour basin behind them. f56-140 the camera climbs in one
// smooth lobe (peak ~9.7%/frame at f93): straight up and back off the pair, out of the street between the quay-front
// houses, until the quay is one stretch of Alexandria's harbour (the basin, two moles, the Pharos at the mouth, the
// houses); the grain ship casts off at f78 and sails out of the basin's mouth (~f118); the city shrinks to a small
// cluster on the delta's western edge (it stays there: cut 56), the delta opens with its wheat fields, EGYPT slides
// up on "Egypt" (in f130, lands f137; the camera swings east over the delta so the whole word stays in frame). f140-268 one move, no stop: climbing on toward top-down and drifting north-east
// until the Levant is in frame: the glass workshop at Sidon (furnace mouth glowing, glass jars and crates by the door);
// SYRIA slides up on "Syria" (lands f237). Two corbitas sail between them at constant speed, the grain ship north-east
// (sacks on deck), a glass ship south-west (straw crates), passing ~130 world px apart at ~f255 ("and then we'll
// trade") and sailing on apart; faint wakes. Ships grow as map symbols with the climb (shipGrow: 1x in the harbour,
// 2.4x at the end). f268-294 settled: ships sailing, the sea's shimmer, the furnace's smoke, motes, a slow creep. The
// map's empty foot sinks into the dense low air (LowAir).
// Orange = technology only: the glass furnace's mouth at Sidon (glassblowing, the coast's new technology). Everything
// else in muted local colours; people, wheat, glass and the sails never orange.
//
// DEPTH: medMapWorld's pinhole (F 1300) aimed at a target T from a distance D (2.7 -> 870 world px), pitch 15 -> 77
// deg, yaw from straight out to sea (-35 deg) to 9 deg east of map-up (18 deg off the local meridian). Fog: the
// ground's distance haze (hazeOf). Symbolic scales: Alexandria and its people at M_WPX (1.2 world px per metre: a man
// 1.75 m = 2.1 world px), ships at SHIP_WPX x shipGrow, the workshop at WORKSHOP_M (6.6 world px per metre).
//
// SOURCES: the map: Natural Earth 10m through scripts/maps/configs/kyle-rome-industrial.mjs (LCC 33/43 N, centre
//   18 E; Alexandria's Great Harbour 29.90 E 31.20 N; Sidon 35.37 E 33.56 N); the Nile and the delta's fan: hand-placed
//   waypoints at town coordinates (approximate; the modern Rosetta and Damietta branches stand for the ancient
//   seven). Egypt as Rome's granary (the Alexandrian grain fleet); glassblowing invented on the Syro-Palestinian coast
//   in the 1st c. BC, Sidon its famous centre (Pliny, Natural History 36.190-193). The ship: a Roman merchant ship
//   (corbita: rounded hull, swan-neck sternpost, one square sail on a yard, the artemon) after the Ostia mosaics. The
//   Pharos of Alexandria: three stages (square, octagonal, round), after the Alexandrian coins; city and harbour are
//   schematic (two moles closing a basin, the Pharos at its mouth), not a plan of the real Great Harbour.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirHorizonHaze, AirStage, RomeFolk, mixHex } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  CRATE_MAT,
  GLASS,
  GroundLabel,
  H,
  M_WPX,
  MedGround,
  PLACES,
  HARBOUR,
  QUAY,
  Qp,
  SHIP_WPX,
  alexandriaItems,
  W,
  boxFaces,
  corbitaItems,
  distTo,
  faceItems,
  groundShadowItem,
  makeTrack,
  medAir,
  paint,
  pathAt,
  project,
  quayPt,
  shipWaterItem,
  smoothPath,
  toScreen,
  wakeItem,
  workshopItems,
  type Cam,
  type CamKey3,
  type Item,
  type MedAir,
  type P2,
  type V3,
} from "./medMapWorld";

export const FPS = 30000 / 1001;
export const DURATION = 295;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const M = M_WPX;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const f2 = (v: number) => v.toFixed(2);

// ===================================================================================================================
// THE QUAY SET (metres in the quay frame: u along the quay, screen right at f0; v out to sea; the edge at v = 0)
// ===================================================================================================================
/** world px per rig unit (a man 312 units = 1.75 m) */
const U2W = (1.75 * M) / 312;
const V_FIG = -1.6;
const FARMER_U = -0.5;
const MERCH_U = 0.5;
/** a point on the quay (metres) at height h (metres) -> 3D world */
const Q3 = (u: number, v: number, h = 0): V3 => {
  const p = quayPt(u * M, v * M);
  return [p[0], h * M, p[1]];
};

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
const T0 = Q3(0, V_FIG, 0.9);
const SEA = QUAY.seaYaw;
const K = (f: number, t: V3 | P2, D: number, pitch: number, yaw: number, ty?: number): CamKey3 =>
  t.length === 3 ? { f, tx: t[0], ty: ty ?? t[1], tz: t[2], D, pitch, yaw } : { f, tx: t[0], ty: ty ?? 0, tz: t[1], D, pitch, yaw };
export const CAM_KEYS: CamKey3[] = [
  K(0, T0, 2.69, 15, SEA),
  K(56, T0, 3.05, 16, SEA),
  // the climb, one lobe: straight up and back off the pair first (the swap is done at f74), then the quay becomes one
  // stretch of Alexandria's harbour (the basin, the moles, the Pharos, the houses), the grain ship sails out of the
  // basin, the city shrinks onto the delta's western edge, the delta opens
  K(82, Q3(0, V_FIG, 0.6), 9, 21, SEA),
  K(100, Qp(0, 1), 45, 36, SEA + 6),
  K(118, [50, -5], 180, 44, -16),
  K(136, [200, 20], 400, 58, -6),
  // one move, no stop: climbing on, north-east along the coast until the Levant is in frame
  K(190, [222, -24], 620, 71, 3),
  K(240, [230, -18], 830, 75, 7.5),
  K(268, [237, -13], 858, 76.5, 8.8),
  K(294, [238, -14], 870, 77, 9),
];
const TRACK = makeTrack(CAM_KEYS, DURATION);
export const camAt = TRACK.camAt;
export const CAM_PATH = TRACK.path;
const REST = camAt(0);
/** the quay set's weight (its people, sacks and crate): 1 close, fogging into the air once they are specks */
export const quayW = (D: number) => 1 - sstep(Math.log(150), Math.log(500), Math.log(D));
/** the low air over the frame's foot: 0 on the quay, 1 once the map is open */
const lowAirW = (D: number) => sstep(Math.log(100), Math.log(450), Math.log(D));
/** the ships' map-symbol scale: their real scale in the harbour, 2.4x by the eastern-Med view */
export const shipGrow = (D: number) => 1 + 1.4 * sstep(Math.log(160), Math.log(800), Math.log(D));

// ===================================================================================================================
// THE SHIPS: the grain ship (cast off f96, north-east to Sidon) and the glass ship (from Sidon, south-west)
// ===================================================================================================================
const moorAt = quayPt(HARBOUR.moor[0] * M, HARBOUR.moor[1] * M);
const mouthAt = quayPt(HARBOUR.mouth[0] * M, HARBOUR.mouth[1] * M);
const outAt = quayPt((HARBOUR.mouth[0] + 30) * M, (HARBOUR.mouth[1] + 22) * M);
const LL = (lon: number, lat: number) => project(lon, lat);
export const WHEAT_PATH = smoothPath([moorAt, mouthAt, outAt, LL(30.9, 32.4), LL(32.2, 33.1), LL(33.4, 33.4), LL(34.5, 33.6), PLACES.sidon], 30);
const offsetLL = (lon: number, lat: number): P2 => LL(lon, lat);
export const GLASS_PATH = smoothPath([LL(35.33, 33.5), LL(34.85, 32.7), LL(33.7, 31.85), LL(32.4, 31.72), LL(31.3, 32.0), offsetLL(30.3, 31.75)], 30);
/** constant sailing speed, world px per frame */
const V_SHIP = 1.75;
const DEPART = 78;
const ACCEL = 30;
/** a ship's arclength: at rest until it casts off, a gentle start (the sail fills), then constant speed */
const sailS = (f: number, depart: number, v: number) => {
  if (f <= depart) return 0;
  const t = f - depart;
  if (t < ACCEL) return (v * t * t) / (2 * ACCEL);
  return v * (ACCEL / 2 + (t - ACCEL));
};
/** the grain ship casts off at f78 (clears the basin's mouth ~f118) */
const wheatS = (f: number) => sailS(f, DEPART, V_SHIP);
/** the glass ship is under way from Sidon before f0 (off frame until ~f170), at constant speed (a little slower,
 *  deep with glass); the two pass each other ~130 world px apart at ~f256 and sail on apart */
const GLASS_S0 = 68;
const glassS = (f: number) => GLASS_S0 + V_SHIP * 0.75 * f;

// ===================================================================================================================
// THE SHIPS AND THE WORKSHOP AS ITEMS (exported: cut 56 continues them with frame = 295 + its own frame)
// ===================================================================================================================
/** the two ships' poses and arclengths at a cut-45 frame (frames past DURATION continue at constant speed) */
export const shipPoses = (frame: number, D: number) => {
  const scale = SHIP_WPX * shipGrow(D);
  const bob = (ph: number) => ({ roll: 0.025 * Math.sin(frame * 0.07 + ph), pitch: 0.012 * Math.sin(frame * 0.05 + ph * 1.7), heave: 0.08 * Math.sin(frame * 0.06 + ph) });
  const wS = wheatS(frame);
  const wp = pathAt(WHEAT_PATH, wS);
  // the yard braced round as she gets under way (so the sail shows its face to the climbing camera)
  const brace = interpolate(frame, [DEPART, DEPART + 54], [-0.45, -0.6], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const wheat = { at: wp.at, heading: wp.heading, scale, cargo: "wheat" as const, deep: 0.35, sail: 0.6 + 0.4 * c01((frame - DEPART) / 40), brace, ...bob(0) };
  const gS = glassS(frame);
  const gp = pathAt(GLASS_PATH, gS);
  const glass = { at: gp.at, heading: gp.heading, scale, cargo: "glass" as const, deep: 0.2, sail: 1, brace: -0.5, ...bob(2.1) };
  return { wheat, glass, wS, gS };
};
/** the glass workshop at Sidon, facing the sea (west-south-west) */
export const WORKSHOP = { at: [PLACES.sidon[0] + 15, PLACES.sidon[1] - 4] as P2, facing: (-100 * Math.PI) / 180 };
/** both ships (their water shadows, wakes, hulls) and the workshop as painter items at a cut-45 frame */
export const tradeItems = (cam: Cam, air: MedAir, frame: number): (Item | null)[] => {
  const sp = shipPoses(frame, cam.D);
  return [
    shipWaterItem(cam, air, sp.wheat, "wsw"),
    wakeItem(cam, air, WHEAT_PATH, sp.wS, 150, "wwk", c01((frame - DEPART - 20) / 40), 18 * sp.wheat.scale),
    ...corbitaItems(cam, air, sp.wheat, "wship"),
    shipWaterItem(cam, air, sp.glass, "gsw"),
    wakeItem(cam, air, GLASS_PATH, sp.gS, 150, "gwk", 1, 18 * sp.glass.scale),
    ...alexandriaItems(cam, air, frame),
    ...corbitaItems(cam, air, sp.glass, "gship"),
    ...workshopItems(cam, air, WORKSHOP.at, WORKSHOP.facing, frame, "wkshop"),
  ];
};
/** the last frame's camera (cut 56 opens on it) */
export const END_CAM_KEY: CamKey3 = (() => {
  const c = camAt(DURATION - 1);
  return { f: 0, tx: c.T[0], ty: c.T[1], tz: c.T[2], D: c.D, pitch: c.pitch, yaw: c.yaw };
})();

// ===================================================================================================================
// THE SWAP (metres on the figures' plane v = V_FIG: u across, h height)
// ===================================================================================================================
type Key = [number, number];
const kf = (keys: Key[], f: number, ease = Easing.inOut(Easing.cubic)) =>
  interpolate(
    f,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    { ...clamp, easing: ease },
  );
/** the flask: in the merchant's near hand, held out; the farmer's far hand takes it (f40), then lifts it to eye level
 *  (above the sack's swing) to look at it */
const flaskAt = (f: number) => ({
  u: kf([[0, 0.33], [4, 0.33], [40, 0.03], [46, 0.02], [66, -0.07], [100, -0.05], [130, -0.05]], f),
  h: kf([[0, 1.18], [4, 1.2], [40, 1.06], [46, 1.08], [66, 1.34], [100, 1.38], [130, 1.39]], f),
  tilt: kf([[0, 0], [40, -6], [66, -12], [100, -6], [130, -8]], f),
});
/** the sack: hanging by its neck from the farmer's near hand at his side, swung up and across into the merchant's
 *  arms (his hands on it f70; he carries it from f74), then hugged to his chest */
const sackAt = (f: number) => ({
  u: kf([[0, -0.7], [40, -0.7], [70, -0.02], [74, 0.03], [100, 0.3], [130, 0.31]], f),
  h: kf([[0, 0.86], [40, 0.86], [58, 0.98], [70, 1.0], [74, 1.0], [100, 1.0], [130, 1.0]], f),
  /** deg about the neck: 0 = upright (hanging from the neck), + = clockwise */
  ang: kf([[0, -6], [40, -6], [70, 8], [100, 0], [130, 0]], f),
});
/** the sack's size multiplier on RomeFolk.Sack (~78 units tall at 1) */
const SACK_K = 1.35;

// ===================================================================================================================
// DRAWING HELPERS
// ===================================================================================================================
const at2 = (s: { x: number; y: number }): P2 => [s.x, s.y];
/** a figure's screen anchor and scale on the quay (feet at (u, v) metres) */
const figAt = (cam: Cam, u: number, v: number) => {
  const p = Q3(u, v, 0);
  const s = toScreen(cam, p[0], p[1], p[2]);
  return { at: at2(s), scale: s.s * U2W, z: s.z, dist: distTo(cam, p[0], p[1], p[2]) };
};
const ptAt = (cam: Cam, u: number, v: number, h: number) => {
  const p = Q3(u, v, h);
  const s = toScreen(cam, p[0], p[1], p[2]);
  return { p: at2(s), s: s.s, z: s.z };
};
/** the glass flask: a round pale green-blue body, a long neck, a lip; one soft crescent shade, a cream glint */
const Flask: React.FC<{ c: P2; px: number; tilt: number; fog: (hex: string) => string }> = ({ c, px, tilt, fog }) => {
  // px = screen px per metre; the flask 0.24 m tall: body r 0.065 m, neck 0.1 m
  const r = 0.068 * px;
  const nw = 0.018 * px;
  const nh = 0.11 * px;
  return (
    <g transform={`translate(${f2(c[0])},${f2(c[1])}) rotate(${f2(tilt)})`}>
      <path d={`M${f2(-nw)},${f2(-r * 0.6)}L${f2(-nw)},${f2(-r - nh)}L${f2(nw)},${f2(-r - nh)}L${f2(nw)},${f2(-r * 0.6)}Z`} fill={fog(GLASS.mid)} />
      <ellipse cx={0} cy={f2(-r - nh)} rx={f2(nw * 1.7)} ry={f2(nw * 0.6)} fill={fog(GLASS.lit)} />
      <circle cx={0} cy={0} r={f2(r)} fill={fog(GLASS.mid)} />
      <path d={`M${f2(r * 0.15)},${f2(-r * 0.98)}A${f2(r)},${f2(r)} 0 0 1 ${f2(r * 0.2)},${f2(r * 0.98)}A${f2(r * 0.75)},${f2(r * 0.9)} 0 0 0 ${f2(r * 0.15)},${f2(-r * 0.98)}Z`} fill={fog(GLASS.dark)} opacity={0.42} />
      <circle cx={f2(-r * 0.12)} cy={f2(r * 0.1)} r={f2(r * 0.62)} fill={fog(GLASS.lit)} opacity={0.35} />
      <ellipse cx={f2(-r * 0.42)} cy={f2(-r * 0.38)} rx={f2(r * 0.16)} ry={f2(r * 0.24)} fill="#F6F2E8" opacity={0.85} transform={`rotate(-30 ${f2(-r * 0.42)} ${f2(-r * 0.38)})`} />
    </g>
  );
};
/** a RomeFolk sack whose neck tip sits at `neck` (screen), rotated `ang` deg about it */
const SackAt: React.FC<{ neck: P2; scale: number; ang: number; uid: string; fog: { rgb: string; amount: number } }> = ({ neck, scale, ang, uid, fog }) => (
  <g transform={`rotate(${f2(ang)} ${f2(neck[0])} ${f2(neck[1])})`}>
    <RomeFolk.Sack at={[neck[0], neck[1] + 76 * scale]} scale={scale} uid={uid} fog={fog} />
  </g>
);
/** the straw crate of glass beside the merchant: a slatted box, straw, the necks of glass vessels */
const crateItems = (cam: Cam, air: MedAir, u: number, v: number, fogAdd: number, uid: string): Item[] => {
  const P = (a: number, b: number, y: number): V3 => Q3(u + b, v + a, y);
  const faces = boxFaces(P, -0.28, 0.28, -0.36, 0.36, 0, 0.5, CRATE_MAT);
  const items = faceItems(cam, air, faces, uid, { lw: 1.2, fogBoost: fogAdd });
  // the straw and the vessels on top (screen shapes at their projected points)
  const top = toScreen(cam, ...P(0, 0, 0.5));
  if (top.z > 0.05) {
    const pxm = top.s * M;
    const dist = distTo(cam, ...P(0, 0, 0.5));
    const fogA = c01(air.fogAmt(dist) + fogAdd);
    const fg = (hex: string) => mixHex(hex, air.airHexAt(dist), fogA);
    const vessels: React.ReactNode[] = [];
    const spots: [number, number, number][] = [
      [-0.2, -0.08, 0.22],
      [-0.05, 0.1, 0.18],
      [0.12, -0.05, 0.25],
      [0.25, 0.08, 0.16],
    ];
    spots.forEach(([b, a, hgt], i) => {
      const base = toScreen(cam, ...P(a, b, 0.5));
      const tip = toScreen(cam, ...P(a, b, 0.5 + hgt * 0.55));
      const r = 0.045 * pxm;
      vessels.push(
        <g key={i}>
          <path d={`M${f2(base.x - r)},${f2(base.y)}Q${f2(base.x - r * 1.1)},${f2(tip.y + r)} ${f2(tip.x - r * 0.35)},${f2(tip.y)}L${f2(tip.x + r * 0.35)},${f2(tip.y)}Q${f2(base.x + r * 1.1)},${f2(tip.y + r)} ${f2(base.x + r)},${f2(base.y)}Z`} fill={fg(i % 2 ? GLASS.mid : GLASS.lit)} />
          <ellipse cx={f2(tip.x)} cy={f2(tip.y)} rx={f2(r * 0.55)} ry={f2(r * 0.22)} fill={fg(GLASS.lit)} />
          <ellipse cx={f2(base.x - r * 0.35)} cy={f2((base.y + tip.y) / 2)} rx={f2(r * 0.12)} ry={f2(r * 0.4)} fill="#F6F2E8" opacity={0.6 * (1 - fogA)} />
        </g>,
      );
    });
    // straw tufts round the necks
    const straw: React.ReactNode[] = [];
    for (let i = 0; i < 9; i++) {
      const b = -0.32 + (0.64 * i) / 8;
      const s1 = toScreen(cam, ...P(-0.22 + 0.44 * ((i * 0.37) % 1), b, 0.5));
      straw.push(<ellipse key={i} cx={f2(s1.x)} cy={f2(s1.y)} rx={f2(0.07 * pxm)} ry={f2(0.025 * pxm)} fill={fg(i % 3 ? "#C9B783" : "#B5A06C")} />);
    }
    items.push({ z: top.z - 0.3 * M, el: <g key={`${uid}-top`}>{straw}{vessels}</g> });
  }
  return items;
};

/** the map's near desert sinks into the dense low air at the frame's foot (the style's height ramp), so the bottom
 *  third is not a flat face; only once the map is open */
export const LowAir: React.FC<{ air: MedAir; amt: number }> = ({ air, amt }) => {
  if (amt <= 0.005) return null;
  const c = air.v.airAtScreen(1900);
  const hex = `rgb(${c.map((v) => Math.round(v)).join(",")})`;
  return (
    <g>
      <defs>
        <linearGradient id="wfg-low" gradientUnits="userSpaceOnUse" x1="0" y1="1100" x2="0" y2="1920">
          <stop offset="0" stopColor={hex} stopOpacity={0} />
          <stop offset="0.55" stopColor={hex} stopOpacity={0.55 * amt} />
          <stop offset="1" stopColor={hex} stopOpacity={amt} />
        </linearGradient>
      </defs>
      <rect x={0} y={1100} width={W} height={820} fill="url(#wfg-low)" />
    </g>
  );
};

// ===================================================================================================================
// THE LABELS
// ===================================================================================================================
export const EGYPT = { at: LL(31.76, 31.2), cap: 29, in: 130, land: 137 };
export const SYRIA = { at: LL(36.05, 34.75), cap: 30, in: 222, land: 237 };

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const FARMER = { variant: 1, apron: false, pilleus: false, inks: { tunic: "#CBBE9E", skin: "#C9976F", belt: "#8A785C", hair: "#3A2C24" } };
const MERCHANT = { variant: 2, apron: false, inks: { tunic: "#8E5E4C", belt: "#55402F" } };

const WheatForGlass: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const air = medAir(cam, frame, REST);
  const qW = quayW(cam.D);
  const setFog = 1 - qW;
  const items: (Item | null)[] = [];

  // ---- the ships and the workshop (shared with cut 56 through tradeItems) ----
  items.push(...tradeItems(cam, air, frame));

  // ---- the quay set: sacks behind the farmer, the crate beside the merchant, the two figures, the goods ----
  if (setFog < 0.995) {
    const figFog = (dist: number) => ({ rgb: air.airHexAt(dist), amount: c01(air.fogAmt(dist) + setFog) });
    // the sack pile (behind the farmer, nearer the edge)
    const pile: [number, number, number][] = [
      [-1.35, -0.55, 1.0],
      [-1.0, -0.4, 1.05],
      [-1.62, -0.25, 0.95],
      [-1.2, -0.05, 1.0],
      [-0.85, -0.85, 1.1],
    ];
    pile.forEach(([u, v, k], i) => {
      const a = figAt(cam, u, v);
      items.push(groundShadowItem(cam, air, ...quayPt(u * M, v * M), 0.3 * M, 0.2 * M, 0.7, `pls${i}`));
      items.push({ z: a.z, el: <RomeFolk.Sack key={`pile${i}`} at={a.at} scale={a.scale * k * SACK_K} uid={`pile${i}`} fog={figFog(a.dist)} /> });
    });
    items.push(...crateItems(cam, air, 1.45, -0.95, setFog, "crate"));
    items.push(groundShadowItem(cam, air, ...quayPt(1.45 * M, -0.95 * M), 0.5 * M, 0.38 * M, 0.75, "crs"));
    // the figures, their goods; drawn as one painter item at the figures' depth (near arms over the goods)
    const fa = figAt(cam, FARMER_U, V_FIG);
    const ma = figAt(cam, MERCH_U, V_FIG);
    const fl = flaskAt(frame);
    const sk = sackAt(frame);
    const flP = ptAt(cam, fl.u, V_FIG - 0.05, fl.h);
    const skP = ptAt(cam, sk.u, V_FIG - 0.08, sk.h);
    const pxm = flP.s * M;
    const sackScale = skP.s * U2W * SACK_K;
    // the sack's handles (screen): its neck (just under the tie), its lower near corner, its upper far side
    const rotP = (v: P2, deg: number): P2 => {
      const a = (deg * Math.PI) / 180;
      return [skP.p[0] + v[0] * Math.cos(a) - v[1] * Math.sin(a), skP.p[1] + v[0] * Math.sin(a) + v[1] * Math.cos(a)];
    };
    const sackNeckGrip = rotP([0, 7 * sackScale], sk.ang);
    const sackLow = rotP([-22 * sackScale, 62 * sackScale], sk.ang);
    const sackHigh = rotP([24 * sackScale, 26 * sackScale], sk.ang);
    // the farmer: near hand (L) on the sack's neck until f74, then down; far hand (R) out to the flask from f20, holds
    // it from f40
    const fBase = RomeFolk.idle(RomeFolk.POSES.stand(1), frame, 0.3);
    const fRest = (side: "L" | "R"): P2 => [fa.at[0] + (side === "L" ? 16 : -14) * fa.scale, fa.at[1] - 140 * fa.scale];
    const mix2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const ease = (t: number) => Easing.inOut(Easing.cubic)(c01(t));
    const flaskGrip: P2 = [flP.p[0], flP.p[1] + 0.02 * pxm];
    const fNear = frame < 74 ? sackNeckGrip : mix2(sackNeckGrip, fRest("L"), ease((frame - 74) / 18));
    const fFar = frame < 20 ? fRest("R") : frame < 40 ? mix2(fRest("R"), flaskGrip, ease((frame - 20) / 20)) : flaskGrip;
    const fLook = interpolate(frame, [0, 30, 40, 56, 70, 104], [0.05, 0.05, 0.25, 0.05, -0.12, -0.15], { ...clamp, easing: Easing.inOut(Easing.sin) });
    const fPose = { ...fBase, pitch: fBase.pitch + 22 * fLook, headYaw: fBase.headYaw - 0.05 };
    // the merchant: near hand (R) holds the flask until f46, then to rest, then to the sack's low corner (touch f70);
    // far hand (L) to the sack's high side (touch f70), holding it after
    const mBase = RomeFolk.idle(RomeFolk.POSES.stand(-1), frame, 1.7);
    const mRest = (side: "L" | "R"): P2 => [ma.at[0] + (side === "R" ? -16 : 14) * ma.scale, ma.at[1] - 140 * ma.scale];
    const mNear = frame < 46 ? flaskGrip : frame < 52 ? mix2(flaskGrip, mRest("R"), ease((frame - 46) / 6) * 0.35) : frame < 70 ? mix2(mix2(flaskGrip, mRest("R"), 0.35), sackLow, ease((frame - 52) / 18)) : sackLow;
    const mFar = frame < 50 ? mRest("L") : frame < 70 ? mix2(mRest("L"), sackHigh, ease((frame - 50) / 20)) : sackHigh;
    const mLook = interpolate(frame, [0, 40, 56, 70, 100], [0.08, 0.15, 0.2, 0.3, 0.2], { ...clamp, easing: Easing.inOut(Easing.sin) });
    const mPose = { ...mBase, pitch: mBase.pitch + 22 * mLook };
    const fFog = figFog(fa.dist);
    const mFog = figFog(ma.dist);
    const fogHex = (hex: string) => mixHex(hex, fFog.rgb, fFog.amount);
    const fSh = groundShadowItem(cam, air, ...quayPt(FARMER_U * M, V_FIG * M), 0.42 * M, 0.22 * M, 0.85, "fsh");
    const mSh = groundShadowItem(cam, air, ...quayPt(MERCH_U * M, V_FIG * M), 0.42 * M, 0.22 * M, 0.85, "msh");
    items.push(fSh, mSh);
    items.push({
      z: Math.min(fa.z, ma.z) - 0.01,
      el: (
        <g key="swap">
          <RomeFolk.Freeman pose={fPose} at={fa.at} scale={fa.scale} uid="farmer" {...FARMER} fog={fFog} grip={{ L: fNear, R: fFar }} hideArm="L" />
          <RomeFolk.Freeman pose={mPose} at={ma.at} scale={ma.scale} uid="merchant" {...MERCHANT} fog={mFog} grip={{ R: mNear, L: mFar }} hideArm="R" />
          <SackAt neck={skP.p} scale={sackScale} ang={sk.ang} uid="sack" fog={fFog} />
          <Flask c={flP.p} px={pxm} tilt={fl.tilt} fog={fogHex} />
          <RomeFolk.Freeman pose={fPose} at={fa.at} scale={fa.scale} uid="farmerA" {...FARMER} fog={fFog} grip={{ L: fNear, R: fFar }} onlyArm="L" />
          <RomeFolk.Freeman pose={mPose} at={ma.at} scale={ma.scale} uid="merchantA" {...MERCHANT} fog={mFog} grip={{ R: mNear, L: mFar }} onlyArm="R" />
        </g>
      ),
    });
  }

  // ---- the labels (on the ground, under every standing thing) ----
  const lab = (L: typeof EGYPT) => interpolate(frame, [L.in, L.land], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#3F3428" }}>
      <AirStage v={air.v} bloom={0.22}>
        <MedGround cam={cam} frame={frame} air={{ near: air.near, far: air.far }} quay={1} />
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <AirHorizonHaze v={air.v} below={200} id="wfg-hz" />
          <GroundLabel cam={cam} text="EGYPT" at={EGYPT.at} cap={EGYPT.cap} u={lab(EGYPT)} air={air} plate={1} />
          <GroundLabel cam={cam} text="SYRIA" at={SYRIA.at} cap={SYRIA.cap} u={lab(SYRIA)} air={air} plate={1} />
          {paint(items)}
          <LowAir air={air} amt={0.7 * lowAirW(cam.D)} />
        </svg>
      </AirStage>
    </AbsoluteFill>
  );
};

export default WheatForGlass;
