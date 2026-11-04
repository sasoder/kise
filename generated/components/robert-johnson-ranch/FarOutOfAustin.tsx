// ---------------------------------------------------------------------------
// FarOutOfAustin (robert-johnson-ranch, cut 6, take 3; replaces DriveOutOfAustin). Dwarkesh 3D style
// (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 322 frames. No text on screen.
// One stage inside the misty warm air (AirStage, palette A) of the clip's picture-book Hill Country (ranchWorld), on
// a pinhole camera that always looks toward Austin (+Z) while it travels 40 km with the car.
//
// CHECK LINE: the woman Caro went to see lived 44 miles from the city of Austin, the last 22 on a dirt road through
// empty hills: a long way from anything.
//
// THE LINE: "You drive out of Austin at 22 miles, and you look on your left, you'll find a cattle guard. You turn,
// and there's a dirt road there. You turn left on the dirt road and 22 miles to the farm."
// WORD -> FRAME (Whisper; heard ~5 f later): drive 4 · out 9 · AUSTIN 23 · 22 45 · MILES 58 · look 87 · LEFT 102 ·
// find 119 · CATTLE 130 · GUARD 138 · TURN 155 · DIRT 180 · ROAD 187 · there 194 · TURN 213 · LEFT 219 · dirt 237 ·
// road 243 · 22 261 · MILES 273 · to 287 · FARM 303.
// DURATION: the slot 6.089 -> 19.520 s = 13.431 s x 23.976 = 322 frames (f0..f321).
//
// THE MOTION: a 1970s sedan pulls away from Austin (the Capitol and its towers big on the horizon) down US 290, the
// camera ahead of it looking back so the city stays over the car's shoulder while it shrinks into the haze; the car
// slows, the camera eases down and in as the cattle guard on the driver's left comes into frame (f125-140), and the
// city, coming down with it, sinks behind the hills and is lost in the haze (gone by f160, never seen again). The car
// turns left through the guard, rolling over the pipes, onto the pale caliche road, which winds east across open
// grass (a mott or a cedar brake now and then, a pasture fence) while the camera rises and pulls back in one
// continuous move; from f150 the far land gives way (FLAT_IN, f150-192) to cut 59's Hill Country ridge rows
// (farOutFar: HillCountryRidges grass + flatFar, paling into a warm land haze at a clear horizon), and at the end the
// road can be followed from the car (~100 px, y ~930) back over ridge after ridge toward the horizon. The light
// shafts fade out over f150-236 and the air thins (fog), so the warm light of the opening holds to f321.
// No farm, no house: just more hills. No orange: muted earth and air throughout.
//
// DEPTH: farOutPlan's world (178 units/m), the camera 1.3-5.3 k units over its target, 5.7-16.5 k behind it; the kit
// sees it through a fixed Dc = 6000 (kit Z = world Z - camera Z - Dc), fog by the eye's distance (RANCH_SCENE, longer
// visibility). The city is a picture-book cheat: it recedes along the highway's line faster than the car drives
// (farOutPlan.cityZ), so it shrinks from the full frame width to a small skyline while staying on the flat plain.
//
// SOURCES: the Texas Capitol (Austin, 1888: a dome on a colonnaded drum, the Goddess of Liberty statue with a raised
// star, long wings, pink granite), US 290 west out of Austin into the Hill Country, cattle guards (steel pipes over a
// pit in a ranch fence line), caliche ranch roads: general knowledge; the line and the distances are the speaker's.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirHorizonHazeW, AirStage, WorldSvg, mixHex, swayCam, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CedarBush, RMAT, U, cam3, ranchAirOf, type Item } from "./ranchWorld";
import { CAR_MAT, CattleGuard, DustPuffs, Sedan, type Puff } from "./farOutCar";
import { AustinCity } from "./farOutCity";
import { c01, n2, type Toner } from "./farOutFaces";
import { FAR_HAZE, fenceItems, fencePosts, highwayFences, landItems, roadItems, treeItems, tuftItems, type FenceSpec, type Seg, type World } from "./farOutGround";
import { CITY_W, CITY_X, DURATION as PLAN_DURATION, FLAT_Z0, FPS as PLAN_FPS, GUARD_AT, HWY_DIR, TH, camAt, carAt, cityFog, cityGone, cityLift, cityZ, flatIn, s5 } from "./farOutPlan";
import { farRowItems } from "./farOutFar";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const DC0 = 6000;
const SCENE = { fogNear: 1500, fogVis: 36000, fogMax: 0.88 };

