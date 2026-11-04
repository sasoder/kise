// ---------------------------------------------------------------------------
// LivingThereAllHerLife (robert-johnson-ranch, cut 26). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 78 frames.
// The shared Hill Country world (ranchWorld.tsx) and cast (ranchFolk.tsx), read-only; this file only arranges them
// and moves the camera.
//
// CHECK LINE: "at the end of that empty road, one old woman sat on her porch, alone; she had lived there her whole
// life."
//
// THE LINE: "(And) this woman is living there all her life."
// WORD -> FRAME (Whisper onset; heard ~5 f later): this 2 · WOMAN 7 · is 17 · LIVING 23 · there 33 · ALL 42 · her 54 ·
//   LIFE 64 · (ends 78)
// DURATION: the slot 26.109 -> 29.363 s = 3.253 s x 23.976 = 78 frames (f0..f77).
//
// THE MOTION: f0 is the whole idea: the small white farmhouse with its windmill and a live oak, alone on the rolling
// hills in the late-afternoon air, seen from a little above; the caliche road comes in from the left frame edge, runs
// straight through the open pipe gate of the yard fence and on to the porch steps; the old woman is already rocking on
// the porch in her orange shawl. One smooth push-in (one velocity lobe, already moving at f0, peaking ~f24 and
// decelerating into "her life" f54-64), part dolly, part lens, part crane down to her eye level, drifting left for
// parallax: the gate posts slide out of the frame edges (f24-32), the windmill out of the top left, and we end on her
// between two porch posts, the road reaching her steps in the lower right, the empty hillside beside the house on the
// left. Her face travels one straight screen line (423, 854) -> (560, 750) (the camera's target ~30 above her eyes:
// eyes end at y ~770, feet and rockers <= ~1040, clear of the caption band at 1080). f64-77 a living hold (a creep):
// she rocks the whole time (+-4.5 deg about the rocker contact, period 2.6 s: back extreme ~f47, forward ~f77, so one
// full swing spans "all her life") and, from f56, turns her head a little toward us, down the empty road; the grass
// sways, the shafts drift. No text.
// The rocking chair is drawn whole BEHIND her and 12 % wider than the cast's built-in one (FarmWoman chair={false}),
// so her skirt sits inside the chair frame with no post across her lap.
// Orange = the woman who lived out there alone (her shawl, the one warm thing); everything else muted earthy colours.
//
// DEPTH (ranchWorld cam3: a level pinhole at (X, height E, Z) looking +Z, focal C, horizon row yH by lens shift; fog
// by the eye's distance, RANCH_SCENE): the farmhouse's porch front edge at Z 400 (X0 0), the woman at (-430, 570) on
// the porch floor (H 90); the windmill (-1700, 1500), the live oak (900, 1950), two cedar bushes, the gate (-310, -100),
// 1020 wide; the ground rolls gently (rollingTerrain, flat pad under the yard) and rises into a hillside behind the
// house from Z 1700 to its crest at Z 3400; three far ridges (RidgeStackV2) from Z 4550 into the haze. Camera: f0 at
// distance 3330 from her, E 900, C 1000 (house ~40 % of the frame width) -> f66 at 1250, E 300, C 1500 (her ~310 px
// tall), see camAt().
//
// SOURCES: none (an illustrative place; the period cues are the brief's: a 1970s Hill Country farmhouse, windmill,
// live oak, caliche road).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirHorizonHazeW, AirStage, WorldSvg, mixHex, swayCam, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { FIG_W, FarmWoman, FolkShadowW, RockingChair, elevOf, farmWomanPose } from "./ranchFolk";
import { FARM, FarmHouse, FenceLine, FencePost, HillGround, LiveOak, CedarBush, RMAT, RidgeStackV2, Windmill, cam3, ranchAirOf, ridgeSeries, rollingTerrain, type Item, type Terrain, type Tufts } from "./ranchWorld";

