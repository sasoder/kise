// ---------------------------------------------------------------------------
// NothingButMoreHills (robert-johnson-ranch, cut 59). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 233 frames.
// The clip's shared world (ranchWorld.tsx) and cast (ranchFolk.tsx) inside the misty teal air (AirStage, palette A).
//
// CHECK LINE: "from the top of the hill behind her house, Rebekah Johnson could see nothing in any direction but
//   more hills."
//
// THE LINE: "I think I have a line where, you know, she could walk out in the afternoon, walk up on a hill, and there
//   was nothing to see but more hills."
// WORD -> FRAME: think -1 · line 22 · where 31 · you 51 · know 58 · SHE 65 · could 69 · WALK 75 · OUT 84 ·
//   afternoon 101 · WALK 122 · UP 129 · HILL 147 · and 158 · there 166 · NOTHING 174 · to 184 · SEE 192 · but 200 ·
//   MORE 208 · HILLS 214 (heard ~5 f later).
// DURATION: the slot 59.643 -> 69.361 s = 9.718 s x 23.976 = 233 frames (f0..f232).
//
// THE MOTION: one continuous camera. f0 close on the dog-run house in the late afternoon, Rebekah standing on the
//   porch (shawl and grass in the wind), the camera drifting in. f58-74 she looks toward the hill, on WALK OUT she
//   steps off the porch end and crosses the yard, then walks up the slope behind the house (UP 129), the camera
//   following low (eye below the crest, so the far country stays hidden). She reaches the crest on HILL (f147-150),
//   stops and turns a little to look out (three-quarter back). From f148 the camera cranes up and back over her
//   (one smooth lobe): ridge after ridge rises into view, falling away into the haze to the horizon, the farthest
//   landing by HILLS f214; then settled, her head slowly sweeping the view, the shawl and grass moving.
//   Orange = her shawl only.
//
// DEPTH: ranchWorld cam3 (pinhole, lens shift, no tilt), C 1000; the eye 176-192 while she walks (below the crest
//   195), ~1075 at the end, 1250 back from her (looking down ~30 deg, horizon y ~300, her feet y ~995, ~235 px tall).
//   House X0 -380, Z0 0 (porch Z 0-250, rooms to 750; its logs' shaded side lifted to mid-umber, TIMBER); the camera
//   drifts right from f112 so the house's side leaves the frame's left edge by f143 and stays out (end X 1270). Her
//   walk (355,170) -> (600,235) -> (900,600), ~720 units in 7 steps; the crest at Z ~600 (H 195). THE FAR HILLS:
//   13 HillCountryRidges (irregular limestone benches and rounded knobs with saddles, olive-khaki near -> grey-green
//   -> haze, lit left flanks, shaded right ones, oak motts and cedar brakes on the nearest four) at camera distances
//   2000 x 1.42^i from the end camera, heights solved so ridge i lands at y 300 + 635 x 0.8^i at the end.
//   While the eye is low (to ~f178) the horizon behind her is LAND HAZE (warm grey-green, blended up into the sky)
//   with three faint skyline ranges in it, handing over to the open view as the crane rises (gone by f206-214).
//   The near cedar bush in dark-green tree tones with a light rim (BUSH_MAT).
//   The ridges are grass-covered (HillCountryRidges grass + flatFar), paling into FAR_HAZE (pale grey-green); the haze
//   band stays above the horizon to the end so the farthest layers dissolve into the sky.
// FRAMING: the horizon row is 760 over the porch stretch (her feet y <= ~960, the porch's front edge <= 1060 to f112,
//   out of frame by f118), easing to 920 by f146 as she climbs, then the crane to 300.
//   Fog by the eye's distance (RANCH_SCENE).
//
// SOURCES: the line is Robert Caro's (word_tables.md cut S3). Rebekah Baines Johnson's dog-run house in the Hill
//   Country c.1910 (Caro, The Path to Power); drawn generically, no real landmarks.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirHorizonHazeW, AirStage, WorldSvg, mixHex } from "../kits/dwarkesh-3d/dwarkesh3d";
import { FIG_W, FolkShadowW, Rebekah, elevOf, makeWalk, type WalkSpec } from "./ranchFolk";
import {
  CedarBush,
  DOGRUN,
  DogRunHouse,
  HillGround,
  LiveOak,
  HillCountryRidges,
  cam3,
  dogRunRanges,
  ranchAirOf,
  type Cam3,
  type Item,
  type Ridge,
  type Terrain,
} from "./ranchWorld";

