// ---------------------------------------------------------------------------
// severalDaysAir — the medium of SeveralDaysBeforeIllness (kyle-covid, cut 21) through a TIME-LAPSE of several days:
// palette A (styles/dwarkesh-3d.md), its `day` mood blending continuously into its `night` mood and back by the
// night amount n (0 noon .. 1 midnight). pandemicAir's moods are discrete, so the view is built here with
// makeAirView's own formulas (copied, the file is read only) on an interpolated MoodSpec: the air dims and deepens,
// the sun's glow and the shafts fade (AirStage's shafts strength), the motes thin. The AirWorld (the kit's
// airWorldOf, copied) adds the night to every local colour (tone: fogged by distance, then sunk toward the night air),
// so the kit's AirBox / AirFloor / AirShadow / AirCyl draw the night as they draw the day.
// ---------------------------------------------------------------------------
import { AIR, MOODS, airRamp, c01, fogHex, hexRgb, lerp, mixHex, mixRgb, rgbHex, type AirScene, type AirView, type MoodSpec, type RGB } from "../kyle-pandemics/pandemicAir";
import { perspective, type DepthOpts } from "../kyle-london/londonDepth";
import type { Cam } from "../kits/maps/incaShared";
import type { AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";

/** the scene (eye fog: a street and a truck), cast units */
export const AIR_SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 650, fogVis: 2600, fogMax: 0.9, hLow: 0, hHigh: 1250, moteUnit: 178 };
/** the night's depth: the air's dim at midnight (the medium's night is 0.42; a little lighter here, so the orange
 *  never sits on a near-black ground: CRAFT) and how far local colours sink toward the night air */
export const NIGHT_DIM = 0.42;
export const NIGHT_SINK = 0.55;
const PAL = AIR.A;

/** the blended mood at night amount n; side = where the sun stands (-1 morning, on the left .. +1 evening, on the
 *  right): the shafts' slant and the sun's glow swing with it (review 2: the light moves through each day) */
const moodAt = (n: number, side = 0): MoodSpec => {
  const D = MOODS.day;
  const N = MOODS.night;
  return {
    tBias: lerp(D.tBias, N.tBias * 0.8, n),
    gain: lerp(D.gain, N.gain, n),
    dim: lerp(1, NIGHT_DIM, n),
    fogScale: lerp(D.fogScale, N.fogScale, n),
    sun: { ...D.sun, x: 540 + 470 * side, a: D.sun.a * Math.pow(1 - n, 1.4) },
    shafts: "rays",
    slant: 0.15 - 0.55 * side,
    motes: "dust",
    moteSize: 1,
    moteCount: lerp(1, 0.55, n),
    drift: D.drift,
  };
};
const dimRgb = (c: RGB, dim: number): RGB => (dim >= 0.999 ? c : (mixRgb(airRamp("A", 1), c, dim).map((v) => v * (0.55 + 0.45 * dim)) as RGB));
type Cam3 = { x: number; y: number; z: number };
/** makeAirView (pandemicAir) on the blended mood of night amount n */
export const cycleView = (p: { scene: AirScene; frame: number; horizon: number; cam: Cam3; rest: Cam3; night: number; side?: number }): AirView => {
  const { scene, frame, horizon } = p;
  const mood = moodAt(c01(p.night), p.side ?? 0);
  const eyeT = (scene.eyeT ?? PAL.eyeT) + mood.tBias;
  const u = scene.moteUnit;
  const travel = { x: (p.cam.x - p.rest.x) / u, y: (p.cam.y - p.rest.y) / u, z: (p.cam.z - p.rest.z) / u };
  const tAt = (t: number) => dimRgb(airRamp("A", t), mood.dim);
  const airAtScreen = (sy: number) => tAt(eyeT + (mood.gain * (sy - horizon)) / 1250);
  const fogAtD = (dist: number) => mood.fogScale * scene.fogMax * (1 - Math.exp(-Math.max(0, dist - scene.fogNear) / scene.fogVis));
  const airAtD = (dist: number, height = 0) => {
    const hn = c01((height - scene.hLow) / Math.max(1e-6, scene.hHigh - scene.hLow));
    const tH = lerp(eyeT + 0.22, eyeT - 0.18, hn);
    const w = 1 - Math.exp(-Math.max(0, dist) / (2.5 * scene.fogVis + scene.fogNear));
    return tAt(lerp(tH, eyeT, w));
  };
  return { scene, pal: PAL, mood, frame, horizon, eyeT, travel, airAtScreen, airAt: airAtD, fogAt: fogAtD };
};

/** the people's fog by stage depth (the kit's FIG_FOG) */
const FIG_FOG = { near: 300, vis: 2200, max: 0.75 };
export type CycleWorld = AirWorld & { night: number; nightOf: (hex: string, Z: number, h?: number) => string };
/** the kit's airWorldOf on the cycle view; tone adds the night (a local colour fogged, then sunk toward the night air
 *  by NIGHT_SINK * n); fog (rims, joints, shadows) rises at night (no sun: rims and cast shadows fade) */
export const cycleWorldOf = (o: { cam: Cam; rest: Cam; depth: DepthOpts; restDepth?: DepthOpts; frame: number; night: number; side?: number }): CycleWorld => {
  const { cam, rest, depth, frame, night: n } = o;
  const P = perspective(cam, depth);
  // the f0 camera's own depth (the push moves the eye: the motes' and shafts' parallax is measured from f0)
  const P0 = perspective(rest, o.restDepth ?? depth);
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const v = cycleView({
    scene: { ...AIR_SCENE, F: P.Dc * cam.k },
    frame,
    horizon: toSY(depth.eyeY),
    cam: { x: cam.cx, y: -depth.eyeY, z: -P.Dc },
    rest: { x: rest.cx, y: -depth.eyeY, z: -P0.Dc },
    night: n,
    side: o.side,
  });
  const Dc = P.Dc;
  const dist = (Z: number) => Dc + Z;
  const fogD = (Z: number) => c01(v.fogAt(dist(Z)));
  const fog = (Z: number) => 1 - (1 - fogD(Z)) * (1 - 0.6 * n);
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(dist(Z), h));
  const sink = (hex: string, Z: number, h: number) => (n < 0.002 ? hex : rgbHex(mixRgb(hexRgb(hex).map((c) => c * (1 - 0.5 * n)) as RGB, v.airAt(dist(Z), h), NIGHT_SINK * n)));
  const tone = (hex: string, Z: number, h = 0) => sink(fogHex(v, hex, dist(Z), h), Z, h);
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.5 * fogD(Z));
  const figFog = (Z: number) => FIG_FOG.max * (1 - Math.exp(-Math.max(0, Z - FIG_FOG.near) / FIG_FOG.vis));
  const folkFog = (Z: number, feetH = 0) => ({ rgb: airHex(Z, feetH + 150), amount: figFog(Z) });
  return {
    v,
    P,
    cam,
    Dc,
    k: cam.k,
    fog,
    airHex,
    tone,
    toneO,
    screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))),
    figFog,
    folkFog,
    workerInks: () => {
      throw new Error("not used");
    },
    lw: (b = 1.1) => b / Math.pow(cam.k, 0.6),
    night: n,
    nightOf: (hex, Z, h = 0) => sink(hex, Z, h),
  };
};
