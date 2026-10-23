// ---------------------------------------------------------------------------
// covidHaze — THE SHARED AIR of the Kyle Harper clip "Why COVID was impossible to contain" (kyle-covid): the virus as
// a faint warm cloud of air an infected person breathes ROUND HIMSELF, not a stream aimed at anyone. Built for cut 3
// (user revision 1: "much more in the atmosphere almost, a subtle cloud around him"; director pass 2: an envelope
// centred on him); cut 21 uses it for its encounters. Contract: <notes>/HAZE_READY.md.
//
// THE LOOK (orange is THE VIRUS: the clip's ORANGE RULE), three parts, all soft and slow:
//   the ENVELOPE  a feathered warm glow of air round the head and shoulders on every side (behind the head too),
//                 thickest round the face (peak alpha capped at HAZE.cap 0.24), thinning outward, with a lobe in front
//                 of the face (fuller while he talks) and a wide faint halo, so a close neighbour's face sits in its thin
//                 edge; it BUILDS with the breathed amount (smoothed over envT frames), swells a touch on each exhale,
//                 and its blobs wander a few units: no drift, no rise, nothing up at the ceiling or down the aisle;
//   the PUFFS     short-lived soft puffs at the mouth (each breath adds a little, then fades into the envelope);
//   the MOTES     sparse tiny cream-orange dots born inside the cloud (dense near him, sparse at its edge, a few in the
//                 front lobe), wandering slowly with no direction inside soft bounds (one head-height over the hat at
//                 most, low out in front, not behind him or past the lobe). Air, not smoke: never a solid mass, never a
//                 ring, never brighter than the lung glow.
//
// A PURE FUNCTION OF THE FRAME (no state; Remotion's per-frame render): puffs and motes are born at fixed fractional
// frames of the emitter's own timeline; positions are closed-form functions of age and frame.
//
// UNITS: an emitter's offsets are the cast's rig units (a man ~312 = 1.75 m; on a depth-kit camera rig units = world
// units); the output is WORLD px (the cut's svg). Up is -y.
//
// API
//   type HazeEmitter = {
//     project?(u: V3): { p, s }   DEPTH mode (a depth-kit cut, preferred): a rig-unit offset u = [x, y, z] from the
//                         anchor -> world px and the world px per unit there, e.g. for a figure with feet at (X, Z):
//                         (u) => ({ p: A.P.p(X + u[0], u[1], Z + u[2]), s: A.P.r(Z + u[2]) })  (the cloud has real
//                         depth and parallax; the anchor's Y is the floor, so mouthAt's y is the mouth height)
//     at?: P2, scale?     PLANE mode (a flat 2D cut): the anchor now in world px and world px per unit
//     mouthAt(f): P2 | V3 the mouth at frame f, rig units from the anchor: covidAnchors(kind, pose(f), [0, 0], 1).mouth
//                         (memoise it per integer frame: it is called for every puff and mote)
//     centreAt?(f)        the cloud's centre, rig units from the anchor (covidAnchors(...).headC; default: the mouth
//                         raised 18 units)
//     dirAt?(f): P2       the breath's direction at f (covidAnchors(...).mouthDir); the billow leans that way
//     amountAt(f): number how much is breathed out at f, 0..1 (the glow x the exhale rhythm (breathRhythm) x a laugh or
//                         talk); called from f - HAZE.life
//     pushAt?(f): number  how hard the breath pushes out, 0..1 (quiet ~0.3, talking / laughing ~1; default 0.5): the
//                         front lobe (and the motes in it) fills more while he talks
//     seed: number
//     opts?: Partial<HazeOpts>   per-emitter look values over HAZE
//   }
//   hazeAt(emitters, frame, o?: { avoid?, sinks?, below? }) -> { blobs: HazeBlob[]; motes: HazeMote[]; peak }
//     world px. blob { p, r, a, front }, mote { p, r, a, front, id } (id: the same mote on every frame, for checks);
//     `front` = nearer the camera than the cloud's centre (draw after the figure), else behind it (draw before: his
//     silhouette sits inside the cloud). peak = the veil's thickest alpha this frame (after the cap).
//     avoid: HazeAvoid[]  { c: P2 world px, r: world px, layer?: "front" | "all" }: motes fade out inside ~1.6 r of c (a
//       face or body the haze must never ride: the emitter's own head with "front" (its front veil thins there too, to
//       25 %), every other person's head, chest and hips with "all")
//     sinks: HazeSink[]   { c: P2 world px, r: world px, pull(f): 0..1 monotonic, from: frame }: an INHALE: the motes
//       within r of c on frame `from` are drawn into c by pull(f) and fade there (a neighbour breathing in his air)
//     below: number       a world-px row under which no mote shows (keep glints out of the caption bands)
//   breathRhythm(f, period = 96, seed = 0) 0.35..1   the out-breath (more on the exhale half)
//   <HazeCloud haze layer="back" | "front" uid fog? veil? motes? />   one layer (world px) inside WorldSvg; fog = a
//     FolkFog (A.folkFog(Z)): the haze takes half the fog, like the glow
//   HAZE   the look values (below, settled on cut 3; per emitter: opts), HAZE_COLORS { veil, moteCore, moteHalo };
//     opts.strength (default 1 = the delivered look) scales the whole cloud: 1.42 = the revision-2 look (cap 0.34)
// PAINTER'S ORDER in a covidCarriage cut: two StageItems round the emitter's figure at depth Z,
//   { Z: Z + 1, node: <HazeCloud layer="back" .../> } and { Z: Z - 1, node: <HazeCloud layer="front" .../> }.
// COST: ~14 envelope blobs + ~55 puffs + up to ~250 mote births per emitter; cut 3's whole scene ~5 ms per frame.
// ---------------------------------------------------------------------------
import React from "react";
import { hash } from "../kits/maps/incaShared";
import { mixHex, rgbHex } from "../kits/dwarkesh-3d/dwarkesh3d";

