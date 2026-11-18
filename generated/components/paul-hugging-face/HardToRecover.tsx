// ---------------------------------------------------------------------------
// HardToRecover (paul-hugging-face, cut 5.005-8.425, deliver 5_HardToRecover.mov). Look C "Graphite air" on the
// clip's shared world (hfWorld.tsx; notes/BRIEF_G.md). Opaque 1080x1920, 23.976 fps, 82 frames.
//
// CHECK LINE: if the AIs did this at scale, their orange would cover the whole world and we could not take it back.
//
// THE LINE: "I think it would be hard for humanity to recover, most likely." (just before: "How bad would that be?")
// WORD -> FRAME: think f1 · would f8 · hard f14 · for f23 · humanity f32 · to f43 · recover f50 · most f62 · likely f69
//   (Whisper runs ~5-9 f early: land on/after)
// DURATION: the slot 5.005 -> 8.425 s = 3.420 s x 23.976 = 82 frames (f0..f81).
//
// THE MOTION (one eased pull-back over all 82 frames, still moving at f81): open CLOSE on four cute orange robots
//   standing on the top of one clay globe (eastern Europe), a small orange patch lit around them, the globe's curved
//   horizon behind them; the camera pulls back and rises, revealing the whole globe floating over the grid floor, its
//   slow steady spin carrying the land round. Orange routes leave the lit land across the pale sea, and where each
//   lands a new front opens (f4-30); the fronts spread over the land like ink in paper, a bright edge leading, tiny
//   robots popping up inside them. "humanity ... recover": the last off-white land, a patch in central Africa with a
//   few tiny clay houses, is squeezed between two fronts and goes orange (f50-58). By f65 the visible land is all
//   orange and the sea warms to a pale orange; the globe glows softly, the camera still drifting back.
// Orange = the AIs and what they took (as in every cut); the globe is the people's off-white clay world.
//
// SET (metres, world): the globe at C = (0, 2.5, 0), radius 2.0 (it floats 0.5 m over the floor; a soft contact
//   shadow under it), its axis tilted 35 deg away from the camera, so the world top is 55N on the facing meridian;
//   spin 0.25 deg/frame (the facing longitude 25E -> 5E). The globe is drawn by its own true-perspective projection
//   (d3-geo with a vertical-perspective raw: the camera's distance from C sets the visible cap), placed at C's
//   projection; robots, houses and routes go through the same projection. Robots 0.25 m (the first four) and
//   0.11 m (the pop-ups); anything on the far side or off frame is not drawn.
//   Camera yaw 0, pitch 0.27 -> 0.44, dist 2.75 (on the robots) -> ~9.5 (on C); SCREEN_DY applies.
//
// SOURCES: land = Natural Earth 1:110m via world-atlas (generated/components/rsi-ten-earths/tenEarthsGlobeData.ts,
//   imported read-only). Nothing numeric on screen; no text.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
// @ts-expect-error untyped module
import { geoArea, geoContains, geoInterpolate, geoPath, geoProjection, geoRotation } from "d3-geo";
import { BOT_POSES, Bot, type BotPose } from "../rsi-ten-earths/tenEarthsBot";
import { LAND } from "../rsi-ten-earths/tenEarthsGlobeData";
import { ACCENT, FloorShadow, GRAPHITE, HfStage, MATS, Svg, add, mixHexL, mul, n2, ramp, sub, worldAt, type CamKey, type V3, type World } from "./hfWorld";

export const FPS = 24000 / 1001;
export const DURATION = 82;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const D2R = Math.PI / 180;
// ---- the globe in the world ----
export const C: V3 = [0, 2.5, 0];
export const RG = 2.0;
const TAU = 35 * D2R;
const NAX: V3 = [0, Math.cos(TAU), Math.sin(TAU)]; // north
const AAX: V3 = [0, Math.sin(TAU), -Math.cos(TAU)]; // lon' 0 on the equator (toward the camera)
const BAX: V3 = [1, 0, 0]; // east
const SIGMA0 = -25;
/** the spin (deg): a place's world longitude is lon + sigma */
export const sigma = (f: number) => SIGMA0 + 0.25 * f;
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
/** a place's world direction from C at frame f */
export const dirOf = (lon: number, lat: number, f: number): V3 => {
  const l = (lon + sigma(f)) * D2R;
  const p = lat * D2R;
  return add(add(mul(AAX, Math.cos(p) * Math.cos(l)), mul(BAX, Math.cos(p) * Math.sin(l))), mul(NAX, Math.sin(p)));
};