export const FPS = 24000 / 1001;
export const DURATION = 78;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ---- the set ------------------------------------------------------------------------------------------------------
const HOUSE = { X0: 0, Z0: 400 };
/** the woman in her chair on the porch: the floor point under the seat */
export const WOMAN = { X: -430, Z: HOUSE.Z0 + 170 };
/** the rocking chair's scale against hers (a touch wider than the cast's, so her skirt fits inside it) */
const CHAIR_W = 1.12;
const MILL = { X: -1700, Z: 1500 };
const OAK = { X: 900, Z: 1950, size: 5.2 * 178 };
const GATE = { X: -310, Z: -100, half: 510 };
/** the caliche road from off the left frame edge, straight at the end through the yard gate (keys 0..3), then the worn track
 *  to the porch steps (keys 4..7), one Catmull-Rom spline so the two join without a kink */
const PATH_KEYS: [number, number][] = [
  [-2600, -3100],
  [-1968, -2050],
  [-1081, -1100],
  [GATE.X, GATE.Z],
  [-40, 250],
];
const GATE_KEY = 3;
const SUB = 8;
const PATH: [number, number][] = (() => {
  const K = PATH_KEYS;
  const out: [number, number][] = [];
  for (let i = 0; i < K.length - 1; i++) {
    const p0 = K[Math.max(0, i - 1)];
    const p1 = K[i];
    const p2 = K[i + 1];
    const p3 = K[Math.min(K.length - 1, i + 2)];
    for (let j = 0; j < SUB; j++) {
      const t = j / SUB;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(K[K.length - 1]);
  return out;
})();
/** the width at each PATH point: the road 220, narrowing a little past the gate (the yard track to the steps) */
const PATH_W = PATH.map((_, i) => lerp(220, 170, sstep(GATE_KEY * SUB, (GATE_KEY + 1) * SUB, i)));
const ROAD_W = 240;
const distToRoad = (X: number, Z: number) => {
  let best = 1e9;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i];
    const [bx, bz] = PATH[i + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const t = c01(((X - ax) * dx + (Z - az) * dz) / (dx * dx + dz * dz));
    best = Math.min(best, Math.hypot(X - (ax + t * dx), Z - (az + t * dz)));
  }
  return best;
};
const BASE_T = rollingTerrain({ seed: 2, amp: 380, wave: 1300, flats: [{ X: 0, Z: 750, R: 1000, H: 0 }] });
/** the hillside behind the farm: the ground rises gently from Z ~1700 to a rolling crest at GROUND_Z1 (~950 high,
 *  ~5 m over ~10 m of stage depth), where the ground ends; the ridges stand behind it */
const GROUND_Z1 = 3400;
const hillRise = (X: number, Z: number) => 950 * sstep(1700, GROUND_Z1, Z) * (0.86 + 0.14 * Math.sin(X / 1300 + 0.7));
const TERRAIN: Terrain = {
  ...BASE_T,
  H: (X, Z) => BASE_T.H(X, Z) + hillRise(X, Z),
  clear: (X, Z) => distToRoad(X, Z) < ROAD_W * 0.62,
  crest: { at: (X) => ({ Z: GROUND_Z1, H: BASE_T.H(X, GROUND_Z1) + hillRise(X, GROUND_Z1) }), x0: -6000, x1: 6000 },
};
/** the far ridges receding into the haze behind the crest, each crest higher on screen than the one before it from
 *  both the f0 and the end camera (so they stack beside the house at the end) */
const RIDGES = ridgeSeries({ n: 3, zNear: 4550, ratio: 1.75, hNear: 0, hFar: 0, seed: 2, tops: [1700, 2900, 5000] });
const TUFTS: Tufts[] = [{ x0: -3200, x1: 3600, z0: -2600, z1: GROUND_Z1, step: 100, seed: 1 }];

// ---- the camera ---------------------------------------------------------------------------------------------------
// One push: a raised-cosine velocity lobe (from f-16, so it is already moving at f0, to f66) plus a slow constant
// creep, integrated and normalised so s = 1 at f66; every camera number is interpolated along s (distance and focal
// in log space), so the whole move is one lobe.
const LOBE = { a: -16, b: 66 };
const CREEP = 0.1; // the creep velocity (the lobe peaks at 1): s runs ~1.0 -> ~1.03 through the hold f66-f77
const vel = (f: number) => {
  const x = (f - LOBE.a) / (LOBE.b - LOBE.a);
  const bump = x <= 0 || x >= 1 ? 0 : 0.5 * (1 - Math.cos(2 * Math.PI * x));
  return bump + CREEP;
};
const S_TABLE = (() => {
  const sub = 8;
  const out: number[] = [0];
  let acc = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    for (let i = 0; i < sub; i++) acc += vel(f + (i + 0.5) / sub) / sub;
    out.push(acc);
  }
  return out;
})();
const S_END = S_TABLE[LOBE.b];
export const sAt = (f: number) => {
  const i = Math.max(0, Math.min(S_TABLE.length - 2, Math.floor(f)));
  const t = f - i;
  return lerp(S_TABLE[i], S_TABLE[i + 1], t) / S_END;
};
// Distance D (camera to her depth), focal C and eye height E run along s; the lens shift (horizon row yH) and the
// camera's X are then solved so that her face travels a straight screen line from (423, 854) to (560, 750): she stays
// the focus the whole way, with no dip or swing, while the land around her parallaxes.
const CAM0 = { D: 3330, C: 1000, E: 900, sx: 423, sy: 854 };
const CAM1 = { D: 1250, C: 1500, E: 300, sx: 560, sy: 750 };
/** the height of her face above the ground (the camera's target point) */
const FACE_H = 320;
export const camAt = (f: number) => {
  const s = sAt(f);
  const D = Math.exp(lerp(Math.log(CAM0.D), Math.log(CAM1.D), s));
  const C = Math.exp(lerp(Math.log(CAM0.C), Math.log(CAM1.C), s));
  const E = lerp(CAM0.E, CAM1.E, s);
  const sx = lerp(CAM0.sx, CAM1.sx, s);
  const sy = lerp(CAM0.sy, CAM1.sy, s);
  return { X: WOMAN.X - ((sx - 540) * D) / C, Z: WOMAN.Z - D, E, C, yH: sy + ((FACE_H - E) * C) / D };
};
const REST = cam3(camAt(0)).cam;