// ---- the camera's keep-out lines for the trees (camera ground point -> car, every 4 frames) ----------------------
const KEEP: Seg[] = (() => {
  const out: Seg[] = [];
  for (let f = -8; f <= DURATION + 4; f += 4) {
    const c = camAt(f);
    const k = carAt(f);
    out.push({ a: [c.X, c.Z, c.E], b: [k.X, k.Z, k.H + 120] });
    if (f >= 116 && f <= 210) out.push({ a: [c.X, c.Z, c.E], b: [GUARD_AT[0], GUARD_AT[1], TH(GUARD_AT[0], GUARD_AT[1]) + 100] });
    // the sight lines to the skyline on the highway leg (it fills the frame's width early): no tree crowns across it
    if (f <= 124) for (let x = 0; x <= 1080; x += 135) out.push({ a: [c.X, c.Z, c.E], b: [c.X + ((x - 540) * 30000) / c.C, c.Z + 30000, c.E - 30] });
    // later, the lines to the small skyline's base on its rise (no hilltop crowns across Austin)
    if (f > 124 && cityGone(f) < 0.999) {
      const dC = cityZ(f) - c.Z;
      const w = (CITY_W * c.C) / dC;
      const cx = 540 + ((CITY_X - c.X) * c.C) / dC;
      const yb = c.yH + ((c.E - cityLift(f)) * c.C) / dC;
      for (let i = 0; i <= 6; i++) {
        const x = cx + (i / 6 - 0.5) * 0.85 * w;
        const L = 40000;
        out.push({ a: [c.X, c.Z, c.E], b: [c.X + ((x - 540) * L) / c.C, c.Z + L, c.E - ((yb + 6 - c.yH) * L) / c.C] });
      }
    }
  }
  return out;
})();
const CAM_PATH: [number, number][] = Array.from({ length: Math.ceil((DURATION + 12) / 3) }, (_, i) => {
  const c = camAt(i * 3 - 6);
  return [c.X, c.Z];
});
// ---- the near set dressing: three cedars by the guard (they come in from the frame's edges once the camera settles) --
const FAR_LAND = "#B4BBA0";
const BUSH_LIT = { lit: "#76845A", mid: "#52603C", dark: "#3D4A33" };
const NEAR_TREES: { X: number; Z: number; size: number; seed: number; from: number; to: number }[] = [
  // (none in the ground the camera flies over at f110-140: what it reveals there would whip up through the frame)
  // two cedars that come in only once the camera has settled (slowly, from the left edge and from the bottom)
  { X: -600, Z: -3800, size: 2.4 * U, seed: 5, from: 100, to: 240 },
  { X: -300, Z: -4700, size: 2.2 * U, seed: 9, from: 100, to: 240 },
  { X: 2600, Z: -5200, size: 2.2 * U, seed: 12, from: 100, to: 240 },
];
const HWY_FENCES = highwayFences();
const HWY_FENCE_POSTS = HWY_FENCES.map(fencePosts);
/** a pasture fence across the open ground south of the ranch road (the ground the camera rises over at f195-240):
 *  out of the opening's view, clear of the camera's path */
const PASTURE: FenceSpec = { pts: [[3400, -3600], [4700, -5200], [6400, -6900], [7700, -7800]], spacing: 420, seed: 41 };
const PASTURE_POSTS = fencePosts(PASTURE);

// ---- the dust behind the car on the caliche (world puffs from its own recent path) -------------------------------
const DUST_LIFE = 44;
const dustAt = (f: number): (Puff & { amt: number })[] => {
  const out: (Puff & { amt: number })[] = [];
  for (let g = Math.floor(f) - DUST_LIFE; g <= f; g += 2) {
    if (g < 0) continue;
    const c = carAt(g);
    if (!c.onDirt || c.v < 15) continue;
    const back = 560;
    const X = c.X - c.heading[0] * back;
    const Z = c.Z - c.heading[1] * back;
    out.push({ X, Z, H: TH(X, Z), age: f - g, seed: g, amt: c01(c.v / 240) });
  }
  return out;
};

// ---- the city's own air: clear-ish at f0, a faint silhouette at the end -----------------------------------------
const cityTone = (A: AirWorld, f: number): Toner => {
  const haze = A.screenAir(A.P.opts.eyeY - 30 / A.k);
  const t = cityFog(f);
  return (hex, _Z, h) => mixHex(hex, haze, c01(t + 0.06 * (1 - c01(h / 22000))));
};