// ---- the AIs' seeds: where each front starts, when, how fast; the route that carries it there ----
type Seed = { lon: number; lat: number; t0: number; v: number; from?: number; ph: number };
export const SEEDS: Seed[] = [
  { lon: 24, lat: 53, t0: -26, v: 0.34, ph: 0.3 }, // 0 eastern Europe: the robots
  { lon: 100, lat: 42, t0: 4, v: 0.62, from: 0, ph: 1.7 }, // 1 Asia
  { lon: -76, lat: 41, t0: 8, v: 0.6, from: 0, ph: 2.9 }, // 2 North America
  { lon: 6, lat: 22, t0: 12, v: 0.5, from: 0, ph: 4.1 }, // 3 Sahara
  { lon: -50, lat: -9, t0: 17, v: 0.62, from: 2, ph: 5.3 }, // 4 Brazil
  { lon: 78, lat: 21, t0: 16, v: 0.55, from: 1, ph: 0.9 }, // 5 India
  { lon: 38, lat: -14, t0: 24, v: 0.56, from: 5, ph: 2.2 }, // 6 east Africa
  { lon: 134, lat: -25, t0: 22, v: 0.6, from: 1, ph: 3.6 }, // 7 Australia
  { lon: -102, lat: 56, t0: 14, v: 0.62, from: 2, ph: 4.8 }, // 8 Canada
  { lon: -66, lat: -36, t0: 28, v: 0.62, from: 4, ph: 1.1 }, // 9 Argentina
  { lon: 45, lat: 28, t0: 6, v: 0.5, from: 0, ph: 3.2 }, // 10 Arabia
];
/** the last off-white land: houses here go orange last (f50-58) */
export const HOME: [number, number] = [21, 4];
const HOUSES: [number, number][] = [
  [21, 4],
  [19.2, 5.3],
  [23, 5.6],
  [22.4, 2.4],
  [19.6, 2.7],
];
/** the front radius (deg) of seed s at frame f before the shape noise: an eased start, then steady; from f60 a
 *  closing surge so all the visible land is taken */
export const rho = (s: Seed, f: number) => {
  const x = f - s.t0;
  if (x <= 0) return 0;
  const base = s.v * ((x * x) / (x + 5));
  return base + 3.2 * Math.pow(Math.max(0, f - 58), 1.5) * 0.25;
};
/** the shape: lobes by bearing, drifting slowly (ink in paper) */
const lobe = (s: Seed, th: number, f: number) => 1 + 0.17 * (0.6 * Math.sin(3 * th + s.ph + 0.01 * f) + 0.4 * Math.sin(5 * th + 2.1 * s.ph) + 0.25 * Math.sin(9 * th + 3.3 * s.ph - 0.02 * f));
const gdist = (a: [number, number], b: [number, number]) => {
  const [l1, p1] = [a[0] * D2R, a[1] * D2R];
  const [l2, p2] = [b[0] * D2R, b[1] * D2R];
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2;
  return (2 * Math.asin(Math.min(1, Math.sqrt(h)))) / D2R;
};
const bearing = (a: [number, number], b: [number, number]) => {
  const [l1, p1] = [a[0] * D2R, a[1] * D2R];
  const [l2, p2] = [b[0] * D2R, b[1] * D2R];
  return Math.atan2(Math.sin(l2 - l1) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(l2 - l1));
};
/** THE SQUEEZE: from f26 the orange also closes in from everywhere on the last land around HOME: everything farther
 *  than this radius (deg, lobed) from HOME is orange: ~36 deg at f40, ~10 at f50, closed at f58 */