export type P2 = [number, number];
export type V3 = [number, number, number];
type FogLike = { rgb: [number, number, number] | string; amount: number };

/** the look values (rig units, frames). Settled on cut 3 (see HAZE_READY.md) */
export const HAZE = {
  // ---- THE ENVELOPE (the veil): soft blobs that hang round the head and shoulders, wander a little and breathe ----
  /** how the haze builds: the breathed amount, smoothed over envT frames; full at envFull */
  envT: 70,
  envFull: 0.55,
  /** the core round the head (blob offsets on an ellipse rx x ry round the centre, radius r +- rJit, depth spread z) */
  coreN: 8,
  coreRx: 42,
  coreRy: 38,
  coreDy: 14,
  coreR: 66,
  coreRJit: 16,
  coreZ: 60,
  /** the face blob (thickest round the face: weight), the shoulder blobs (offset x, y, weight) */
  faceW: 1.0,
  faceR: 50,
  shoulderX: 44,
  shoulderY: 72,
  shoulderW: 0.55,
  /** the lobe in front of the face (where he breathes and talks: 0.45 + 0.55 x push), blob distances and radii */
  lobeD: [100, 195] as P2,
  lobeR: [90, 105] as P2,
  lobeW: 6.5,
  /** the lobe blobs' drop below the centre (a seated neighbour's face is lower than a standing man's) */
  lobeY: [32, 58] as P2,
  /** and their depth behind the centre (a neighbour on the bench sits a little deeper) */
  lobeZ: [40, 105] as P2,
  /** the wide faint halo (offset forward, radius, weight): the thin edge that takes in a close neighbour */
  haloD: 110,
  haloR: 230,
  haloW: 1.1,
  /** the blobs' wander (units) and slow periods (frames), the swell on each exhale */
  wander: 9,
  swell: 0.08,
  /** the veil's alpha per weight at full build, and the cap on the thickest alpha */
  gain: 0.026,
  cap: 0.24,
  /** one knob for the whole cloud (user revision 2, "slightly more pronounced"): veil gain and cap x strength, mote
   *  size x (1 + 0.72 (strength - 1)) and alpha x (1 + 0.36 (strength - 1)). 1 = the delivered R1 look; 1.42 = cap 0.34,
   *  motes 1.3x larger */
  strength: 1,
  // ---- THE EXHALE PUFFS: short-lived soft puffs at the mouth (each breath adds a little, then joins the envelope) ----
  rate: 0.5,
  life: 110,
  billow: 22,
  billowT: 16,
  swirl: 0.55,
  diff: 3.2,
  r0: 16,
  grow: 4,
  puffGain: 0.05,
  fadeIn: 10,
  // ---- THE MOTES: born in the cloud (more while more is breathed out), wandering slowly, no direction ----
  moteRate: 1.3,
  moteLife: 190,
  /** where a mote lives: a gaussian round the centre (sigma x, y, z units), a share in the front lobe */
  moteSx: 46,
  /** motes live outside this radius round the centre (the head itself: none would show there) */
  moteInner: 40,
  moteSy: 40,
  moteSz: 30,
  moteLobe: 0.22,
  /** the wander (units) and the soft bounds of the cloud: up from the centre, down, behind, in front */
  moteWander: 12,
  boundUp: 105,
  /** the up bound out in front (units above the centre; negative = below it) */
  boundUpFwd: -45,
  boundDown: 150,
  boundBack: 120,
  boundFwd: 215,
  moteSize: 1.5,
  moteAlpha: 0.8,
  moteFade: [24, 0.6] as P2,
};
export type HazeOpts = typeof HAZE;
export const HAZE_COLORS = { veil: "#FFB43C", moteCore: "#FFD58A", moteHalo: "#FFB000" };

