// ---------------------------------------------------------------------------
// FarOutOfAustin (robert-johnson-ranch, cut 6, take 2; replaces DriveOutOfAustin). Dwarkesh 3D style
// (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 322 frames.
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
// slows, the camera eases down and in as the cattle guard on the driver's left comes into frame (f125-140), the car
// turns left through it, rolling over the pipes, onto the pale caliche road; the road turns left again (f213-219) and
// winds east along the foot of the hills while the camera cranes up and back in one rise, until the farm of cut 26
// slides in and the car pulls up beside the house on FARM (f303); the Capitol's dome is a faint shape on the far
// horizon. A MILES FROM AUSTIN readout counts 0 (the edge of town) -> 22 (the guard) -> 44 (the farm).
// Orange = the old woman's shawl on the porch, the one orange thing; everything else muted earth and air.
//
// DEPTH: farOutPlan's world (178 units/m), the camera 1.3-4.7 k units over its target, 5.7-12 k behind it; the kit
// sees it through a fixed Dc = 6000 (kit Z = world Z - camera Z - Dc), fog by the eye's distance (RANCH_SCENE, longer
// visibility). The city is a picture-book cheat: it recedes along the highway's line faster than the car drives
// (farOutPlan.cityZ), so it shrinks from the full frame width to a tiny skyline while staying on the flat plain.
//
// SOURCES: the Texas Capitol (Austin, 1888: a dome on a colonnaded drum, the Goddess of Liberty statue with a raised
// star, long wings, pink granite), US 290 west out of Austin into the Hill Country, cattle guards (steel pipes over a
// pit in a ranch fence line), caliche ranch roads: general knowledge; the line and the distances are the speaker's.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { AirHorizonHazeW, AirStage, WorldSvg, mixHex, swayCam, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { FIG_W, FarmWoman, FolkShadowW, RockingChair, elevOf, farmWomanPose } from "./ranchFolk";
import { FARM, FarmHouse, FencePost, LiveOak, CedarBush, RMAT, U, Windmill, cam3, ranchAirOf, type Item } from "./ranchWorld";
import { CAR_MAT, CattleGuard, DustPuffs, Sedan, type Puff } from "./farOutCar";
import { AustinCity } from "./farOutCity";
import { c01, lerp, sstep, n2, type Toner } from "./farOutFaces";
import { fenceItems, fencePosts, highwayFences, landItems, roadItems, treeItems, tuftItems, type FenceSpec, type Seg, type World } from "./farOutGround";
import { CITY_W, CITY_X, DURATION as PLAN_DURATION, FARM_X, FARM_Z, FPS as PLAN_FPS, GUARD_AT, HWY_DIR, TH, camAt, carAt, cityFog, cityLift, cityZ, s5 } from "./farOutPlan";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400"], subsets: ["latin"] });
const DC0 = 6000;
const SCENE = { fogNear: 1500, fogVis: 36000, fogMax: 0.88 };

// ---- the farm (cut 26's set, moved to FARM: its local (x, z) -> world (FARM_X + x, FARM_Z - 400 + z)) ------------
const fx = (x: number) => FARM_X + x;
const fz = (z: number) => FARM_Z - 400 + z;
const WOMAN = { X: fx(-430), Z: fz(570) };
const MILL = { X: fx(-2300), Z: fz(450) };
const OAK = { X: fx(900), Z: fz(1950), size: 5.2 * U };
const CEDARS = [
  { X: fx(-2300), Z: fz(1200), seed: 3 },
  { X: fx(2100), Z: fz(1600), seed: 7 },
];
const GATE = { X: fx(-310), Z: fz(-100), half: 510 };
const CHAIR_W = 1.12;
const YARD_FENCES: FenceSpec[] = [
  { pts: [[fx(-3400), fz(-140)], [GATE.X - GATE.half, GATE.Z]], spacing: 420, seed: 11 },
  { pts: [[GATE.X + GATE.half, GATE.Z], [fx(3400), fz(-40)]], spacing: 420, seed: 13 },
];