export const SQ: Seed = { lon: HOME[0], lat: HOME[1], t0: 0, v: 0, ph: 2.6 };
export const squeezeR = (f: number) => (f <= 24 ? 100 : f >= 58 ? 0 : 100 * Math.pow((58 - f) / 34, 1.6));
const squeezed = (pt: [number, number], f: number) => {
  const r = squeezeR(f);
  if (r >= 99) return false;
  if (r <= 0) return true;
  return gdist(HOME, pt) > r * lobe(SQ, bearing(HOME, pt), f);
};
/** is a place orange at frame f? */
export const covered = (pt: [number, number], f: number) =>
  squeezed(pt, f) ||
  SEEDS.some((s) => {
    const r = rho(s, f);
    if (r <= 0) return false;
    const d = gdist([s.lon, s.lat], pt);
    return d <= r * lobe(s, bearing([s.lon, s.lat], pt), f);
  });
/** the first frame a place is orange (99 = never in the cut) */
export const coverFrame = (pt: [number, number]) => {
  for (let f = -30; f < 99; f++) if (covered(pt, f)) return f;
  return 99;
};
/** a front's outline as a GeoJSON polygon (wound for d3: the small side inside; outside = the complement) */
export const frontPoly = (s: Seed, f: number, r = rho(s, f), outside = false) => {
  const ring: [number, number][] = [];
  const n = 96;
  const [l1, p1] = [s.lon * D2R, s.lat * D2R];
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * 2 * Math.PI;
    const d = Math.min(175, r * lobe(s, th, f)) * D2R;
    const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(th));
    const l2 = l1 + Math.atan2(Math.sin(th) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
    ring.push([l2 / D2R, p2 / D2R]);
  }
  ring[n] = ring[0];
  let poly = { type: "Polygon", coordinates: [ring] };
  // wind so the polygon is the cap around the seed (not "the smaller side": caps past 90 deg are the larger side)
  if (geoArea(poly) > 2 * Math.PI) poly = { type: "Polygon", coordinates: [ring.slice().reverse()] };
  if (!geoContains(poly, [s.lon, s.lat])) poly = { type: "Polygon", coordinates: [poly.coordinates[0].slice().reverse()] };
  if (outside) poly = { type: "Polygon", coordinates: [poly.coordinates[0].slice().reverse()] };
  return poly;
};

// ---- the pop-up robots: land places in a deterministic scatter, each popping a few frames after its front ----
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
type Pop = { lon: number; lat: number; f: number; v: number; yaw: number };
const POPS: Pop[] = (() => {
  const out: Pop[] = [];
  for (let i = 0; out.length < 120 && i < 4000; i++) {
    const lon = -180 + 360 * rnd(i);
    const lat = (Math.asin(2 * rnd(i + 9000) - 1) / D2R) * 0.92;
    if (lat < -56 || lat > 72) continue;
    if (!geoContains(LAND, [lon, lat])) continue;
    if (gdist([lon, lat], HOME) < 4.5) continue;
    if (gdist([lon, lat], [24, 52]) < 5) continue;
    const fc = coverFrame([lon, lat]);
    if (fc > 76) continue;
    out.push({ lon, lat, f: Math.max(-2, fc) + 3 + 4 * rnd(i + 77), v: Math.floor(rnd(i + 5) * 6), yaw: (rnd(i + 13) - 0.5) * 1.2 });
  }
  return out;
})();
const HOUSE_F = HOUSES.map((h) => coverFrame(h));
/** the first four robots on the top of the globe (eastern Europe), back to front */
const CREW: { lon: number; lat: number; v: number; yaw: number; seed: number }[] = [
  { lon: 24.5, lat: 57.2, v: 2, yaw: 0.35, seed: 3 },
  { lon: 17.5, lat: 54.6, v: 1, yaw: 0.5, seed: 1 },
  { lon: 31.5, lat: 54.4, v: 4, yaw: -0.5, seed: 4 },
  { lon: 24.0, lat: 51.4, v: 0, yaw: -0.1, seed: 2 },
];
const CREW_H = 0.25;
const POP_H = 0.11;