export type HazeEmitter = {
  /** PLANE mode: the anchor now (world px) and world px per rig unit (depth offsets only decide front / back) */
  at?: P2;
  scale?: number;
  /** DEPTH mode (a depth-kit cut): a rig-unit offset from the anchor (x across, y up -, z depth +) -> world px and the
   *  world px per unit there, e.g. (u) => ({ p: A.P.p(X + u[0], u[1], Z + u[2]), s: A.P.r(Z + u[2]) }) */
  project?: (u: V3) => { p: P2; s: number };
  /** the mouth at frame f, rig units from the anchor ([x, y] or [x, y, z]) */
  mouthAt: (f: number) => P2 | V3;
  /** the centre of the cloud at f (rig units from the anchor; default: the mouth raised 18 units, about the head's
   *  centre): pass covidAnchors(...).headC for a figure */
  centreAt?: (f: number) => P2 | V3;
  /** the breath's direction at f (a unit vector on screen: covidAnchors(...).mouthDir) */
  dirAt?: (f: number) => P2;
  /** how much is breathed out at f, 0..1 */
  amountAt: (f: number) => number;
  /** how hard the breath pushes out at f, 0..1 (quiet breathing ~0.3, talking or laughing ~1; default 0.5): the front
   *  lobe of the cloud fills more while he talks */
  pushAt?: (f: number) => number;
  seed: number;
  opts?: Partial<HazeOpts>;
};
export type HazeBlob = { p: P2; r: number; a: number; front: boolean };
export type HazeMote = { p: P2; r: number; a: number; front: boolean; /** a stable id (the same mote on every frame) */ id: number };
export type HazeAvoid = { c: P2; r: number; layer?: "front" | "all" };
export type HazeSink = { c: P2; r: number; pull: (f: number) => number; from: number };
export type Haze = { blobs: HazeBlob[]; motes: HazeMote[]; peak: number };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const n3 = (v: number) => Math.round(v * 1000) / 1000;

/** the out-breath: 0.35 .. 1, more on the exhale half of each breath (period frames) */
export const breathRhythm = (f: number, period = 96, seed = 0) => 0.35 + 0.65 * Math.max(0, Math.sin((f / period) * 2 * Math.PI + seed * 2.1)) ** 0.7;

/** the veil profile of one blob (matches the radial gradient's stops): ~exp(-3 x^2), 0 at the rim */
const prof = (x: number) => (x >= 1 ? 0 : Math.exp(-3 * x * x) * (1 - x * x * x * x));