export const FPS = 24000 / 1001;
export const DURATION = 233;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
/** smootherstep (zero 1st and 2nd derivative at both ends) */
const s5 = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

// ===================================================================================================================
// THE PLACE
// ===================================================================================================================
const HOUSE = { X0: -380, Z0: 0 };
const HR = dogRunRanges(HOUSE.X0, HOUSE.Z0);
const PORCH = { x0: HR.xL - 30, x1: HR.xR + 30, z0: HR.porch[0], z1: HR.porch[1] };
/** the slope's foot, the crest's depth and the crest's height along X */
const zFoot = (X: number) => lerp(800, 120, sstep(350, 560, X));
const zCrest = (X: number) => lerp(820, 600, sstep(300, 660, X));
const hCrest = (X: number) => 50 + 145 * Math.exp(-(((X - 900) / (X < 900 ? 450 : 650)) ** 2));
const H_T = (X: number, Z: number) => {
  const zf = zFoot(X);
  const zc = zCrest(X);
  const hc = hCrest(X);
  if (Z <= zf) return 0;
  if (Z <= zc) return hc * sstep(0, 1, (Z - zf) / (zc - zf));
  return hc - 900 * (1 - Math.exp(-(((Z - zc) / 700) ** 2)));
};
/** the logs lifted so the shaded side stays mid-umber in this light (the shared default goes near-black in shade) */
const TIMBER = { lit: "#A38059", mid: "#73583B", dark: "#6A5440" };
const TERRAIN: Terrain = {
  H: H_T,
  // a little deeper and greener than the shared default: the late-afternoon slope in shade of the air
  grass: { lit: "#89906C", mid: "#636D51", dark: "#36412F" },
  // the swept dirt yard in front of the house
  mat: (X, Z) => 0.7 * (1 - sstep(0.75, 1.15, Math.hypot((X - HOUSE.X0) / 1050, (Z + 60) / 330))),
};
/** the walking ground: the porch floor, else the land */
const groundW = (X: number, Z: number) => {
  // the porch floor, eased off over its last few inches so the body steps down without a one-frame drop
  const on = (1 - sstep(PORCH.x1 - 25, PORCH.x1 + 25, X)) * sstep(PORCH.x0 - 25, PORCH.x0 + 25, X) * (1 - sstep(PORCH.z1 - 25, PORCH.z1 + 25, Z)) * sstep(PORCH.z0 - 25, PORCH.z0 + 25, Z);
  return lerp(H_T(X, Z), DOGRUN.floorH, on);
};