// ---- the camera's keep-out lines for the trees (camera ground point -> car, every 4 frames) ----------------------
const KEEP: Seg[] = (() => {
  const out: Seg[] = [];
  for (let f = -8; f <= DURATION + 4; f += 4) {
    const c = camAt(f);
    const k = carAt(f);
    out.push({ a: [c.X, c.Z, c.E], b: [k.X, k.Z, k.H + 120] });
    if (f >= 116 && f <= 210) out.push({ a: [c.X, c.Z, c.E], b: [GUARD_AT[0], GUARD_AT[1], TH(GUARD_AT[0], GUARD_AT[1]) + 100] });
    if (f >= 250) out.push({ a: [c.X, c.Z, c.E], b: [FARM_X, FARM_Z + 500, TH(FARM_X, FARM_Z) + 200] });
    // the sight lines to the skyline on the highway leg (it fills the frame's width early): no tree crowns across it
    if (f <= 124) for (let x = 0; x <= 1080; x += 135) out.push({ a: [c.X, c.Z, c.E], b: [c.X + ((x - 540) * 30000) / c.C, c.Z + 30000, c.E - 30] });
    // later, the lines to the small skyline's base on its rise (no hilltop crowns across Austin)
    if (f > 124) {
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
// ---- the near set dressing: a ranch fence running from the guard toward the camera, a near oak and two cedars at the
// guard; a pasture fence from the yard toward the camera, an oak and a cedar at the edges of the last frame ------------
const FAR_LAND = "#B4BBA0";
const BUSH_LIT = { lit: "#76845A", mid: "#52603C", dark: "#3D4A33" };
const NEAR_TREES: { X: number; Z: number; kind: "oak" | "cedar"; size: number; seed: number; from: number; to: number }[] = [
  // (none in the ground the camera flies over at f110-140: what it reveals there would whip up through the frame)
  // two cedars that come in only once the camera has settled (slowly, from the left edge and from the bottom)
  { X: -600, Z: -3800, kind: "cedar", size: 2.4 * U, seed: 5, from: 100, to: 240 },
  { X: -300, Z: -4700, kind: "cedar", size: 2.2 * U, seed: 9, from: 100, to: 240 },
  { X: 2600, Z: -5200, kind: "cedar", size: 2.2 * U, seed: 12, from: 100, to: 240 },
  { X: 24900, Z: -4200, kind: "oak", size: 4.0 * U, seed: 14, from: 230, to: 400 },
  { X: 27600, Z: -3800, kind: "cedar", size: 2.4 * U, seed: 6, from: 230, to: 400 },
];
const NEAR_FENCES: FenceSpec[] = [
  { pts: [[fx(-3400), fz(-140)], [fx(-3000), fz(-4000)], [fx(-2600), fz(-8000)]], spacing: 700, seed: 23 },
];
const NEAR_FENCE_POSTS = NEAR_FENCES.map(fencePosts);
const HWY_FENCES = highwayFences();
const HWY_FENCE_POSTS = HWY_FENCES.map(fencePosts);
const YARD_POSTS = YARD_FENCES.map(fencePosts);

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

// ---- the plates (screen space, soft cream plates in the clip's ink) ----------------------------------------------
const INK = "#2E3833";
const PLATE = "#EFE6D2";
const Plate: React.FC<{ x: number; y: number; w: number; h: number; op: number; id: string }> = ({ x, y, w, h, op, id }) => (
  <g opacity={op}>
    <defs>
      <filter id={id} x="-20%" y="-40%" width="140%" height="180%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
    </defs>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h * 0.22} fill={PLATE} opacity={0.74} filter={`url(#${id})`} />
    <rect x={x - w / 2 + 6} y={y - h / 2 + 6} width={w - 12} height={h - 12} rx={h * 0.18} fill={PLATE} opacity={0.5} />
  </g>
);
const ease = (u: number) => u * u * (3 - 2 * u);
/** AUSTIN: lands on its word (f23-28) over the city, leaves with it as it falls into the haze (f88-108) */
const AustinPlate: React.FC<{ frame: number; x: number; y: number }> = ({ frame, x, y }) => {
  const u = c01((frame - 22) / 7);
  const out = sstep(88, 110, frame);
  if (u <= 0 || out >= 1) return null;
  const lift = 22 * (1 - ease(u)) + 14 * out;
  const op = ease(u) * (1 - out);
  const size = 70;
  return (
    <g transform={`translate(0 ${n2(lift)})`} opacity={op}>
      <Plate x={x} y={y} w={372} h={92} op={1} id="ap" />
      <text x={x + 0.04 * size} y={y + size * 0.33} textAnchor="middle" fill={INK} style={{ fontFamily: fellSC, fontSize: size, letterSpacing: `${0.08 * size}px` }}>
        AUSTIN
      </text>
    </g>
  );
};
/** MILES FROM AUSTIN over a lining-figure count */
const Readout: React.FC<{ frame: number; miles: number }> = ({ frame, miles }) => {
  const u = c01((frame - 30) / 8);
  if (u <= 0) return null;
  // top-left, in the sky above the skyline at every frame
  const x = 200;
  const y = 196;
  const n = Math.min(44, Math.floor(miles + 1e-6));
  return (
    <g transform={`translate(0 ${n2(20 * (1 - ease(u)))})`} opacity={ease(u)}>
      <Plate x={x} y={y} w={330} h={128} op={1} id="rp" />
      <text x={x + 1} y={y - 22} textAnchor="middle" fill={INK} opacity={0.82} style={{ fontFamily: fellSC, fontSize: 25, letterSpacing: "2.4px" }}>
        MILES FROM AUSTIN
      </text>
      <text x={x} y={y + 44} textAnchor="middle" fill={INK} style={{ fontFamily: caslon, fontSize: 64, fontVariantNumeric: "lining-nums tabular-nums", letterSpacing: "2px" }}>
        {n}
      </text>
    </g>
  );
};

/** the scene at a frame: the air, the camera and every item, sorted far to near (pure: the review scripts call it) */
export const sceneAt = (frame: number) => {
  const c = camAt(frame);
  const oz = c.Z + DC0;
  const { cam: cam0, depth } = cam3({ X: c.X, Z: -DC0, E: c.E, C: c.C, yH: c.yH });
  const cam = swayCam(cam0, frame);
  const A = ranchAirOf({ cam, depth, rest: cam0, frame, scene: SCENE });
  const W: World = { A, oz, frame };
  const K = (Z: number) => Z - oz;
  const items: Item[] = [];

  // the car (computed first: the road pieces under it key just behind it)
  const car = carAt(frame);
  const carMinZ = car.Z - Math.abs(car.heading[1]) * 520 - Math.abs(car.heading[0]) * 190;
  const carCut = carMinZ - 200;
  const carKey = K(carCut);
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
  items.push(...treeItems(W, KEEP, CAM_PATH));
  HWY_FENCES.forEach((f, i) => items.push(...fenceItems(W, f, HWY_FENCE_POSTS[i])));
  YARD_FENCES.forEach((f, i) => items.push(...fenceItems(W, f, YARD_POSTS[i], { dMax: 30000 })));
  NEAR_FENCES.forEach((f, i) => items.push(...fenceItems(W, f, NEAR_FENCE_POSTS[i], { dMax: 30000 })));
  NEAR_TREES.forEach((t, i) => {
    if (frame < t.from || frame > t.to || K(t.Z) < A.P.zNear + 300) return;
    const H = TH(t.X, t.Z) - 10;
    const uid = `nt${i}`;
    items.push({
      Z: K(t.Z) - t.size * 0.3,
      node:
        t.kind === "oak" ? (
          <LiveOak key={uid} A={A} X={t.X} Z={K(t.Z)} H={H} size={t.size} seed={t.seed} frame={frame} uid={uid} />
        ) : (
          <CedarBush key={uid} A={A} X={t.X} Z={K(t.Z)} H={H} size={t.size} seed={t.seed} frame={frame} uid={uid} mat={BUSH_LIT} rim="#B9B98E" />
        ),
    });
  });

  // the city on the plain
  const cz = cityZ(frame);
  const lift = cityLift(frame);
  // under a lifted city: its own far land (a long hazy rise), so it stands on ground beyond the hills, never floats
  if (lift > 40) {
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
  items.push({ Z: K(cz) - 2000, node: <AustinCity key="city" A={A} o={[CITY_X, lift, K(cz)]} tone={cityTone(A, frame)} frame={frame} uid="ac" /> });

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

  // the farm (cut 26's set)
  const H0 = TH(fx(0), fz(900));
  const fd = FARM_Z - c.Z;
  if (fd > 1500) {
    const wZ = K(WOMAN.Z);
    const pose = farmWomanPose(frame, { yaw: 30, elev: elevOf(c.E, H0 + FARM.floorH, WOMAN.Z - c.Z, 90), rockAmp: 4.5, rockPeriod: 2.6 });
    const seatAt = A.P.p(WOMAN.X, -(H0 + FARM.floorH), wZ);
    const figS = A.P.r(wZ) * FIG_W;
    const fog = A.folkFog(wZ, H0 + FARM.floorH);
    const glowAt = A.P.p(WOMAN.X, -(H0 + FARM.floorH + 150), wZ - 40);
    const porch = (
      <g>
        <FolkShadowW A={A} X={WOMAN.X} Z={wZ} Y={-(H0 + FARM.floorH)} kind="seated" uid="fws" />
        <RockingChair at={seatAt} scale={figS * CHAIR_W} yaw={pose.yaw} elev={pose.elev} rock={pose.rock} fog={fog} unitPx={A.k} uid="fwc" />
        <FarmWoman pose={pose} at={seatAt} scale={figS} uid="fw" fog={fog} unitPx={A.k} chair={false} />
        {/* the porch lamp's warm glow on her: the frame's one orange */}
        <circle cx={glowAt[0]} cy={glowAt[1]} r={n2(330 * A.P.r(wZ))} fill="url(#porchGlow)" />
      </g>
    );
    items.push({ Z: K(FARM_Z) - 140, node: <FarmHouse key="house" A={A} X0={FARM_X} Z0={K(FARM_Z)} H0={H0} porch={porch} /> });
    items.push({ Z: K(MILL.Z) - 160, node: <Windmill key="mill" A={A} X={MILL.X} Z={K(MILL.Z)} H={TH(MILL.X, MILL.Z)} frame={frame} /> });
    items.push({ Z: K(OAK.Z) - 300, node: <LiveOak key="oak" A={A} X={OAK.X} Z={K(OAK.Z)} H={TH(OAK.X, OAK.Z)} size={OAK.size} frame={frame} uid="oak" seed={5} /> });
    CEDARS.forEach((q, i) => items.push({ Z: K(q.Z) - 100, node: <CedarBush key={`ced${i}`} A={A} X={q.X} Z={K(q.Z)} H={TH(q.X, q.Z)} frame={frame} uid={`ced${i}`} seed={q.seed} /> }));
    for (const s of [-1, 1]) {
      const X = GATE.X + s * GATE.half;
      items.push({ Z: K(GATE.Z) - 20, node: <FencePost key={`gp${s}`} A={A} X={X} Z={K(GATE.Z)} H={TH(X, GATE.Z)} h={280} w={26} /> });
    }
  }

  // far to near (stable: slices were pushed first)
  items.sort((a, b) => b.Z - a.Z);

  const capTop = A.P.p(CITY_X, -(15000 + lift), K(cz) + 4300);
  const capX = 540 + (capTop[0] - A.cam.cx) * A.k;
  // the skyline's top (its tallest tower) on screen: AUSTIN sits just above it
  const skyTop = 960 + (A.P.p(CITY_X, -(21000 + lift), K(cz) + 2000)[1] - A.cam.cy) * A.k;
  return { A, cam, items, capX, skyTop, car };
};

const FarOutOfAustin: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { A, cam, capX, skyTop, car, items } = sceneAt(frame);
  return (
    <AirStage v={A.v} shafts={0.5} shaftsBehind motes={0.35} bloom={0.14}>
      <WorldSvg cam={cam}>
        <defs>
          <radialGradient id="porchGlow">
            <stop offset="0" stopColor="#FFB000" stopOpacity={0.62} />
            <stop offset="0.45" stopColor="#FFB000" stopOpacity={0.26} />
            <stop offset="1" stopColor="#FFB000" stopOpacity={0} />
          </radialGradient>
        </defs>
        <AirHorizonHazeW A={A} id="hz" />
        {items.map((it, i) => (
          <React.Fragment key={i}>{it.node}</React.Fragment>
        ))}
      </WorldSvg>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <AustinPlate frame={frame} x={lerp(capX, 540, 0.4)} y={Math.max(318, Math.min(640, skyTop - 78))} />
        <Readout frame={frame} miles={car.miles} />
      </svg>
    </AirStage>
  );
};

export default FarOutOfAustin;
export { s5 };