/** the scene at a frame: the air, the camera and every item, sorted far to near (pure: the review scripts call it) */
export const sceneAt = (frame: number) => {
  const c = camAt(frame);
  const oz = c.Z + DC0;
  const { cam: cam0, depth } = cam3({ X: c.X, Z: -DC0, E: c.E, C: c.C, yH: c.yH });
  const cam = swayCam(cam0, frame);
  // the second half keeps the opening's warm light: the air thins out over the rise (far land stays yellow-green)
  const thin = s5(150, 236, frame);
  const A = ranchAirOf({ cam, depth, rest: cam0, frame, scene: thin > 0 ? { ...SCENE, fogVis: lerp(SCENE.fogVis, 80000, thin), fogMax: lerp(SCENE.fogMax, 0.78, thin) } : SCENE });
  const W: World = { A, oz, frame };
  const K = (Z: number) => Z - oz;
  const items: Item[] = [];

  // the car (computed first: the road pieces under it key just behind it)
  const car = carAt(frame);
  const carMinZ = car.Z - Math.abs(car.heading[1]) * 520 - Math.abs(car.heading[0]) * 190;
  const carCut = carMinZ - 200;
  // on the guard (its footprint over the bed), the car draws after the bed: the pipes stand 2-3 cm, they never hide it
  const onGuard = Math.hypot(car.X - GUARD_AT[0], car.Z - GUARD_AT[1]) < 520 + 560 + 150;
  const carKey = onGuard ? Math.min(K(carCut), K(GUARD_AT[1] - 500) - 0.5) : K(carCut);
  // the guard's bed: keyed at its nearest corner
  const guardCut = GUARD_AT[1] - 500;
  const unders = [
    { X: car.X, Z: car.Z, R: 560, cut: carCut },
    { X: GUARD_AT[0], Z: GUARD_AT[1], R: 520, cut: guardCut },
  ];
  // the land (slices first: at equal depth an item draws after the ground)
  items.push(...landItems(W));
  items.push(...roadItems(W, "hwy", { unders }));
  items.push(...roadItems(W, "dirt", { unders }));
  items.push(...tuftItems(W));
  // the second half: the grass texture carried farther out (larger, sparser tufts), so the ground the camera rises
  // over is never flat paint
  const tufts2 = s5(150, 196, frame);
  if (tufts2 > 0.01) items.push(...tuftItems(W, { dFrom: 6200, dMax: 13500, step: 230, sMul: 1.6, op: tufts2, seed: 23 }));
  if (frame > 150) items.push(...fenceItems(W, PASTURE, PASTURE_POSTS));
  items.push(...treeItems(W, KEEP, CAM_PATH));
  HWY_FENCES.forEach((f, i) => items.push(...fenceItems(W, f, HWY_FENCE_POSTS[i])));
  NEAR_TREES.forEach((t, i) => {
    if (frame < t.from || frame > t.to || K(t.Z) < A.P.zNear + 300) return;
    const H = TH(t.X, t.Z) - 10;
    const uid = `nt${i}`;
    items.push({ Z: K(t.Z) - t.size * 0.3, node: <CedarBush key={uid} A={A} X={t.X} Z={K(t.Z)} H={H} size={t.size} seed={t.seed} frame={frame} uid={uid} mat={BUSH_LIT} rim="#B9B98E" /> });
  });

  // the city on the plain
  const cz = cityZ(frame);
  const lift = cityLift(frame);
  const cityOn = cityGone(frame) < 0.999;
  // under a lifted city: its own far land (a long hazy rise), so it stands on ground beyond the hills, never floats
  if (cityOn && lift > 40) {
    const zP = K(cz) + 9000;
    const haze = A.screenAir(A.P.opts.eyeY - 30 / A.k);
    const col = mixHex(mixHex(mixHex(RMAT.grass.mid, RMAT.grassDry.lit, 0.45), haze, c01(cityFog(frame) + 0.3)), FAR_LAND, 0.45);
    const top: string[] = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const X = CITY_X - 62000 + 128000 * u;
      const Hh = lift * 1.04 * s5(0, 0.24, u) * (1 - s5(0.78, 1, u)) * (0.94 + 0.06 * Math.sin(u * 13 + 1));
      const q = A.P.p(X, -Hh, zP);
      top.push(`${n2(q[0])},${n2(q[1])}`);
    }
    const b0 = A.P.p(CITY_X + 66000, lift * 0.12, zP);
    const b1 = A.P.p(CITY_X - 62000, lift * 0.12, zP);
    items.push({ Z: K(cz) - 1000, node: <path key="cityland" d={`M${top.join("L")}L${n2(b0[0])},${n2(b0[1])}L${n2(b1[0])},${n2(b1[1])}Z`} fill={col} /> });
  }
  // the skyline's relative shrink per frame (its facade patterns fade while it is fast enough to strobe)
  const skyW = (g: number) => (CITY_W * camAt(g).C) / (cityZ(g) - camAt(g).Z);
  const rel = Math.abs(skyW(frame + 1) - skyW(frame - 1)) / 2 / skyW(frame);
  if (cityOn) items.push({ Z: K(cz) - 2000, node: <AustinCity key="city" A={A} o={[CITY_X, lift, K(cz)]} tone={cityTone(A, frame)} frame={frame} uid="ac" rel={rel} /> });

  // the cattle guard, set in the highway's left fence line
  const gH = TH(GUARD_AT[0], GUARD_AT[1]);
  items.push({ Z: K(guardCut), node: <CattleGuard key="gb" A={A} X={GUARD_AT[0]} Z={K(GUARD_AT[1])} H={gH} across={HWY_DIR} uid="cg" part="bed" /> });
  for (const sd of [-1, 1] as const) {
    // each side's corner and brace posts, keyed at their own nearest post
    const zs = [460, 1100].map((u) => GUARD_AT[1] + HWY_DIR[1] * sd * u);
    items.push({ Z: K(Math.min(...zs)) - 40, node: <CattleGuard key={`gp${sd}`} A={A} X={GUARD_AT[0]} Z={K(GUARD_AT[1])} H={gH} across={HWY_DIR} uid={`cgp${sd}`} part="posts" side={sd} /> });
  }

  items.push({
    Z: carKey,
    node: <Sedan key="car" A={A} o={[car.X, car.H, K(car.Z)]} heading={car.heading} up={car.up} roll={car.roll} steer={car.steer} bounce={car.bounce} mat={CAR_MAT.blueGrey} uid="car" />,
  });
  // its dust on the caliche
  dustAt(frame).forEach((p, i) => {
    if (K(p.Z) < A.P.zNear + 100) return;
    items.push({ Z: K(p.Z) - 300, node: <DustPuffs key={`d${p.seed}`} A={A} puffs={[{ ...p, Z: K(p.Z) }]} uid={`du${p.seed}`} life={DUST_LIFE} amount={0.85 * p.amt} /> });
    void i;
  });

  // the second half: everything beyond FLAT_Z0 goes as the far ridge rows come up out of the haze (FLAT_IN), except
  // the far plain (re-toned to their haze)
  const fin = flatIn(frame);
  const zFar = K(FLAT_Z0) - 300;
  const kept: Item[] =
    fin <= 0
      ? items
      : items.flatMap((it) => {
          if (it.Z <= zFar || (it.node as React.ReactElement).key === "plain") return [it];
          if (fin >= 0.999) return [];
          return [{ Z: it.Z, node: <g key={`ff${it.Z}`} opacity={n2(1 - fin)}>{it.node}</g> }];
        });
  kept.push(...farRowItems(W));
  // far to near (stable: slices were pushed first)
  kept.sort((a, b) => b.Z - a.Z);

  return { A, cam, items: kept, car };
};