// ===================================================================================================================
// HER WALK
// ===================================================================================================================
const PATH: [number, number][] = [
  [355, 170],
  [600, 235],
  [900, 600],
];
const W0 = 72;
const W1 = 150;
/** distance along the path: a walking speed with a soft start and stop, normalised to the path's length */
const sAtOf = (total: number) => {
  const v = (f: number) => sstep(W0, W0 + 12, f) * (1 - sstep(W1 - 14, W1, f));
  const tab: number[] = [0];
  for (let f = 1; f <= DURATION + 4; f++) tab.push(tab[f - 1] + 0.5 * (v(f - 1) + v(f)));
  const norm = total / tab[tab.length - 1];
  return (f: number) => {
    if (f <= 0) return 0;
    const i = Math.min(tab.length - 2, Math.floor(f));
    return lerp(tab[i], tab[i + 1], f - i) * norm;
  };
};
const pathLen = PATH.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]), 0);
const S_AT = sAtOf(pathLen);
const TURN_TO = 140;
const SPEC: WalkSpec = {
  path: PATH,
  sAt: S_AT,
  steps: 7,
  ground: groundW,
  firstFoot: "R",
  startYaw: 40,
  yawAt: (f, py) => py + (TURN_TO - py) * s5(W1 - 4, W1 + 18, f),
  headAt: (f) => {
    // looks toward the hill before she goes, then down at the slope, then up and out, then slowly sweeps the view
    const look = sstep(56, 70, f) * (1 - sstep(80, 96, f));
    const sweep = sstep(172, 232, f);
    const yaw = 32 * look + lerp(-16, 18, sweep) * sstep(158, 176, f) - 6 * sstep(146, 160, f) * (1 - sstep(160, 176, f));
    const pitch = 2 - 5 * sstep(110, 124, f) * (1 - sstep(144, 160, f)) + 3 * sstep(150, 166, f);
    return { yaw, pitch };
  },
};
const WALK0 = makeWalk(SPEC);

// ===================================================================================================================
// THE CAMERA: a drift on the house, a low follow up the slope, one crane up and back over her on the crest
// ===================================================================================================================
const C = 1000;
const END_DIST = 1250;
const CREST = PATH[PATH.length - 1];
const H_END = H_T(CREST[0], CREST[1]);
const Y_FEET_END = 1000;
const YH_END = 300;
const E_END = H_END + ((Y_FEET_END - YH_END) * END_DIST) / C;
/** right of her, far enough that the house's back corner stays out of the frame's left edge at the end */
const END_X = 1270;
const herAt = (f: number) => WALK0.walk(f);
const camOf = (f: number): Cam3 => {
  // the horizon row: high enough over the porch stretch that her feet and the porch's front edge stay above the
  // caption band (y <= ~1060 to f105), easing back down to 920 as she climbs
  const yHw = lerp(760, 920, s5(110, 146, f));
  const start = { X: 240 + 0.5 * f, Z: -800 + 0.9 * f, E: 182, yH: yHw };
  const h = herAt(Math.max(0, f - 4));
  // drifting right as she climbs, so the house's side slides out of frame by f150 and stays out
  const follow = { X: h.X - 40 + 150 * s5(112, 150, f), Z: h.Z - 860, E: 176 + 0.08 * h.H, yH: yHw };
  const g = f - 214;
  const fin = { X: END_X + 0.6 * g, Z: CREST[1] - END_DIST - 0.9 * g, E: E_END + 0.5 * g, yH: YH_END - 0.25 * g };
  const a = s5(58, 112, f);
  const b = s5(147, 214, f);
  const mix = (k: "X" | "Z" | "E" | "yH") => lerp(lerp(start[k], follow[k], a), fin[k], b);
  return { X: mix("X"), Z: mix("Z"), E: mix("E"), C, yH: mix("yH") };
};
const WALK = makeWalk({
  ...SPEC,
  elevAt: (f) => {
    const c = camOf(f);
    const h = herAt(f);
    return elevOf(c.E, h.H, h.Z - c.Z);
  },
});