// the camera: one eased pull-back from the robots to the whole globe, rising a little (pitch 0.27 -> 0.44); the
// post-roll key keeps it moving through f81
const crewWorld = add(C, mul(dirOf(24, 54.5, 0), RG + 0.13));
export const KEYS: CamKey[] = [
  { f: -14, target: crewWorld, dist: 2.55, yaw: 0, pitch: 0.26, F: 1750, sy: 650 },
  { f: 8, target: add(crewWorld, [0, -0.06, 0.0]), dist: 3.1, yaw: 0, pitch: 0.29, F: 1750, sy: 650 },
  { f: 52, target: [0, 2.95, 0.15], dist: 8.2, yaw: 0, pitch: 0.42, F: 1750, sy: 640 },
  { f: 104, target: [0, 2.5, 0], dist: 10.6, yaw: 0, pitch: 0.45, F: 1750, sy: 640 },
];

/** the globe's view for a world camera: the facing place, the cap, and a projector (deg in, screen px out) */
const globeView = (W: World, f: number) => {
  const e0 = sub(W.pos, C);
  const D = len(e0);
  const e = mul(e0, 1 / D);
  const P = D / RG;
  const latV = Math.asin(Math.max(-1, Math.min(1, dot(e, NAX)))) / D2R;
  const lonV = Math.atan2(dot(e, BAX), dot(e, AAX)) / D2R - sigma(f);
  const [cx, cy] = W.project(C);
  const F = W.F;
  const raw = (l: number, p: number) => {
    const cl = Math.cos(p);
    const k = 1 / (P - cl * Math.cos(l));
    return [cl * Math.sin(l) * k, Math.sin(p) * k];
  };
  const cap = Math.acos(1 / P) / D2R;
  const proj = geoProjection(raw)
    .rotate([-lonV, -latV, 0])
    .clipAngle(cap - 0.05)
    .scale(F)
    .translate([cx, cy])
    .precision(0.4);
  const rot = geoRotation([-lonV, -latV, 0]);
  /** a place lifted h metres off the surface: screen point, its facing (cos from the view centre) and its depth (m) */
  const at = (lon: number, lat: number, h = 0) => {
    const [l, p] = rot([lon, lat]).map((v: number) => v * D2R);
    const s = 1 + h / RG;
    const ux = Math.cos(p) * Math.sin(l);
    const uy = Math.sin(p);
    const uz = Math.cos(p) * Math.cos(l);
    const k = F / (P - s * uz);
    return { x: cx + s * ux * k, y: cy - s * uy * k, front: uz, depth: RG * (P - s * uz) };
  };
  const rs = F / Math.sqrt(P * P - 1);
  return { proj, path: geoPath(proj), at, cx, cy, rs, P, F, lonV, latV, minFront: 1 / P };
};