/** cut 59's land haze for the second half: the far rows' pale grey-green carried up from the horizon into the sky,
 *  so the farthest rows dissolve into it and the teal of the air never sits on the land */
const LandHaze: React.FC<{ A: AirWorld; op: number }> = ({ A, op }) => {
  if (op < 0.005) return null;
  const k = A.cam.k;
  const y0 = A.P.opts.eyeY;
  const up = 340 / k;
  const x0 = A.cam.cx - 700 / k;
  const w = 1400 / k;
  return (
    <g opacity={n2(op)}>
      <defs>
        <linearGradient id="lhz" gradientUnits="userSpaceOnUse" x1="0" y1={n2(y0 - up)} x2="0" y2={n2(y0 + 2 / k)}>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((o) => (
            <stop key={o} offset={o} stopColor={FAR_HAZE} stopOpacity={Math.min(1, Math.pow(o, 1.6) * (3 - 2 * o)).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={n2(x0)} y={n2(y0 - up)} width={n2(w)} height={n2(up + 2 / k)} fill="url(#lhz)" />
    </g>
  );
};

const FarOutOfAustin: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { A, cam, items } = sceneAt(frame);
  return (
    <AirStage v={A.v} shafts={0.5 * (1 - s5(150, 236, frame))} shaftsBehind motes={0} bloom={0.14}>
      <WorldSvg cam={cam}>
        <AirHorizonHazeW A={A} id="hz" />
        <LandHaze A={A} op={0.5 * flatIn(frame)} />
        {items.map((it, i) => (
          <React.Fragment key={i}>{it.node}</React.Fragment>
        ))}
      </WorldSvg>
    </AirStage>
  );
};

export default FarOutOfAustin;
export { s5 };