// ---- the road decal and the gate (this cut's own pieces, in ranchWorld's materials) ------------------------------
const ROAD_COL = mixHex(RMAT.caliche.mid, RMAT.caliche.lit, 0.4);
/** PATH points i0..i1 as a flat caliche strip on the ground (PATH_W wide), shaded along its length by the fog of each
 *  end (a gradient), opaque so the overlapping pieces join without seams */
const PathDecal: React.FC<{ A: AirWorld; T: Terrain; i0: number; i1: number; uid: string }> = ({ A, T, i0, i1, uid }) => {
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  const C: [number, number][] = [];
  const zMin = A.P.zNear + 40;
  for (let i = i0; i <= i1; i++) {
    const a = PATH[Math.max(0, i - 1)];
    const b = PATH[Math.min(PATH.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l;
    const nz = dx / l;
    const [X, Z] = PATH[i];
    if (Z < zMin) continue;
    const hw = PATH_W[i] * 0.5;
    L.push(A.P.p(X + nx * hw, -(T.H(X + nx * hw, Z + nz * hw) + 1), Z + nz * hw));
    R.push(A.P.p(X - nx * hw, -(T.H(X - nx * hw, Z - nz * hw) + 1), Z - nz * hw));
    C.push(A.P.p(X, -T.H(X, Z), Z));
  }
  if (L.length < 2) return null;
  const zA = Math.max(zMin, PATH[i0][1]);
  const zB = PATH[i1][1];
  const q = [...L, ...R.reverse()];
  const d = `M${q.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L")}Z`;
  const gid = `${uid}-g`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={C[0][0].toFixed(2)} y1={C[0][1].toFixed(2)} x2={C[C.length - 1][0].toFixed(2)} y2={C[C.length - 1][1].toFixed(2)}>
          <stop offset="0" stopColor={A.tone(ROAD_COL, zA, 0)} />
          <stop offset="1" stopColor={A.tone(ROAD_COL, zB, 0)} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${gid})`} />
    </g>
  );
};
/** one leaf of a galvanised pipe gate (~1.5 m high), hinged at (X, Z) and swung open to `ang` degrees from +X
 *  (counter-clockwise seen from above, +Z away from the camera): five rails, an end stile, a diagonal brace */
const GATE_RAILS = [45, 100, 155, 210, 265];
const GateLeaf: React.FC<{ A: AirWorld; X: number; Z: number; ang: number; len: number; uid: string }> = ({ A, X, Z, ang, len }) => {
  const a = (ang * Math.PI) / 180;
  const ex = X + Math.cos(a) * len;
  const ez = Z + Math.sin(a) * len;
  const pt = (t: number, h: number) => A.P.p(lerp(X, ex, t), -h, lerp(Z, ez, t));
  const Zm = (Z + ez) / 2;
  const w = 6.5 * A.P.r(Zm);
  const f = (p: [number, number]) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  let d = "";
  for (const h of GATE_RAILS) d += `M${f(pt(0, h))}L${f(pt(1, h))}`;
  d += `M${f(pt(1, 20))}L${f(pt(1, 280))}M${f(pt(0, 45))}L${f(pt(0.55, 265))}`;
  const col = A.tone(RMAT.tin.mid, Zm, 150);
  return (
    <g>
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${f(pt(0, GATE_RAILS[4] + 3))}L${f(pt(1, GATE_RAILS[4] + 3))}`} stroke={AIR.A.cream} strokeOpacity={0.45 * (1 - A.fog(Zm))} strokeWidth={w * 0.45} strokeLinecap="round" />
    </g>
  );
};