const HardToRecover: React.FC<z.infer<typeof schema>> = () => {
  const fr = useCurrentFrame();
  const W = worldAt(KEYS, fr);
  const G = globeView(W, fr);
  const { cx, cy, rs } = G;
  const t = (hex: string) => W.tone(hex, C);
  const tO = (hex: string) => W.toneO(hex, C);

  // ---- the land and the fronts ----
  const landD = G.path(LAND) ?? "";
  const live = SEEDS.filter((s) => rho(s, fr) > 0.3);
  const fronts = live.map((s) => G.path(frontPoly(s, fr)) ?? "").filter((d) => d.length > 0);
  // the squeeze: the orange outside a shrinking ring round the last land (all of it once the ring closes)
  const sqR = squeezeR(fr);
  if (sqR <= 0.2) fronts.push(landD);
  else if (sqR < 99) fronts.push(G.path(frontPoly(SQ, fr, sqR, true)) ?? "");
  const seaWarm = ramp(fr, 56, 74);
  const glow = 0.45 + 0.35 * ramp(fr, 55, 75);
  // routes: from the parent seed to the new one, drawn over the 9 frames before the front opens there
  const routes = SEEDS.map((s, i) => {
    if (s.from === undefined) return null;
    const a = SEEDS[s.from];
    const p = ramp(fr, s.t0 - 9, s.t0);
    if (p <= 0) return null;
    const ip = geoInterpolate([a.lon, a.lat], [s.lon, s.lat]);
    const n = 40;
    const pts = Array.from({ length: Math.max(2, Math.ceil(n * p) + 1) }, (_, j) => ip(Math.min(p, j / n)));
    const d = G.path({ type: "LineString", coordinates: pts }) ?? "";
    const head = G.at(...(ip(p) as [number, number]));
    return { d, head: p < 1 && head.front > G.minFront ? head : null, key: i };
  }).filter((q): q is NonNullable<typeof q> => q !== null);
  const routeW = Math.max(1.2, (0.022 * G.F) / (RG * G.P));

  // ---- robots and houses (culled: far side and off frame) ----
  type Fig = { depth: number; el: React.ReactNode };
  const figs: Fig[] = [];
  const upright = (lon: number, lat: number, h: number) => {
    const a = G.at(lon, lat, 0);
    const b = G.at(lon, lat, h);
    const ang = (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;
    const px = (G.F * h) / a.depth;
    return { a, ang, px };
  };
  const onFrame = (x: number, y: number, m: number) => x > -m && x < 1080 + m && y > -m && y < 1920 + m;
  const fogA = W.fog(C) * 0.85;
  const fogRGB = W.airHex(C);
  const botEl = (key: string, lon: number, lat: number, h: number, variant: number, pose: BotPose, grow = 1) => {
    const { a, ang, px } = upright(lon, lat, h);
    if (a.front < G.minFront + 0.01 || !onFrame(a.x, a.y, px * 1.5)) return;
    const hp = px * grow;
    if (hp < 0.8) return;
    let el: React.ReactNode;
    if (hp >= 20) {
      el = <Bot variant={variant} pose={pose} at={[a.x, a.y]} scale={hp / 250} uid={key} frame={fr} fog={{ rgb: fogRGB, amount: fogA }} unitPx={1} />;
    } else {
      // a mini robot: body, head with its dark screen, a cream lit edge (reads as a tiny robot at a few px)
      const u = hp / 10;
      el = (
        <g>
          <rect x={n2(-1.9 * u)} y={n2(-5.2 * u)} width={n2(3.8 * u)} height={n2(4.4 * u)} rx={n2(1.1 * u)} fill={t(MATS.orange.mid)} stroke={t(MATS.orange.dark)} strokeWidth={n2(0.35 * u)} />
          <rect x={n2(-2.6 * u)} y={n2(-10 * u)} width={n2(5.2 * u)} height={n2(4.4 * u)} rx={n2(1.2 * u)} fill={t(MATS.orange.lit)} stroke={t(MATS.orange.dark)} strokeWidth={n2(0.35 * u)} />
          <rect x={n2(-1.8 * u)} y={n2(-9.2 * u)} width={n2(3.6 * u)} height={n2(2.8 * u)} rx={n2(0.8 * u)} fill={t("#2D4A47")} />
          <rect x={n2(-1.4 * u)} y={n2(-0.9 * u)} width={n2(1 * u)} height={n2(0.9 * u)} fill={t(MATS.orange.dark)} />
          <rect x={n2(0.4 * u)} y={n2(-0.9 * u)} width={n2(1 * u)} height={n2(0.9 * u)} fill={t(MATS.orange.dark)} />
        </g>
      );
      el = <g transform={`translate(${n2(a.x)} ${n2(a.y)})`}>{el}</g>;
      figs.push({ depth: a.depth, el: <g key={key} transform={`rotate(${n2(ang)} ${n2(a.x)} ${n2(a.y)})`}>{el}</g> });
      return;
    }
    figs.push({ depth: a.depth, el: <g key={key} transform={`rotate(${n2(ang)} ${n2(a.x)} ${n2(a.y)})`}>{el}</g> });
  };
  CREW.forEach((c, i) => {
    const pose = BOT_POSES.turnTo(c.yaw, fr, c.seed);
    botEl(`crew${i}`, c.lon, c.lat, CREW_H, c.v, pose);
  });
  POPS.forEach((q, i) => {
    const g = ramp(fr, q.f, q.f + 6);
    if (g <= 0) return;
    const e = 1 - (1 - g) * (1 - g);
    botEl(`pop${i}`, q.lon, q.lat, POP_H, q.v, BOT_POSES.turnTo(q.yaw, fr, i), e);
  });
  // the houses: tiny clay houses (walls + roof), turning orange as the last front closes over them
  const homeUp = upright(HOME[0], HOME[1], 0.085).ang; // one shared 'up' (near the view centre the normals foreshorten)
  HOUSES.forEach((h, i) => {
    const { a, px } = upright(h[0], h[1], 0.085);
    const ang = homeUp;
    if (a.front < G.minFront + 0.01 || !onFrame(a.x, a.y, 60)) return;
    const o = ramp(fr, HOUSE_F[i] - 1, HOUSE_F[i] + 4);
    const wall = mixHexL(t(MATS.clay.lit), tO(MATS.orange.mid), o);
    const roof = mixHexL(t("#B9AE9F"), tO(MATS.orange.dark), o);
    const u = px / 10;
    figs.push({
      depth: a.depth,
      el: (
        <g key={`h${i}`} transform={`rotate(${n2(ang)} ${n2(a.x)} ${n2(a.y)}) translate(${n2(a.x)} ${n2(a.y)})`}>
          <rect x={n2(-4 * u)} y={n2(-6 * u)} width={n2(8 * u)} height={n2(6 * u)} fill={wall} stroke={t(GRAPHITE.shadow)} strokeOpacity={0.5} strokeWidth={n2(0.4 * u)} />
          <path d={`M${n2(-5 * u)},${n2(-5.6 * u)}L0,${n2(-10.5 * u)}L${n2(5 * u)},${n2(-5.6 * u)}Z`} fill={roof} stroke={t(GRAPHITE.shadow)} strokeOpacity={0.5} strokeWidth={n2(0.4 * u)} strokeLinejoin="round" />
          <rect x={n2(-1 * u)} y={n2(-3.2 * u)} width={n2(2 * u)} height={n2(3.2 * u)} fill={mixHexL(t("#8E857A"), tO(MATS.orange.dark), o)} />
        </g>
      ),
    });
  });
  figs.sort((p, q) => q.depth - p.depth);

  // ---- the globe's shading (screen) ----
  const lx = cx - 0.38 * rs;
  const ly = cy - 0.42 * rs;
  const seaLit = t("#ECE7DE");
  const seaMid = t("#D3CCC0");
  const seaDark = t("#ABA397");
  const warm = mixHexL(t(GRAPHITE.cream), tO(ACCENT), 0.66);
  const landLit = t("#CFC5B5");
  const landDark = t("#9C9282");

  return (
    <HfStage
      W={W}
      floor={{ pool: [0, 0, 0.5], poolR: 6, oz: 0.1 }}
      shadows={<FloorShadow W={W} pts={Array.from({ length: 24 }, (_, i) => [Math.cos((i / 24) * 2 * Math.PI) * 1.45, 0, Math.sin((i / 24) * 2 * Math.PI) * 1.45] as V3)} uid="gS" soft={0.9} reach={1.2} amt={0.85} />}
    >
      <Svg id="globe" glow={glow}>
        <defs>
          <radialGradient id="seaG" gradientUnits="userSpaceOnUse" cx={n2(lx)} cy={n2(ly)} r={n2(1.75 * rs)}>
            <stop offset="0" stopColor={seaLit} />
            <stop offset="0.5" stopColor={seaMid} />
            <stop offset="1" stopColor={seaDark} />
          </radialGradient>
          <radialGradient id="landG" gradientUnits="userSpaceOnUse" cx={n2(lx)} cy={n2(ly)} r={n2(1.75 * rs)}>
            <stop offset="0" stopColor={landLit} />
            <stop offset="1" stopColor={landDark} />
          </radialGradient>
          <radialGradient id="orG" gradientUnits="userSpaceOnUse" cx={n2(lx)} cy={n2(ly)} r={n2(1.75 * rs)}>
            <stop offset="0" stopColor={tO(MATS.orange.lit)} />
            <stop offset="0.55" stopColor={tO(MATS.orange.mid)} />
            <stop offset="1" stopColor={tO(MATS.orange.dark)} />
          </radialGradient>
          <radialGradient id="shadeG" gradientUnits="userSpaceOnUse" cx={n2(lx)} cy={n2(ly)} r={n2(1.7 * rs)}>
            <stop offset="0.45" stopColor={GRAPHITE.shadow} stopOpacity={0} />
            <stop offset="1" stopColor={GRAPHITE.shadow} stopOpacity={0.32} />
          </radialGradient>
          <linearGradient id="rimG" gradientUnits="userSpaceOnUse" x1={n2(cx - rs)} y1={n2(cy - rs)} x2={n2(cx + 0.4 * rs)} y2={n2(cy + 0.4 * rs)}>
            <stop offset="0" stopColor={GRAPHITE.cream} stopOpacity={0.95} />
            <stop offset="0.6" stopColor={GRAPHITE.cream} stopOpacity={0} />
          </linearGradient>
          <clipPath id="landC">
            <path d={landD} />
          </clipPath>
        </defs>
        {/* the sea, warming to pale orange at the end */}
        <circle cx={n2(cx)} cy={n2(cy)} r={n2(rs)} fill="url(#seaG)" />
        {seaWarm > 0 ? <circle cx={n2(cx)} cy={n2(cy)} r={n2(rs)} fill={warm} opacity={n2(0.88 * seaWarm)} /> : null}
        {/* the land, raised: a ledge shadow, the land, its coast */}
        <path d={landD} transform={`translate(${n2(0.006 * rs)} ${n2(0.009 * rs)})`} fill={t(GRAPHITE.shadow)} opacity={0.32} />
        <path d={landD} fill="url(#landG)" />
        <path d={landD} fill="none" stroke={landDark} strokeOpacity={0.55} strokeWidth={n2(Math.max(0.6, 0.0025 * rs))} strokeLinejoin="round" />
        {/* the core shadow on the sphere (lower right) */}
        <circle cx={n2(cx)} cy={n2(cy)} r={n2(rs)} fill="url(#shadeG)" />
        {/* the fronts on the land: a bright leading edge (the strokes' outer halves), then the orange */}
        <g clipPath="url(#landC)">
          {fronts.map((d, i) => (
            <path key={`e${i}`} d={d} fill="none" stroke={tO(MATS.orange.lit)} strokeWidth={n2(Math.max(2, 0.03 * rs))} strokeLinejoin="round" opacity={0.85} />
          ))}
          {fronts.map((d, i) => (
            <path key={`f${i}`} d={d} fill="url(#orG)" />
          ))}
        </g>
        {/* the routes over the sea */}
        {routes.map((q) => (
          <g key={q.key}>
            <path d={q.d} fill="none" stroke={tO(ACCENT)} strokeWidth={n2(routeW)} strokeLinecap="round" opacity={0.95} />
            {q.head ? <circle cx={n2(q.head.x)} cy={n2(q.head.y)} r={n2(routeW * 1.6)} fill={tO(MATS.orange.lit)} /> : null}
          </g>
        ))}
        {/* the cream rim on the upper-left limb */}
        <circle cx={n2(cx)} cy={n2(cy)} r={n2(rs - Math.max(1, 0.006 * rs))} fill="none" stroke="url(#rimG)" strokeWidth={n2(Math.max(1.5, 0.012 * rs))} />
      </Svg>
      <Svg id="figs" glow={0.35}>
        {figs.map((q) => q.el)}
      </Svg>
    </HfStage>
  );
};

export default HardToRecover;