// ===================================================================================================================
// THE FAR HILLS: Hill Country ridges solved from the end camera so ridge i's mean line lands at y 300 + 635 x 0.8^i
//   (from just above her crest at y ~935 up to ~345 where the farthest dissolve into the haze); hills up to ~140 px tall and
//   ~150 px apart on screen on the nearest, smaller and finer with distance; trees on the nearest four.
// ===================================================================================================================
const CAM_END_Z = CREST[1] - END_DIST;
const RIDGES: Ridge[] = Array.from({ length: 13 }, (_, i) => {
  const d = 2000 * Math.pow(1.42, i);
  const y = YH_END + 635 * Math.pow(0.8, i);
  const Z = d + CAM_END_Z;
  const H = E_END - ((y - YH_END) * d) / C;
  const px = d / C;
  // the far half: lower, longer, gentler lines (clean stacked silhouettes, not a ripple)
  const far = Math.max(0, i - 4);
  const ampPx = 140 * Math.pow(0.85, Math.min(i, 4)) * Math.pow(0.74, far);
  const lamPx = 150 * Math.pow(0.9, Math.min(i, 4)) * (1 + 0.18 * far);
  return { Z, H, amp: ampPx * px, lambda: lamPx * px, seed: 7 + i * 3.7, tree: 12 * Math.pow(0.7, i) * px, dots: i < 4 ? [1, 0.9, 0.75, 0.55][i] : 0 };
});