const LivingThereAllHerLife: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const c3 = camAt(frame);
  const { cam: cam0, depth } = cam3(c3);
  const cam = swayCam(cam0, frame);
  const A = ranchAirOf({ cam, depth, rest: REST, frame });
  const T = TERRAIN;

  // the woman rocking; through the hold her head turns a little toward us, down the empty road the camera came along
  const headYaw = -24 * sstep(56, 74, frame);
  // a clearly visible rock: +-4.5 deg about the rockers (ranchFolk's rockXf: the chair and her body together, feet
  // planted), period 2.6 s; its phase puts the back extreme at f47 and the forward one at f78, so one full swing spans
  // "all her life" (f47-77)
  const pose = farmWomanPose(frame, { yaw: 30, elev: elevOf(c3.E, FARM.floorH, WOMAN.Z - c3.Z, 90), headYaw, rockAmp: 4.5, rockPeriod: 2.6 });
  const seatAt = A.P.p(WOMAN.X, -FARM.floorH, WOMAN.Z);
  const figS = A.P.r(WOMAN.Z) * FIG_W;
  const chairProps = { at: seatAt, scale: figS * CHAIR_W, yaw: pose.yaw, elev: pose.elev, rock: pose.rock, fog: A.folkFog(WOMAN.Z, FARM.floorH), unitPx: A.k };
  const porch = (
    <g>
      <FolkShadowW A={A} X={WOMAN.X} Z={WOMAN.Z} Y={-FARM.floorH} kind="seated" uid="fws" />
      {/* The chair is drawn whole BEHIND her and a touch wider (CHAIR_W), so her skirt sits inside its frame: the cast's
          built-in chair draws its far front post across her lap (FarmWoman chair={false} here, ranchFolk untouched).
          At yaw 30 the rocker that crosses her shins on screen is the far one (behind them), so behind is right for it;
          the near rocker and near front post stay clear of her silhouette. */}
      <RockingChair {...chairProps} uid="fwc" />
      <FarmWoman pose={pose} at={seatAt} scale={figS} uid="fw" fog={A.folkFog(WOMAN.Z, FARM.floorH)} unitPx={A.k} chair={false} />
    </g>
  );

  const items: Item[] = [];
  items.push({ Z: HOUSE.Z0 - 140, node: <FarmHouse key="house" A={A} X0={HOUSE.X0} Z0={HOUSE.Z0} porch={porch} /> });
  items.push({ Z: MILL.Z - 160, node: <Windmill key="mill" A={A} X={MILL.X} Z={MILL.Z} H={T.H(MILL.X, MILL.Z)} frame={frame} /> });
  items.push({ Z: OAK.Z - 300, node: <LiveOak key="oak" A={A} X={OAK.X} Z={OAK.Z} H={T.H(OAK.X, OAK.Z)} size={OAK.size} frame={frame} uid="oak" seed={5} /> });
  items.push({ Z: 1200, node: <CedarBush key="ced1" A={A} X={-1500} Z={1300} H={T.H(-1500, 1300)} frame={frame} uid="ced1" seed={3} /> });
  items.push({ Z: 1500, node: <CedarBush key="ced2" A={A} X={2100} Z={1600} H={T.H(2100, 1600)} frame={frame} uid="ced2" seed={7} /> });
  // the road and the yard track: one caliche strip in overlapping pieces, each an item at its own nearest depth
  for (let i = 0; i < PATH.length - 1; i += 4) {
    const i1 = Math.min(PATH.length - 1, i + 5);
    const zMin = Math.min(...PATH.slice(i, i1 + 1).map((q) => q[1]));
    items.push({ Z: zMin - PATH_W[i] * 0.5, node: <PathDecal key={`pd${i}`} A={A} T={T} i0={i} i1={i1} uid={`pd${i}`} /> });
  }
  // the gate at the road's end: an open two-leaf pipe gate swung into the yard, two taller posts, the yard fence
  // running off both ways along the gate line
  items.push({ Z: GATE.Z - 10, node: <GateLeaf key="gl" A={A} X={GATE.X - GATE.half} Z={GATE.Z} ang={140} len={GATE.half} uid="gl" /> });
  items.push({ Z: GATE.Z - 10, node: <GateLeaf key="gr" A={A} X={GATE.X + GATE.half} Z={GATE.Z} ang={70} len={GATE.half} uid="gr" /> });
  items.push({ Z: GATE.Z - 30, node: <FenceLine key="fl" A={A} T={T} pts={[[-3400, GATE.Z - 40], [GATE.X - GATE.half, GATE.Z]]} /> });
  items.push({ Z: GATE.Z - 30, node: <FenceLine key="fr" A={A} T={T} pts={[[GATE.X + GATE.half, GATE.Z], [3400, GATE.Z + 60]]} /> });
  items.push({ Z: GATE.Z - 20, node: <FencePost key="gp1" A={A} X={GATE.X - GATE.half} Z={GATE.Z} H={T.H(GATE.X - GATE.half, GATE.Z)} h={280} w={26} /> });
  items.push({ Z: GATE.Z - 20, node: <FencePost key="gp2" A={A} X={GATE.X + GATE.half} Z={GATE.Z} H={T.H(GATE.X + GATE.half, GATE.Z)} h={280} w={26} /> });

  return (
    <AirStage v={A.v} shafts={0.5} motes={0.4} bloom={0.15}>
      <WorldSvg cam={cam}>
        <AirHorizonHazeW A={A} id="hz" />
        <RidgeStackV2 A={A} ridges={RIDGES} uid="rd" />
        <HillGround A={A} T={T} z0={-2700} z1={GROUND_Z1} items={items} tufts={TUFTS} frame={frame} uid="hg" />
      </WorldSvg>
    </AirStage>
  );
};

export default LivingThereAllHerLife;