/** three independent unit gaussians from a hash stream (Box-Muller) */
const gauss3 = (h: (k: number) => number, k0: number): V3 => {
  const r1 = Math.sqrt(-2 * Math.log(0.02 + 0.98 * h(k0)));
  const r2 = Math.sqrt(-2 * Math.log(0.02 + 0.98 * h(k0 + 1)));
  const t1 = 2 * Math.PI * h(k0 + 2);
  const t2 = 2 * Math.PI * h(k0 + 3);
  return [r1 * Math.cos(t1), r1 * Math.sin(t1), r2 * Math.cos(t2)];
};
const projector = (e: HazeEmitter) =>
  e.project ??
  ((u: V3) => {
    const sc = e.scale ?? 1;
    const at = e.at ?? [0, 0];
    return { p: [at[0] + u[0] * sc, at[1] + u[1] * sc] as P2, s: sc };
  });
const v3 = (u: P2 | V3): V3 => [u[0], u[1], u[2] ?? 0];
/** a soft bound: x passes through below `lim`, then eases toward lim + soft (never beyond) */
const softLim = (x: number, lim: number, soft: number) => (x <= lim - soft ? x : lim - soft + soft * Math.tanh((x - (lim - soft)) / soft));

/** the emitter's state at a frame: the cloud's centre, which way is forward (+1 = screen right), how built it is (0..1),
 *  the exhale swell (-1..1) and the smoothed push */
const stateAt = (e: HazeEmitter, H: HazeOpts, f: number) => {
  const fr = Math.round(f);
  const c = v3(e.centreAt ? e.centreAt(fr) : (() => {
    const m = v3(e.mouthAt(fr));
    return [m[0], m[1] - 18, m[2]] as V3;
  })());
  const d = e.dirAt ? e.dirAt(fr) : ([1, 0] as P2);
  const fwd = d[0] >= 0 ? 1 : -1;
  let sw = 0, sa = 0, sp = 0, sq = 0, se = 0, sew = 0;
  for (let k = 0; k <= 3 * H.envT; k += 2) {
    const b = fr - k;
    const w = Math.exp(-k / H.envT);
    const am = c01(e.amountAt(b));
    sw += w;
    sa += w * am;
    const wq = Math.exp(-k / 25);
    sq += wq;
    sp += wq * c01(e.pushAt ? e.pushAt(b) : 0.5);
    if (k <= 24) {
      const we = Math.exp(-k / 6);
      sew += we;
      se += we * am;
    }
  }
  const mean = sa / sw;
  return { c, fwd, build: c01(mean / H.envFull), swell: Math.max(-1, Math.min(1, (se / sew - mean) / Math.max(0.05, mean))), push: sp / sq };
};