// THE LAND HAZE: from the crest (f140-172) the horizon behind her is far land in the haze, not the air's teal band:
//   a warm grey-green band anchored to the horizon, solid below it and blending up into the sky, with three faint
//   skyline ranges in it (solved from the f150 camera to stand 22-52 px above the horizon there; at the end they sit
//   just above the farthest of the RIDGES, as the last faint ranges).
const LAND = "#A3AB95";
/** the haze the hills pale into with distance: a pale grey-green, never the air's blue-teal */
const FAR_HAZE = "#B2B9A3";
const CAM150 = camOf(150);
const SKYLINE: Ridge[] = [
  [300000, 22],
  [450000, 38],
  [650000, 52],
].map(([d, px], i) => {
  const Z = CAM_END_Z + d;
  const dist = Z - CAM150.Z;
  return { Z, H: CAM150.E + (px * dist) / C, amp: 24 * (dist / C), lambda: 190 * (dist / C), seed: 31 + i * 5.3, tree: 0, dots: 0 };
});
const LandHaze: React.FC<{ A: ReturnType<typeof ranchAirOf>; id: string; op: number; color: string }> = ({ A, id, op, color }) => {
  const k = A.cam.k;
  const y0 = A.P.opts.eyeY;
  const up = 420 / k;
  const x0 = A.cam.cx - 700 / k;
  const w = 1400 / k;
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={(y0 - up).toFixed(2)} x2="0" y2={(y0 + 2 / k).toFixed(2)}>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((o) => (
            <stop key={o} offset={o} stopColor={color} stopOpacity={Math.min(1, Math.pow(o, 1.6) * (3 - 2 * o)).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={(y0 - up).toFixed(2)} width={w.toFixed(2)} height={(up + 2 / k).toFixed(2)} fill={`url(#${id})`} />
      <rect x={x0.toFixed(2)} y={(y0 + 1 / k).toFixed(2)} width={w.toFixed(2)} height={(1100 / k).toFixed(2)} fill={color} />
    </g>
  );
};
/** the near bush in the near ridges' tree tones (dark green, never black), lit on its upper-left edge */
const BUSH_MAT = { lit: "#76845A", mid: "#52603C", dark: "#3D4A33" };

const NothingButMoreHills: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const c3 = camOf(frame);
  const { cam, depth } = cam3(c3);
  const A = ranchAirOf({ cam, depth, rest: cam3(camOf(0)).cam, frame });
  const her = WALK.walk(frame);
  // the land haze and the skyline ranges hold while the eye is low, and hand over to the open view as the crane rises
  const landOp = 1 - s5(178, 214, frame);
  const skyOp = 1 - s5(174, 206, frame);
  // the haze colour: the land haze behind her while low, the far hills' pale grey-green at the end; it stays above the
  // horizon as a soft band so the farthest layers dissolve into the sky (no hard edge)
  const hazeC = mixHex(FAR_HAZE, LAND, landOp);
  const onPorch = her.X <= PORCH.x1 + 20 && her.Z <= PORCH.z1;
  const fig = (
    <g>
      <FolkShadowW A={A} X={her.X} Z={her.Z} Y={-her.H} uid="rbS" />
      <Rebekah pose={{ ...her.pose, holdL: 1 }} at={A.P.p(her.X, -her.H, her.Z)} scale={A.P.r(her.Z) * FIG_W} uid="rb" fog={A.folkFog(her.Z, her.H)} unitPx={A.k} />
    </g>
  );
  const items: Item[] = [
    { Z: HOUSE.Z0, node: <DogRunHouse A={A} X0={HOUSE.X0} Z0={HOUSE.Z0} inside={onPorch ? fig : null} timber={TIMBER} /> },
    { Z: 1450, node: <LiveOak A={A} X={-1300} Z={1500} H={H_T(-1300, 1500)} frame={frame} uid="oak" seed={3} /> },
    { Z: 790, node: <CedarBush A={A} X={1680} Z={830} H={H_T(1680, 830)} size={1.05 * 178} frame={frame} uid="cd1" seed={4} mat={BUSH_MAT} rim="#B9B98E" /> },
    { Z: 560, node: <CedarBush A={A} X={2350} Z={600} H={H_T(2350, 600)} size={2.2 * 178} frame={frame} uid="cd2" seed={8} /> },
  ];
  if (!onPorch) items.push({ Z: her.Z - 80, node: fig });
  return (
    <AirStage v={A.v} shafts={0.75} motes={0.5} bloom={0.18}>
      <WorldSvg cam={A.cam}>
        <AirHorizonHazeW A={A} id="hz" />
        <LandHaze A={A} id="lh" op={1 - 0.15 * (1 - landOp)} color={hazeC} />
        {skyOp > 0.005 ? (
          <g opacity={skyOp}>
            <HillCountryRidges A={A} ridges={SKYLINE} uid="sk" tRange={[0.9, 1]} hazeHex={LAND} fade={0.45} grass flatFar />
          </g>
        ) : null}
        <HillCountryRidges A={A} ridges={RIDGES} uid="rd" hazeHex={hazeC} grass flatFar />
        <HillGround
          A={A}
          T={TERRAIN}
          z0={-700}
          z1={1700}
          items={items}
          tufts={[
            { x0: -2400, x1: 3200, z0: -1000, z1: 1600, step: 80, seed: 3, size: 46, near: 330 },
            { x0: -2400, x1: 3200, z0: -1000, z1: 1600, step: 60, seed: 5, size: 32, near: 300 },
          ]}
          frame={frame}
          uid="hg"
        />
      </WorldSvg>
      {/* the near ground sinks a little into shade toward the frame's foot (depth: near darker, far into the air) */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="nbFoot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2E3A2C" stopOpacity={0} />
            <stop offset="1" stopColor="#2E3A2C" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <rect x={0} y={1180} width={1080} height={740} fill="url(#nbFoot)" />
      </svg>
    </AirStage>
  );
};

export default NothingButMoreHills;

/** for the review scripts: the camera and her screen box at a frame */
export const debugAt = (f: number) => {
  const c = camOf(f);
  const h = WALK.walk(f);
  const k = C / Math.max(50, -c.Z);
  const r = -c.Z / (-c.Z + h.Z);
  const sx = 540 + (h.X - c.X) * r * k;
  const sy = c.yH + (c.E - h.H) * r * k;
  // the porch's front edge (floor height, Z = PORCH.z0), the part inside the frame: its row, or null when out of frame
  const kP = C / Math.max(50, PORCH.z0 - c.Z);
  const xa = 540 + (PORCH.x0 - c.X) * kP;
  const xb = 540 + (PORCH.x1 - c.X) * kP;
  const porchY = xb > 0 && xa < 1080 ? c.yH + (c.E - DOGRUN.floorH) * kP : null;
  return { f, cam: c, X: h.X, Z: h.Z, H: h.H, yaw: h.yaw, sx, sy, hpx: 470 * FIG_W * r * k, elev: h.pose.elev, porchY, slope: h.pose.slope, feet: h.pose.feet };
};