export const hazeAt = (emitters: HazeEmitter[], frame: number, o: { avoid?: HazeAvoid[]; sinks?: HazeSink[]; below?: number } = {}): Haze => {
  const blobs: HazeBlob[] = [];
  const motes: HazeMote[] = [];
  const avoid = o.avoid ?? [];
  const sinks = o.sinks ?? [];
  for (let ei = 0; ei < emitters.length; ei++) {
    const e = emitters[ei];
    const H = { ...HAZE, ...e.opts };
    const sd = e.seed;
    const proj = projector(e);
    const st = stateAt(e, H, frame);
    const { c, fwd, build, swell, push } = st;
    const frontOf = (z: number) => z < c[2];
    const pushBlob = (u: V3, r: number, a: number) => {
      const front = frontOf(u[2]);
      const pr = proj(u);
      if (front) for (const v of avoid) if ((v.layer ?? "all") === "front") a *= 0.25 + 0.75 * sst(0.5, 1.2, Math.hypot(pr.p[0] - v.c[0], pr.p[1] - v.c[1]) / v.r);
      if (a > 0.0015) blobs.push({ p: pr.p, r: r * pr.s, a, front });
    };
    // ---- the envelope ------------------------------------------------------------------------------------------------
    if (build > 0.002) {
      const hb = (k: number) => hash(k + 0.71, 41.3 + sd);
      const wan = (k: number): V3 => [
        H.wander * Math.sin(frame * (0.011 + 0.006 * hb(k)) + 6.28 * hb(k + 0.1)),
        H.wander * 0.8 * Math.sin(frame * (0.009 + 0.006 * hb(k + 0.2)) + 6.28 * hb(k + 0.3)),
        H.wander * Math.sin(frame * (0.008 + 0.005 * hb(k + 0.4)) + 6.28 * hb(k + 0.5)),
      ];
      const rs = (0.72 + 0.28 * build) * (1 + H.swell * swell);
      const as = H.gain * H.strength * build ** 1.2 * (1 + 1.5 * H.swell * swell);
      const add = (k: number, off: V3, r: number, w: number) => {
        const wv = wan(k);
        pushBlob([c[0] + off[0] + wv[0], c[1] + off[1] + wv[1], c[2] + off[2] + wv[2]], r * rs, w * as);
      };
      for (let k = 0; k < H.coreN; k++) {
        const th = (2 * Math.PI * (k + 0.35 * hb(k + 3))) / H.coreN;
        add(k, [Math.cos(th) * H.coreRx, Math.sin(th) * H.coreRy + H.coreDy, (hb(k + 5) - 0.5) * 2 * H.coreZ], H.coreR + H.coreRJit * (2 * hb(k + 7) - 1), 1);
      }
      const m = v3(e.mouthAt(Math.round(frame)));
      add(20, [m[0] - c[0] + fwd * 10, m[1] - c[1], -12], H.faceR, H.faceW);
      add(21, [-H.shoulderX, H.shoulderY, 10], H.coreR, H.shoulderW);
      add(22, [H.shoulderX, H.shoulderY, -10], H.coreR, H.shoulderW);
      const lw = H.lobeW * (0.45 + 0.55 * push);
      add(23, [fwd * H.lobeD[0], H.lobeY[0], H.lobeZ[0]], H.lobeR[0], lw);
      add(24, [fwd * H.lobeD[1], H.lobeY[1], H.lobeZ[1]], H.lobeR[1], lw * 0.8);
      add(25, [fwd * H.haloD, 44, 40], H.haloR, H.haloW);
    }
    // ---- the exhale puffs ---------------------------------------------------------------------------------------------
    const i0 = Math.ceil((frame - H.life) * H.rate);
    const i1 = Math.floor(frame * H.rate);
    for (let i = i0; i <= i1; i++) {
      const b = i / H.rate;
      const t = frame - b;
      if (t < 0 || t > H.life) continue;
      const w = c01(e.amountAt(b));
      if (w < 0.01) continue;
      const h = (k: number) => hash(i + 0.37 * k, 13.1 * k + sd);
      const m = v3(e.mouthAt(Math.round(b)));
      const d = e.dirAt ? e.dirAt(Math.round(b)) : ([0, 0] as P2);
      const th = 2 * Math.PI * h(11);
      const dv: P2 = [d[0] * (1 - H.swirl) + H.swirl * Math.cos(th), d[1] * 0.4 * (1 - H.swirl) + H.swirl * 0.7 * Math.sin(th)];
      const dn = Math.hypot(dv[0], dv[1]) || 1;
      const bl = H.billow * (0.6 + 0.8 * h(1)) * (1 - Math.exp(-t / H.billowT));
      const g = gauss3(h, 3);
      const sg = H.diff * Math.sqrt(t) * 0.8;
      const u: V3 = [m[0] + (dv[0] / dn) * bl + sg * g[0] * 1.3, m[1] + (dv[1] / dn) * bl + sg * g[1], m[2] + sg * g[2] * 0.6];
      const r = H.r0 * (0.7 + 0.6 * h(6)) + H.grow * Math.sqrt(t);
      const a = w * H.puffGain * H.strength * sst(0, H.fadeIn, t) * (1 - sst(0.4 * H.life, H.life, t));
      pushBlob(u, r, a);
    }
    // ---- the motes: born in the cloud, wandering slowly inside its soft bounds -----------------------------------------
    const j0 = Math.ceil((frame - H.moteLife) * H.moteRate);
    const j1 = Math.floor(frame * H.moteRate);
    for (let j = j0; j <= j1; j++) {
      const b = j / H.moteRate;
      const t = frame - b;
      if (t < 0 || t > H.moteLife) continue;
      const w = c01(e.amountAt(b));
      const h = (k: number) => hash(j + 0.53 * k, 29.7 * k + sd + 5);
      if (h(0) > w) continue;
      const sb = stateAt(e, H, b);
      if (h(1) > 0.25 + 0.75 * sb.build) continue;
      const g = gauss3(h, 3);
      // home: round the centre (most close, fewer outward), a share out in the front lobe (more while he talks)
      const inLobe = h(8) < H.moteLobe * (0.5 + sb.push);
      const home: V3 = inLobe
        ? [sb.c[0] + sb.fwd * (H.lobeD[0] + (H.lobeD[1] + 10 - H.lobeD[0]) * h(9)) + g[0] * 22, sb.c[1] + 30 + g[1] * 30, sb.c[2] + 30 + g[2] * H.moteSz]
        : (() => {
            // round the head, not inside it: a radius from the head's edge outward (most close), any direction
            const th = 2 * Math.PI * h(22);
            const rho = H.moteInner + Math.abs(g[0]) * H.moteSx;
            return [sb.c[0] + Math.cos(th) * rho, sb.c[1] + H.coreDy + Math.sin(th) * rho * (H.moteSy / H.moteSx), sb.c[2] + g[2] * H.moteSz] as V3;
          })();
      // the wander: two slow sines per axis, growing in over the mote's first frames (no direction)
      const W = H.moteWander * (1 - Math.exp(-t / 50));
      const wx = W * (Math.sin(t * (0.021 + 0.015 * h(10)) + 6.28 * h(11)) + 0.6 * Math.sin(t * (0.047 + 0.02 * h(12)) + 6.28 * h(13)));
      const wy = W * 0.8 * (Math.sin(t * (0.019 + 0.015 * h(14)) + 6.28 * h(15)) + 0.6 * Math.sin(t * (0.043 + 0.02 * h(16)) + 6.28 * h(17)));
      const wz = W * Math.sin(t * (0.017 + 0.012 * h(18)) + 6.28 * h(19));
      let u: V3 = [home[0] + wx, home[1] + wy, home[2] + wz];
      // the soft bounds round the CURRENT centre: not above one head-height over the hat, not far behind, not past the lobe
      const dx = (u[0] - c[0]) * fwd;
      const dy = u[1] - c[1];
      // (out in front of him the cloud stays low, at face height: nothing over the far carriage)
      const up = H.boundUp + (H.boundUpFwd - H.boundUp) * sst(60, 150, dx);
      u = [c[0] + fwd * -softLim(-softLim(dx, H.boundFwd, 40), H.boundBack, 30), c[1] - softLim(-dy, up, 25), u[2]];
      u[1] = c[1] + softLim(u[1] - c[1], H.boundDown, 40);
      const front = frontOf(u[2]);
      const pr = proj(u);
      let p = pr.p;
      let a = Math.min(1, H.moteAlpha * (1 + 0.36 * (H.strength - 1))) * (0.4 + 0.6 * h(20)) * (0.6 + 0.4 * w) * sst(0, H.moteFade[0], t) * (1 - sst(H.moteFade[1] * H.moteLife, H.moteLife, t));
      let r = H.moteSize * (1 + 0.72 * (H.strength - 1)) * (0.7 + 0.7 * h(21)) * pr.s;
      // an inhale draws the motes near the mouth in (they fade there): the ones near it on the sink's `from` frame
      let taken = 0;
      for (const sk of sinks) {
        if (b >= sk.from || frame <= sk.from) continue;
        const t0 = sk.from - b;
        const W0 = H.moteWander * (1 - Math.exp(-t0 / 50));
        const q0: V3 = [
          home[0] + W0 * (Math.sin(t0 * (0.021 + 0.015 * h(10)) + 6.28 * h(11)) + 0.6 * Math.sin(t0 * (0.047 + 0.02 * h(12)) + 6.28 * h(13))),
          home[1] + W0 * 0.8 * (Math.sin(t0 * (0.019 + 0.015 * h(14)) + 6.28 * h(15)) + 0.6 * Math.sin(t0 * (0.043 + 0.02 * h(16)) + 6.28 * h(17))),
          home[2],
        ];
        const q = proj(q0).p;
        const dd = Math.hypot(q[0] - sk.c[0], q[1] - sk.c[1]);
        const k = c01(sk.pull(frame)) * sst(sk.r, 0.6 * sk.r, dd);
        if (k <= 0) continue;
        taken = Math.max(taken, k);
        p = [p[0] + (sk.c[0] - p[0]) * k, p[1] + (sk.c[1] - p[1]) * k];
        a *= 1 - sst(0.35, 0.85, k);
        r *= 1 - 0.4 * k;
      }
      for (const v of avoid) {
        if ((v.layer ?? "all") === "front" && !front) continue;
        // (a mote being breathed in goes on into the mouth)
        a *= 1 - (1 - sst(1.0, 1.6, Math.hypot(p[0] - v.c[0], p[1] - v.c[1]) / v.r)) * (1 - taken);
      }
      // no glints low in the frame (the caption bands): motes fade out above the `below` row (world px)
      if (o.below !== undefined) a *= sst(o.below, o.below - 40 * pr.s, p[1]);
      if (a > 0.02) motes.push({ p, r, a, front, id: ei * 1e7 + j });
    }
  }
  // ---- the cap: the veil's thickest alpha (sampled at the blob centres) never above HAZE.cap -------------------------
  let peak = 0;
  const N = blobs.length;
  const step = Math.max(1, Math.floor(N / 90));
  for (let s = 0; s < N; s += step) {
    const q = blobs[s].p;
    let D = 0;
    for (let i = 0; i < N; i++) {
      const B = blobs[i];
      const dx = q[0] - B.p[0];
      const dy = q[1] - B.p[1];
      if (dx * dx + dy * dy >= B.r * B.r) continue;
      D += B.a * prof(Math.sqrt(dx * dx + dy * dy) / B.r);
    }
    peak = Math.max(peak, 1 - Math.exp(-D));
  }
  const cap = emitters.length ? Math.min(...emitters.map((e) => (e.opts?.cap ?? HAZE.cap) * (e.opts?.strength ?? HAZE.strength))) : HAZE.cap;
  if (peak > cap) {
    const k = cap / peak;
    for (const B of blobs) B.a *= k;
    peak = cap;
  }
  return { blobs, motes, peak };
};

const fogHexOf = (f: FogLike) => (typeof f.rgb === "string" ? f.rgb : rgbHex(f.rgb));

/** one layer of the haze (world px): the veil, then the motes. fog: A.folkFog(Z) (the haze takes half of it) */
export const HazeCloud: React.FC<{ haze: Haze; layer: "back" | "front"; uid: string; fog?: FogLike | null; veil?: boolean; motes?: boolean }> = ({ haze, layer, uid, fog, veil = true, motes = true }) => {
  const f = fog ? 0.5 * c01(fog.amount) : 0;
  const col = (hex: string) => (f > 0 ? mixHex(hex, fogHexOf(fog as FogLike), f) : hex);
  const want = layer === "front";
  const bl = veil ? haze.blobs.filter((b) => b.front === want) : [];
  const mo = motes ? haze.motes.filter((m) => m.front === want) : [];
  if (!bl.length && !mo.length) return null;
  const vc = col(HAZE_COLORS.veil);
  const mh = col(HAZE_COLORS.moteHalo);
  const mc = col(HAZE_COLORS.moteCore);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}hv`}>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((x) => (
            <stop key={x} offset={x} stopColor={vc} stopOpacity={n3(prof(x))} />
          ))}
        </radialGradient>
        <radialGradient id={`${uid}hm`}>
          <stop offset="0" stopColor={mh} stopOpacity={0.5} />
          <stop offset="1" stopColor={mh} stopOpacity={0} />
        </radialGradient>
      </defs>
      {bl.map((b, i) => (
        <circle key={`b${i}`} cx={n3(b.p[0])} cy={n3(b.p[1])} r={n3(b.r)} fill={`url(#${uid}hv)`} opacity={n3(Math.min(1, b.a))} />
      ))}
      {mo.map((m, i) => (
        <g key={`m${i}`} opacity={n3(m.a)}>
          <circle cx={n3(m.p[0])} cy={n3(m.p[1])} r={n3(m.r * 2.4)} fill={`url(#${uid}hm)`} />
          <circle cx={n3(m.p[0])} cy={n3(m.p[1])} r={n3(m.r)} fill={mc} />
        </g>
      ))}
    </g>
  );
};
