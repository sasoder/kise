// ---------------------------------------------------------------------------
// ranchWorld — THE SHARED WORLD of robert-johnson-ranch (cut 26 LivingThereAllHerLife, cut 59 NothingButMoreHills):
// the Texas Hill Country inside the style's misty air (styles/dwarkesh-3d.md: palette A, mood day), a warm late
// afternoon, the light from the upper left. Read-only for other builders once WORLD_READY.md exists; additions go in
// as NEW export names (notes/SHARED_CHANGES.md).
//
// UNITS: the kit's world (kits/dwarkesh-3d): U = 178 per metre (a man 312), X across, Y height (up is -Y), Z depth.
//   GROUND HEIGHTS here are H = -Y (up +, world units). Every component takes the cut's AirWorld A (airWorldOf) and
//   draws inside <WorldSvg cam>. The cast (ranchFolk.tsx) stands at A.P.p(X, -H, Z) with scale A.P.r(Z) * FIG_W.
//
// THE CAMERA: cam3({ X, Z, E, C, yH }) -> { cam, depth }: a pinhole at world (X, height E, Z) looking along +Z with
//   focal C px and the horizon at screen row yH (a lens shift, never a tilt: verticals stay vertical). Z < 0 always
//   (the kit's front plane is Z = 0, so put the world at Z >= 0 - 0.85 * |Z|). Then
//   ranchAirOf({ cam, depth, rest, frame }) = airWorldOf with THE CLIP'S AIR (RANCH_SCENE: fog by the eye's distance,
//   near things keep their local colour, ridges sink into the haze from ~2 km of "stage" depth).
//
// THE GROUND
//   Terrain = { H(X, Z), mat(X, Z) -> dirt 0..1, crest? (a skyline to rim), path? (a worn foot path, no tufts) }
//   rollingTerrain({ seed, amp, wave, flats: [{ X, Z, R, H }] })   gentle rolling ground with flat pads (a farm yard)
//   <HillGround A T z0 z1 x0? x1? items? tufts? frame uid />   the terrain as depth slices painted far to near (dry
//       yellow-green grass, a dirt yard where mat says so), shaded by slope against the light, fogged by distance; the
//       crest rimmed in cream; grass tufts that sway (tufts: { x0, x1, z0, z1, step, seed }), and ITEMS interleaved in
//       the painter's order: items = [{ Z, node }] (a house, a tree, a figure: drawn after every slice behind Z).
//   groundY(T, X, Z) = -T.H(X, Z)   the world Y of the ground (stand figures on it)
//   <DirtRoad A T path w />         a pale caliche strip on the ground (a decal: draw it as an item at the road's
//                                   nearest Z, on ground that does not hide it)
// THE FAR HILLS
//   ridgeSeries({ n, zNear, ratio, hNear, hFar, amp, seed }) -> Ridge[]   N ridges receding in depth
//   <RidgeStack A ridges frame uid />   each a soft silhouette band fogged by its own distance, darker at its crest,
//                                   mist in the valley below it, a cream rim, cedar dots on the near ones. Draw it
//                                   BEFORE the HillGround (it is all farther).
// TREES (gouache, the cast's paint): <LiveOak A X Z H size? seed frame uid />  a broad spreading oak (~7 m);
//   <CedarClump A X Z H size? seed frame uid />  2-3 dark Ashe juniper bushes (~3 m)
// BUILT THINGS (air-lit volumes: lit tops, cream rims, darker local outlines)
//   <DogRunHouse A X0 Z0 H0 inside? />   Rebekah's house c.1910: two log rooms under one slate-grey gable roof with an
//       open breezeway between, a catslide porch roof on posts, a low porch floor, oatmeal chinking, a stone chimney at
//       the left end. (X0, Z0) = the centre of the porch's front edge. `inside` is drawn between the walls and the
//       porch posts / porch roof (a figure on the porch). DOGRUN = its dimensions (porch floor height, room ranges).
//   <FarmHouse A X0 Z0 H0 porch? />      the 1970s farmhouse: white-painted board siding, a corrugated tin roof, a
//       raised front porch with posts and steps, windows, a door. `porch` is drawn on the porch between the house and
//       the porch's posts / roof edge (the woman in her rocking chair). FARM = its dimensions (porch floor height and
//       its Z range, the posts).
//   <Windmill A X Z H frame turn? />    a lattice tower with its wheel (turning with frame) and tail vane
//   <FencePost A X Z H /> / <FenceLine A T pts spacing? />   weathered cedar posts and three wires
// FACES: face(A, pts3, mat, uid) the generic air-lit polygon (back faces culled by their screen winding).
// ---------------------------------------------------------------------------
import React from "react";
import { AIR, airWorldOf, formTone, mixHex, type AirScene, type AirWorld, type Cam, type DepthOpts, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { RanchPaint } from "./ranchFolk";
import type { Shape } from "../kyle-pandemics/pandemicFolkPaint";

export const U = 178;
const PAL = AIR.A;
type P2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const Pt = (p: P2) => `${n2(p[0])},${n2(p[1])}`;
const polyD = (q: P2[]) => (q.length ? `M${q.map(Pt).join("L")}Z` : "");
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const hash2 = (i: number, j: number, k = 0) => hash(i * 157.31 + j * 311.77 + k * 71.13);

// ===================================================================================================================
// THE CAMERA AND THE AIR
// ===================================================================================================================
export const RANCH_SCENE: Partial<AirScene> = { fogNear: 600, fogVis: 15000, fogMax: 0.92, hLow: 0, hHigh: 1250 };
export type Cam3 = { X: number; Z: number; E: number; C: number; yH: number };
export const cam3 = (c: Cam3): { cam: Cam; depth: DepthOpts } => {
  const Dc = Math.max(50, -c.Z);
  const k = c.C / Dc;
  return { cam: { k, cx: c.X, cy: -c.E - (c.yH - 960) / k }, depth: { eyeY: -c.E, dRef: Dc, kRef: k, dolly: 1 } };
};
export const ranchAirOf = (o: { cam: Cam; depth: DepthOpts; rest: Cam; frame: number; scene?: Partial<AirScene> }) =>
  airWorldOf({ cam: o.cam, rest: o.rest, depth: o.depth, frame: o.frame, scene: { ...RANCH_SCENE, ...o.scene }, fogBy: "eye" });

// ===================================================================================================================
// MATERIALS (local colours before fog)
// ===================================================================================================================
export const RMAT = {
  grass: { lit: "#8F9672", mid: "#6A7356", dark: "#3A4535" },
  grassDry: { lit: "#ABA581", mid: "#868462", dark: "#4E503D" },
  dirt: { lit: "#9C8C6C", mid: "#7F705A", dark: "#4A4033" },
  caliche: { lit: "#C2B898", mid: "#A69C80", dark: "#6E6754" },
  timber: { lit: "#A38059", mid: "#73583B", dark: "#3A2B1D" },
  boards: { lit: "#9C8466", mid: "#76634C", dark: "#3E3326" },
  slate: { lit: "#A0A6A2", mid: "#7D8380", dark: "#454B49" },
  stone: { lit: "#9D8C78", mid: "#6E6253", dark: "#352D25" },
  white: { lit: "#EDE6D6", mid: "#CFC7B5", dark: "#8E8778" },
  tin: { lit: "#ADB3B1", mid: "#858B8A", dark: "#4E5453" },
  oak: { lit: "#7C8658", mid: "#57623F", dark: "#313A27" },
  cedar: { lit: "#5E705C", mid: "#405146", dark: "#24302A" },
  bark: { lit: "#6E5844", mid: "#4E3D2E", dark: "#2B2119" },
  post: { lit: "#9A8F7E", mid: "#6F6657", dark: "#3A342C" },
} satisfies Record<string, Mat>;
export const CHINK = "#D2C4A2";
const lineOfM = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.35);
/** the light from the upper left, a little from the front (X, up, Z) */
const LIGHT = (() => {
  const v = [-0.6, 0.75, -0.3];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((x) => x / l);
})();
const ndlOf = (n: [number, number, number]) => {
  const l = Math.hypot(n[0], n[1], n[2]) || 1;
  return (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / l;
};

// ===================================================================================================================
// FACES
// ===================================================================================================================
/** world point (X, H up +, Z) -> 2D world point */
const PP = (A: AirWorld, X: number, H: number, Z: number): P2 => A.P.p(X, -H, Z);
type W3 = [number, number, number];
const signedArea = (q: P2[]) => {
  let s = 0;
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
/** a planar face (world points X, H, Z, listed counter-clockwise seen from OUTSIDE) lit by its normal; back faces
 *  (clockwise on screen) are culled. Returns null when culled. */
export const faceEl = (A: AirWorld, pts: W3[], mat: Mat, key: string, o: { rim?: boolean; lw?: number; tint?: number; fillOverride?: string; noCull?: boolean; lineOp?: number } = {}) => {
  const q = pts.map(([X, H, Z]) => PP(A, X, H, Z));
  const area = signedArea(q);
  // seen from outside, a face listed counter-clockwise has a NEGATIVE signed area on screen (y down)
  if (!o.noCull && area >= 0) return null;
  // the normal from the world polygon (X, up, Z): (b - a) x (c - a), oriented outward by the winding (seen from outside
  // counter-clockwise on screen, where screen y is down: outward = the one facing the eye)
  const [a, b, c] = pts;
  const u: W3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: W3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  let n: W3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  // make it point toward the camera side
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const ch = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const cz = pts.reduce((s, p) => s + p[2], 0) / pts.length;
  const camX = A.cam.cx;
  const camH = -A.P.opts.eyeY;
  const camZ = -A.Dc;
  const toCam: W3 = [camX - cx, camH - ch, camZ - cz];
  if (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] < 0) n = [-n[0], -n[1], -n[2]];
  const local = o.fillOverride ?? formTone(mat, ndlOf(n), PAL.shadow, 0.22);
  const fill = A.tone(local, cz, ch);
  const lw = o.lw ?? A.lw(1.0);
  return (
    <path
      key={key}
      d={polyD(q)}
      fill={fill}
      stroke={A.tone(lineOfM(mat), cz, ch)}
      strokeWidth={lw}
      strokeOpacity={o.lineOp ?? 0.8}
      strokeLinejoin="round"
    />
  );
};
/** an axis-aligned box (H0 bottom < H1 top) as its visible faces */
const boxFaces = (A: AirWorld, X0: number, X1: number, H0: number, H1: number, Z0: number, Z1: number, mat: Mat, key: string, skip: string[] = []) => {
  const F: [string, W3[]][] = [
    ["fr", [[X0, H0, Z0], [X1, H0, Z0], [X1, H1, Z0], [X0, H1, Z0]]],
    ["bk", [[X1, H0, Z1], [X0, H0, Z1], [X0, H1, Z1], [X1, H1, Z1]]],
    ["lf", [[X0, H0, Z1], [X0, H0, Z0], [X0, H1, Z0], [X0, H1, Z1]]],
    ["rt", [[X1, H0, Z0], [X1, H0, Z1], [X1, H1, Z1], [X1, H1, Z0]]],
    ["tp", [[X0, H1, Z0], [X1, H1, Z0], [X1, H1, Z1], [X0, H1, Z1]]],
    ["bt", [[X0, H0, Z1], [X1, H0, Z1], [X1, H0, Z0], [X0, H0, Z0]]],
  ];
  return F.filter(([k]) => !skip.includes(k)).map(([k, p]) => faceEl(A, p, mat, `${key}${k}`, { noCull: false }));
};
/** is a face (by its outward normal) seen from the camera? */
const seen = (A: AirWorld, p: W3, n: W3) => {
  const camX = A.cam.cx;
  const camH = -A.P.opts.eyeY;
  const camZ = -A.Dc;
  return (camX - p[0]) * n[0] + (camH - p[1]) * n[1] + (camZ - p[2]) * n[2] > 0;
};

// ===================================================================================================================
// TERRAIN
// ===================================================================================================================
export type Terrain = {
  H: (X: number, Z: number) => number;
  /** 0 grass .. 1 bare dirt (a swept yard, a path) */
  mat?: (X: number, Z: number) => number;
  /** a crest line to rim in cream: Z and H along X */
  crest?: { at: (X: number) => { Z: number; H: number }; x0: number; x1: number };
  /** where no tufts grow (a worn path): true = clear */
  clear?: (X: number, Z: number) => boolean;
  grass?: Mat;
};
export const groundY = (T: Terrain, X: number, Z: number) => -T.H(X, Z);
/** smooth value noise 2D (deterministic) */
const vnoise = (x: number, z: number, seed = 0) => {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const h = (i: number, j: number) => hash2(i, j, seed);
  const a = lerp(h(xi, zi), h(xi + 1, zi), s(xf));
  const b = lerp(h(xi, zi + 1), h(xi + 1, zi + 1), s(xf));
  return lerp(a, b, s(zf));
};
export const rollingTerrain = (o: { seed?: number; amp?: number; wave?: number; flats?: { X: number; Z: number; R: number; H: number }[]; base?: number }): Terrain => {
  const seed = o.seed ?? 3;
  const amp = o.amp ?? 260;
  const wave = o.wave ?? 1500;
  const flats = o.flats ?? [];
  const H = (X: number, Z: number) => {
    let h = (o.base ?? 0) + amp * (0.6 * Math.sin(X / wave + seed) * Math.cos(Z / (wave * 1.3) + seed * 0.7) + 0.4 * (vnoise(X / (wave * 0.6), Z / (wave * 0.6), seed) - 0.5) * 2);
    for (const f of flats) {
      const d = Math.hypot(X - f.X, Z - f.Z);
      h = lerp(f.H, h, sstep(f.R, f.R * 2.2, d));
    }
    return h;
  };
  return { H, mat: (X, Z) => flats.reduce((m, f) => Math.max(m, 1 - sstep(f.R * 0.6, f.R * 1.1, Math.hypot(X - f.X, Z - f.Z))), 0) * 0.75 };
};

// fixed slice depths (a world grid, so slices never crawl as the camera moves)
const SLICES = (() => {
  const out: number[] = [];
  let Z = -2400;
  while (Z < 9000) {
    out.push(Z);
    Z += Math.max(9, 0.022 * (Z + 2600));
  }
  return out;
})();

export type Item = { Z: number; node: React.ReactNode };
export type Tufts = {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  step: number;
  seed?: number;
  size?: number;
  /** (added after WORLD_READY) fade tufts out as they come within this eye distance (fully gone at 0.7 x): a moving
   *  camera then never pops a near tuft at a cut-off depth. Unset = no fade (the original behaviour). */
  near?: number;
};
const grassMat = (T: Terrain) => T.grass ?? RMAT.grass;
/** the local colour of the ground at (X, Z) from its slope and material, before fog */
const groundLocal = (T: Terrain, X: number, Z: number) => {
  const e = 12;
  const hx = (T.H(X + e, Z) - T.H(X - e, Z)) / (2 * e);
  const hz = (T.H(X, Z + e) - T.H(X, Z - e)) / (2 * e);
  const ndl = ndlOf([-hx, 1, -hz]);
  const gm = grassMat(T);
  // patches of drier and greener grass (low frequency) and a little mottling
  const pn = vnoise(X / 420, Z / 300, 7);
  const mot = vnoise(X / 300, Z / 520, 11) - 0.5;
  const g = formTone({ lit: mixHex(gm.lit, RMAT.grassDry.lit, pn), mid: mixHex(gm.mid, RMAT.grassDry.mid, pn), dark: gm.dark }, ndl * 0.85 + 0.02 + 0.12 * mot + 0.1 * (pn - 0.5), PAL.shadow, 0.2);
  // mottling: darker green-grey patches and paler dry ones (~2-4 m), so the near ground is never one flat fill
  const pat = vnoise(X / 700 + 3.1, Z / 900, 13);
  const g1 = mot > 0.08 ? mixHex(g, RMAT.grassDry.lit, 0.25 * sstep(0.08, 0.4, mot)) : mixHex(g, gm.dark, 0.22 * sstep(-0.05, -0.4, mot));
  const g2 = mixHex(g1, mixHex(gm.dark, "#55604A", 0.5), 0.2 * sstep(0.55, 0.85, pat));
  const dm = T.mat ? T.mat(X, Z) : 0;
  if (dm <= 0.001) return g2;
  return mixHex(g2, formTone(RMAT.dirt, ndl, PAL.shadow, 0.2), dm);
};

const Tuft: React.FC<{ A: AirWorld; X: number; Z: number; H: number; s: number; seed: number; frame: number }> = ({ A, X, Z, H, s, seed, frame }) => {
  const base = PP(A, X, H, Z);
  const r = A.P.r(Z);
  const px = s * r * A.k;
  if (px < 1.6) return null;
  const n = 3 + Math.floor(hash(seed) * 3);
  const wind = Math.sin(frame * 0.09 + X * 0.004 + Z * 0.002) * 0.5 + Math.sin(frame * 0.21 + seed) * 0.25;
  const fogZ = Z;
  const fillB = A.tone(mixHex(RMAT.grass.mid, RMAT.grassDry.mid, hash(seed + 1)), fogZ, H);
  const fillT = A.tone(mixHex(RMAT.grassDry.lit, "#C9C29A", hash(seed + 2) * 0.6), fogZ, H + s);
  let dB = "";
  let dF = "";
  for (let i = 0; i < n; i++) {
    const a = (i / Math.max(1, n - 1) - 0.5) * 1.1 + (hash(seed + i * 3) - 0.5) * 0.4;
    const len = s * (0.7 + 0.5 * hash(seed + i * 5));
    const lean = a * 0.55 + wind * 0.35 * (0.6 + hash(seed + i));
    const w = s * 0.11;
    const bx = base[0] + a * s * 0.25 * r;
    const by = base[1];
    const tx = bx + Math.sin(lean) * len * r;
    const ty = by - Math.cos(lean) * len * r;
    const mx = bx + Math.sin(lean * 0.5) * len * 0.5 * r;
    const my = by - Math.cos(lean * 0.5) * len * 0.5 * r;
    const blade = `M${n2(bx - w * r)},${n2(by)}Q${n2(mx - w * 0.45 * r)},${n2(my)} ${n2(tx)},${n2(ty)}Q${n2(mx + w * 0.45 * r)},${n2(my)} ${n2(bx + w * r)},${n2(by)}Z`;
    if (i % 2) dF += blade;
    else dB += blade;
  }
  return (
    <g>
      <path d={dB} fill={fillB} />
      <path d={dF} fill={mixHex(fillB, fillT, 0.55)} />
    </g>
  );
};

export const HillGround: React.FC<{
  A: AirWorld;
  T: Terrain;
  z0: number;
  z1: number;
  items?: Item[];
  tufts?: Tufts[];
  frame: number;
  uid: string;
  /** extra screen px beyond the frame edges */
  margin?: number;
}> = ({ A, T, z0, z1, items = [], tufts = [], frame, uid, margin = 60 }) => {
  const P = A.P;
  const k = A.k;
  const zNear = Math.max(z0, P.zNear + 40);
  const zs = SLICES.filter((Z) => Z >= zNear && Z <= z1);
  const bottomY = A.cam.cy + (980 + margin) / k;
  const els: { Z: number; node: React.ReactNode }[] = [];
  // the slices
  zs.forEach((Z, si) => {
    const r = P.r(Z);
    const hw = (540 + margin) / (k * r);
    const xa = A.cam.cx - hw;
    const xb = A.cam.cx + hw;
    const N = 44;
    const top: P2[] = [];
    const stops: { o: number; c: string }[] = [];
    for (let i = 0; i <= N; i++) {
      const X = lerp(xa, xb, i / N);
      const H = T.H(X, Z);
      top.push(PP(A, X, H, Z));
      if (i % 2 === 0) stops.push({ o: i / N, c: A.tone(groundLocal(T, X, Z), Z, Math.max(0, H)) });
    }
    // skip slices wholly below the frame
    if (Math.min(...top.map((q) => q[1])) > bottomY) return;
    const d = `M${top.map(Pt).join("L")}L${n2(top[N][0])},${n2(bottomY)}L${n2(top[0][0])},${n2(bottomY)}Z`;
    const gid = `${uid}g${si}`;
    els.push({
      Z,
      node: (
        <g key={`s${si}`}>
          <defs>
            <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={n2(top[0][0])} y1="0" x2={n2(top[N][0])} y2="0">
              {stops.map((s, i) => (
                <stop key={i} offset={s.o.toFixed(3)} stopColor={s.c} />
              ))}
            </linearGradient>
          </defs>
          <path d={d} fill={`url(#${gid})`} />
        </g>
      ),
    });
  });
  // the crest's cream rim (drawn with the slice at the crest)
  if (T.crest) {
    const cr = T.crest;
    const pts: { p: P2; Z: number }[] = [];
    for (let i = 0; i <= 80; i++) {
      const X = lerp(cr.x0, cr.x1, i / 80);
      const c = cr.at(X);
      if (c.Z < zNear) continue;
      pts.push({ p: PP(A, X, c.H, c.Z), Z: c.Z });
    }
    if (pts.length > 2) {
      const Zm = Math.min(...pts.map((q) => q.Z));
      els.push({
        Z: Zm - 0.5,
        node: <path key="crest" d={`M${pts.map((q) => Pt(q.p)).join("L")}`} fill="none" stroke={PAL.cream} strokeWidth={A.lw(1.6)} strokeOpacity={0.32 * (1 - A.fog(Zm))} strokeLinecap="round" />,
      });
    }
  }
  // the tufts
  for (const tf of tufts) {
    const st = tf.step;
    for (let i = Math.floor(tf.x0 / st); i <= tf.x1 / st; i++) {
      for (let j = Math.floor(tf.z0 / st); j <= tf.z1 / st; j++) {
        const seed = hash2(i, j, tf.seed ?? 1) * 1000;
        if (hash(seed) < 0.25) continue;
        const X = (i + hash(seed + 11)) * st;
        const Z = (j + hash(seed + 13)) * st;
        if (Z < zNear || Z > z1) continue;
        if (T.clear && T.clear(X, Z)) continue;
        if (T.mat && T.mat(X, Z) > 0.5) continue;
        const r = P.r(Z);
        const sx = 540 + (P.p(X, 0, Z)[0] - A.cam.cx) * k;
        if (sx < -80 || sx > 1160) continue;
        const H = T.H(X, Z);
        const sy = 960 + (PP(A, X, H, Z)[1] - A.cam.cy) * k;
        if (sy < -40 || sy > 1990) continue;
        const s = (tf.size ?? 52) * (0.7 + 0.6 * hash(seed + 17));
        if (s * r * k < 1.6) continue;
        const fade = tf.near ? sstep(0.7 * tf.near, tf.near, Z + A.Dc) : 1;
        if (fade <= 0.01) continue;
        const tuft = <Tuft key={`t${i}_${j}_${tf.seed ?? 1}`} A={A} X={X} Z={Z} H={H} s={s} seed={seed} frame={frame} />;
        els.push({ Z, node: fade < 0.999 ? <g key={`f${i}_${j}_${tf.seed ?? 1}`} opacity={fade}>{tuft}</g> : tuft });
      }
    }
  }
  for (const it of items) els.push({ Z: it.Z, node: it.node });
  // far to near; at equal Z the item comes after the slice
  els.sort((a, b) => b.Z - a.Z);
  return <g>{els.map((e, i) => <React.Fragment key={i}>{e.node}</React.Fragment>)}</g>;
};

/** a pale caliche road strip on the ground (a decal) */
export const DirtRoad: React.FC<{ A: AirWorld; T: Terrain; path: [number, number][]; w?: number; uid: string }> = ({ A, T, path, w = 260 }) => {
  const L: P2[] = [];
  const R: P2[] = [];
  const zMin = A.P.zNear + 40;
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l;
    const nz = dx / l;
    const [X, Z] = path[i];
    if (Z < zMin) continue;
    L.push(PP(A, X + nx * w * 0.5, T.H(X + nx * w * 0.5, Z + nz * w * 0.5) + 1, Z + nz * w * 0.5));
    R.push(PP(A, X - nx * w * 0.5, T.H(X - nx * w * 0.5, Z - nz * w * 0.5) + 1, Z - nz * w * 0.5));
  }
  if (L.length < 2) return null;
  const Zm = path.reduce((s, p) => s + p[1], 0) / path.length;
  return <path d={polyD([...L, ...R.reverse()])} fill={A.tone(mixHex(RMAT.caliche.mid, RMAT.caliche.lit, 0.4), Zm, 0)} opacity={0.92} />;
};

// ===================================================================================================================
// THE FAR HILLS
// ===================================================================================================================
export type Ridge = { Z: number; H: number; amp: number; lambda: number; seed: number; tree: number; dots: number };
export const ridgeSeries = (o: { n: number; zNear: number; ratio: number; hNear: number; hFar: number; amp?: number; seed?: number; tops?: number[] }): Ridge[] =>
  Array.from({ length: o.n }, (_, i) => {
    const Z = o.zNear * Math.pow(o.ratio, i);
    const t = o.n > 1 ? i / (o.n - 1) : 0;
    return {
      Z,
      H: o.tops ? o.tops[i] : lerp(o.hNear, o.hFar, t),
      amp: (o.amp ?? 0.05) * (Z + 1500),
      lambda: 0.55 * (Z + 1500),
      seed: (o.seed ?? 1) * 17 + i * 3.7,
      tree: 0.005 * (Z + 1500),
      dots: 1 - t,
    };
  });
const ridgeTop = (rd: Ridge, X: number) => {
  const l = rd.lambda;
  const s = rd.seed;
  return rd.H + rd.amp * (0.55 * Math.sin(X / l + s) + 0.3 * Math.sin(X / (0.43 * l) + s * 1.7) + 0.15 * Math.sin(X / (0.19 * l) + s * 2.9) + 0.12 * (vnoise(X / (0.3 * l), s, 5) - 0.5));
};
export const RidgeStack: React.FC<{ A: AirWorld; ridges: Ridge[]; uid: string; frame?: number }> = ({ A, ridges, uid }) => {
  const P = A.P;
  const k = A.k;
  const sorted = ridges.slice().sort((a, b) => b.Z - a.Z);
  const bottomY = A.cam.cy + 1040 / k;
  const toSy = (y: number) => 960 + (y - A.cam.cy) * k;
  return (
    <g>
      {sorted.map((rd, i) => {
        const Z = rd.Z;
        if (Z < P.zNear + 100) return null;
        const r = P.r(Z);
        const hw = 620 / (k * r);
        const N = 64;
        const pts: P2[] = [];
        let yMin = Infinity;
        for (let j = 0; j <= N; j++) {
          const X = A.cam.cx - hw + (2 * hw * j) / N;
          const p = PP(A, X, ridgeTop(rd, X), Z);
          pts.push(p);
          yMin = Math.min(yMin, p[1]);
        }
        if (toSy(yMin) > 1980) return null;
        const fog = A.fog(Z);
        const hgt = Math.max(0, rd.H);
        // the ridge's own colour: dry grass darkened by cedar, at its crest; mist below it
        const local = mixHex(mixHex(RMAT.grass.mid, RMAT.cedar.mid, 0.45), RMAT.grassDry.mid, 0.2 * (1 - rd.dots));
        const sky = A.screenAir(yMin - 20 / k);
        const far = Math.pow(c01(fog / 0.92), 1.3);
        const crestC = mixHex(A.tone(local, Z, hgt), sky, 0.8 * far);
        const air = mixHex(A.airHex(Z, hgt), sky, 0.5);
        const mistC = mixHex(crestC, mixHex(air, PAL.creamLo, 0.15), 0.45 + 0.2 * (1 - fog));
        // the band: down to the next nearer ridge's crest (where it is hidden anyway), at least ~90 px
        const next = sorted[i + 1];
        let band = 160 / k;
        if (next && next.Z > P.zNear + 100) {
          const yN = PP(A, A.cam.cx, next.H, next.Z)[1];
          band = Math.max(90 / k, Math.min(380 / k, yN - yMin + 30 / k));
        }
        const gid = `${uid}r${i}`;
        const d = `M${pts.map(Pt).join("L")}L${n2(pts[N][0])},${n2(bottomY)}L${n2(pts[0][0])},${n2(bottomY)}Z`;
        // cedar dots below the crest line on the nearer ridges
        let dots = "";
        if (rd.dots > 0.75 && fog < 0.5) {
          const sp = rd.tree * 5.5;
          const x0 = Math.floor((A.cam.cx - hw) / sp);
          const x1 = Math.ceil((A.cam.cx + hw) / sp);
          for (let q = x0; q <= x1; q++) {
            const hs = hash2(q, Math.round(rd.seed * 10), 9);
            if (hs > (0.42 * rd.dots + 0.08) * (vnoise(q * 0.25, rd.seed, 3) > 0.45 ? 1 : 0.15)) continue;
            const X = (q + hash(hs * 100)) * sp;
            const down = hash(hs * 300) * rd.amp * 1.1;
            const p = PP(A, X, ridgeTop(rd, X) - rd.tree * 0.4 - down, Z);
            const rx = rd.tree * r * (0.8 + 0.6 * hash(hs * 500));
            if (rx * k < 0.7) continue;
            dots += `M${n2(p[0] - rx)},${n2(p[1])}a${n2(rx)},${n2(rx * 0.8)} 0 1 0 ${n2(2 * rx)},0a${n2(rx)},${n2(rx * 0.8)} 0 1 0 ${n2(-2 * rx)},0Z`;
          }
        }
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={n2(yMin)} x2="0" y2={n2(yMin + band)}>
                <stop offset="0" stopColor={crestC} />
                <stop offset="0.35" stopColor={mixHex(crestC, mistC, 0.45)} />
                <stop offset="1" stopColor={mistC} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${gid})`} />
            {dots ? <path d={dots} fill={A.tone(mixHex(RMAT.cedar.dark, RMAT.cedar.mid, 0.3), Z, hgt)} opacity={0.45 * (1 - fog)} /> : null}
            <path d={`M${pts.map(Pt).join("L")}`} fill="none" stroke={PAL.cream} strokeWidth={A.lw(1.2)} strokeOpacity={0.16 * (1 - fog)} />
          </g>
        );
      })}
    </g>
  );
};

// ===================================================================================================================
// TREES (gouache: shapes at ~500 units tall, the cast's crescent and texture)
// ===================================================================================================================
const ellP = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${n2(cx - rx)} ${n2(cy)} A ${n2(rx)} ${n2(ry)} 0 1 0 ${n2(cx + rx)} ${n2(cy)} A ${n2(rx)} ${n2(ry)} 0 1 0 ${n2(cx - rx)} ${n2(cy)} Z`;
const blobP = (cx: number, cy: number, rx: number, ry: number, seed: number, wob = 0.1) => {
  const pts: P2[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + wob * (hash(seed + i * 1.3) - 0.5) * 2;
    pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }
  let d = `M ${n2((pts[0][0] + pts[n - 1][0]) / 2)} ${n2((pts[0][1] + pts[n - 1][1]) / 2)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    d += ` Q ${n2(p[0])} ${n2(p[1])} ${n2((p[0] + q[0]) / 2)} ${n2((p[1] + q[1]) / 2)}`;
  }
  return `${d} Z`;
};
/** a live oak: a short trunk forking into limbs, a broad dome of leaf masses (units: ~500 tall, ~760 wide) */
const liveOakShapes = (seed: number, frame: number): Shape[] => {
  const S: Shape[] = [];
  const sway = (i: number) => Math.sin(frame * 0.05 + i * 0.9 + seed) * 2.2;
  S.push({ d: ellP(0, -2, 150, 14), fill: "#3A3226", cast: true, op: 0.35 });
  S.push({ d: "M -34 0 C -30 -60 -26 -120 -40 -170 L -14 -178 C -4 -130 4 -80 16 0 Z", fill: RMAT.bark.mid });
  S.push({ d: "M -30 -150 C -90 -190 -170 -205 -250 -215 L -248 -200 C -170 -188 -100 -170 -36 -128 Z", fill: RMAT.bark.mid });
  S.push({ d: "M -10 -160 C 60 -200 150 -220 240 -222 L 242 -206 C 150 -204 70 -184 -4 -140 Z", fill: RMAT.bark.mid });
  S.push({ d: "M -26 -170 C -20 -230 -10 -280 0 -320 L 14 -316 C 6 -270 0 -220 -8 -168 Z", fill: RMAT.bark.dark });
  const masses: [number, number, number, number][] = [
    [-290, -240, 120, 70],
    [-180, -300, 150, 95],
    [-30, -350, 170, 110],
    [140, -310, 160, 95],
    [290, -250, 120, 72],
    [-90, -250, 170, 80],
    [110, -240, 170, 80],
    [-200, -220, 100, 55],
    [230, -215, 100, 55],
  ];
  masses.forEach(([x, y, rx, ry], i) => {
    const lit = mixHex(RMAT.oak.mid, RMAT.oak.lit, c01(0.65 - (x + 300) / 900 - (y + 350) / 500));
    S.push({ d: blobP(x + sway(i), y, rx, ry, seed + i * 7, 0.12), fill: i >= 5 ? mixHex(RMAT.oak.mid, RMAT.oak.dark, 0.35) : lit });
  });
  // a few lit clumps on the upper left
  [
    [-200, -335, 70, 40],
    [-60, -395, 80, 45],
    [80, -365, 60, 34],
  ].forEach(([x, y, rx, ry], i) => S.push({ d: blobP(x + sway(i + 10), y, rx, ry, seed + 50 + i, 0.15), fill: RMAT.oak.lit, sh: 0.6 }));
  return S;
};
const cedarShapes = (seed: number, frame: number, n = 3): Shape[] => {
  const S: Shape[] = [];
  const bushes = [
    [0, 500, 170],
    [-150, 330, 120],
    [150, 380, 135],
  ].slice(0, n);
  bushes
    .slice()
    .sort((a, b) => a[1] - b[1])
    .forEach(([x, h, w], i) => {
      const sw = Math.sin(frame * 0.05 + i + seed) * 2;
      const top = -h;
      S.push({
        d: `M ${n2(x - w)} -4 C ${n2(x - w * 1.05)} ${n2(top * 0.45)} ${n2(x - w * 0.45)} ${n2(top * 0.85)} ${n2(x + sw)} ${n2(top)} C ${n2(x + w * 0.5)} ${n2(top * 0.85)} ${n2(x + w * 1.05)} ${n2(top * 0.45)} ${n2(x + w)} -4 Z`,
        fill: mixHex(RMAT.cedar.mid, RMAT.cedar.dark, 0.2 + 0.25 * hash(seed + i)),
      });
      S.push({ d: blobP(x - w * 0.3 + sw * 0.5, top * 0.62, w * 0.42, h * 0.16, seed + i * 3, 0.2), fill: RMAT.cedar.lit, sh: 0.5, op: 0.8 });
    });
  return S;
};
export const LiveOak: React.FC<{ A: AirWorld; X: number; Z: number; H: number; size?: number; seed?: number; frame: number; uid: string }> = ({ A, X, Z, H, size = 7 * U, seed = 1, frame, uid }) => {
  const r = A.P.r(Z);
  const sc = (r * size) / 420;
  return <RanchPaint shapes={liveOakShapes(seed, frame)} at={PP(A, X, H, Z)} scale={sc} uid={uid} fog={{ rgb: A.airHex(Z, H + size * 0.5), amount: A.fog(Z) }} unitPx={A.k} />;
};
export const CedarClump: React.FC<{ A: AirWorld; X: number; Z: number; H: number; size?: number; seed?: number; n?: number; frame: number; uid: string }> = ({ A, X, Z, H, size = 3 * U, seed = 1, n = 3, frame, uid }) => {
  const r = A.P.r(Z);
  const sc = (r * size) / 500;
  return <RanchPaint shapes={cedarShapes(seed, frame, n)} at={PP(A, X, H, Z)} scale={sc} uid={uid} fog={{ rgb: A.airHex(Z, H + size * 0.5), amount: A.fog(Z) }} unitPx={A.k} />;
};

// ===================================================================================================================
// FENCES
// ===================================================================================================================
export const FencePost: React.FC<{ A: AirWorld; X: number; Z: number; H: number; h?: number; w?: number }> = ({ A, X, Z, H, h = 230, w = 16 }) => {
  const a = PP(A, X, H, Z);
  const b = PP(A, X + 2, H + h, Z);
  const r = A.P.r(Z);
  const c = A.tone(RMAT.post.mid, Z, H + h / 2);
  return (
    <g>
      <path d={`M${Pt(a)}L${Pt(b)}`} stroke={c} strokeWidth={w * r} strokeLinecap="round" />
      <path d={`M${n2(a[0] - w * 0.3 * r)},${n2(a[1])}L${n2(b[0] - w * 0.3 * r)},${n2(b[1])}`} stroke={A.tone(RMAT.post.lit, Z, H + h / 2)} strokeWidth={w * 0.3 * r} strokeOpacity={0.7} />
    </g>
  );
};
export const FenceLine: React.FC<{ A: AirWorld; T: Terrain; pts: [number, number][]; spacing?: number }> = ({ A, T, pts, spacing = 420 }) => {
  const posts: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / spacing));
    for (let k = 0; k < n; k++) posts.push([lerp(x0, x1, k / n), lerp(z0, z1, k / n)]);
  }
  posts.push(pts[pts.length - 1]);
  const vis = posts.filter(([, z]) => z > A.P.zNear + 40).sort((a, b) => b[1] - a[1]);
  const wires = [80, 140, 200].map((h, wi) => {
    let d = "";
    for (let i = 0; i < posts.length - 1; i++) {
      const [x0, z0] = posts[i];
      const [x1, z1] = posts[i + 1];
      if (Math.min(z0, z1) < A.P.zNear + 40) continue;
      d += `M${Pt(PP(A, x0, T.H(x0, z0) + h, z0))}L${Pt(PP(A, x1, T.H(x1, z1) + h, z1))}`;
    }
    return <path key={wi} d={d} fill="none" stroke={A.tone("#6A645A", 1500, h)} strokeWidth={A.lw(0.7)} strokeOpacity={0.6} />;
  });
  return (
    <g>
      {wires}
      {vis.map(([x, z], i) => (
        <FencePost key={i} A={A} X={x} Z={z} H={T.H(x, z)} />
      ))}
    </g>
  );
};

// ===================================================================================================================
// THE DOG-RUN HOUSE (Rebekah's, c. 1910)
// ===================================================================================================================
export const DOGRUN = {
  roomW: 540,
  bwW: 360,
  porchD: 250,
  roomD: 500,
  wallH: 410,
  ridgeH: 700,
  floorH: 12,
  /** the porch posts' X offsets from X0 */
  posts: [-700, -180, 180],
  logH: 46,
};
/** the dog-run house's ranges relative to (X0, Z0): x of the rooms and the breezeway, z of the porch and rooms */
export const dogRunRanges = (X0: number, Z0: number) => {
  const D = DOGRUN;
  const half = D.roomW + D.bwW / 2;
  return {
    xL: X0 - half,
    xR: X0 + half,
    bw: [X0 - D.bwW / 2, X0 + D.bwW / 2] as [number, number],
    porch: [Z0, Z0 + D.porchD] as [number, number],
    rooms: [Z0 + D.porchD, Z0 + D.porchD + D.roomD] as [number, number],
  };
};
const logWall = (A: AirWorld, pts: [W3, W3], h0: number, h1: number, key: string, ends: boolean) => {
  // a wall plane from pts[0] to pts[1] (bottom corners), log courses with oatmeal chinking
  const [a, b] = pts;
  const els: React.ReactNode[] = [];
  const Zm = (a[2] + b[2]) / 2;
  const r = A.P.r(Zm);
  const chink = A.tone(CHINK, Zm, (h0 + h1) / 2);
  const dark = A.tone(RMAT.timber.dark, Zm, (h0 + h1) / 2);
  let d = "";
  let dd = "";
  for (let h = h0 + DOGRUN.logH; h < h1 - 4; h += DOGRUN.logH) {
    d += `M${Pt(PP(A, a[0], h, a[2]))}L${Pt(PP(A, b[0], h, b[2]))}`;
    dd += `M${Pt(PP(A, a[0], h - 5, a[2]))}L${Pt(PP(A, b[0], h - 5, b[2]))}`;
  }
  els.push(<path key={`${key}d`} d={dd} stroke={dark} strokeWidth={4 * r} strokeOpacity={0.35} fill="none" />);
  els.push(<path key={`${key}c`} d={d} stroke={chink} strokeWidth={5 * r} strokeOpacity={0.8} fill="none" />);
  if (ends) {
    // the log ends at the corners (saddle notches), alternating courses
    let k = 0;
    for (let h = h0 + DOGRUN.logH / 2; h < h1; h += DOGRUN.logH, k++) {
      for (const [p, dir] of [
        [a, -1],
        [b, 1],
      ] as [W3, number][]) {
        if ((k + (dir > 0 ? 1 : 0)) % 2) continue;
        const dx = b[0] - a[0];
        const dz = b[2] - a[2];
        const l = Math.hypot(dx, dz) || 1;
        const c = PP(A, p[0] + (dir * dx * 18) / l, h, p[2] + (dir * dz * 18) / l);
        els.push(<ellipse key={`${key}e${k}${dir}`} cx={c[0]} cy={c[1]} rx={22 * r} ry={21 * r} fill={A.tone(RMAT.timber.lit, Zm, h)} stroke={dark} strokeWidth={A.lw(0.8)} strokeOpacity={0.6} />);
      }
    }
  }
  return els;
};
/** a convex hull (monotone chain) of 2D points */
const hull2 = (pts: P2[]): P2[] => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
/** a saddle-notched log corner at (cx, cz): sx / sz = which way the corner faces (+-1). Courses alternate: the logs of
 *  the front/back wall (along X) stick out past the side wall by `out` (end grain facing sx), and those of the side
 *  wall (along Z) stick out past the front/back wall (end grain facing sz). Each stub = the hull of its two end discs,
 *  then its end grain disc when that faces the camera. */
const logCorner = (A: AirWorld, cx: number, cz: number, sx: number, sz: number, h0: number, h1: number, M: Mat, key: string) => {
  const els: React.ReactNode[] = [];
  const R = DOGRUN.logH * 0.5;
  const out = 26;
  const Zm = cz;
  const grain = A.tone(mixHex(M.lit, CHINK, 0.35), Zm, (h0 + h1) / 2);
  const body = A.tone(M.mid, Zm, (h0 + h1) / 2);
  const line = A.tone(mixHex(M.dark, PAL.shadow, 0.3), Zm, (h0 + h1) / 2);
  const ring = (c: W3, axis: "x" | "z"): P2[] =>
    Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const u = Math.cos(a) * R;
      const v = Math.sin(a) * R * 0.95;
      return axis === "x" ? PP(A, c[0], c[1] + v, c[2] + u) : PP(A, c[0] + u, c[1] + v, c[2]);
    });
  let k = 0;
  for (let h = h0 + R; h < h1 - 2; h += DOGRUN.logH, k++) {
    const alongX = k % 2 === 0;
    // the stub from just inside the corner to `out` past it
    const base: W3 = alongX ? [cx - sx * 6, h, cz] : [cx, h, cz - sz * 6];
    const end: W3 = alongX ? [cx + sx * out, h, cz] : [cx, h, cz + sz * out];
    const axis = alongX ? "x" : "z";
    const rb = ring(base, axis);
    const re = ring(end, axis);
    const hl = hull2(rb.concat(re));
    els.push(<path key={`${key}b${k}`} d={polyD(hl)} fill={body} stroke={line} strokeWidth={A.lw(0.7)} strokeOpacity={0.6} strokeLinejoin="round" />);
    const n: W3 = alongX ? [sx, 0, 0] : [0, 0, sz];
    if (seen(A, end, n)) els.push(<path key={`${key}e${k}`} d={polyD(re)} fill={grain} stroke={line} strokeWidth={A.lw(0.7)} strokeOpacity={0.7} />);
  }
  return els;
};
export const DogRunHouse: React.FC<{ A: AirWorld; X0: number; Z0: number; H0?: number; inside?: React.ReactNode; timber?: Mat }> = ({ A, X0, Z0, H0 = 0, inside, timber }) => {
  const TM = timber ?? RMAT.timber;
  const D = DOGRUN;
  const g = dogRunRanges(X0, Z0);
  const zf = g.rooms[0];
  const zb = g.rooms[1];
  const zr = (zf + zb) / 2;
  const top = H0 + D.wallH;
  const ridge = H0 + D.ridgeH;
  const ovX = 50;
  const ovZ = 40;
  const els: React.ReactNode[] = [];
  const push = (n: React.ReactNode) => n && els.push(n);
  // the breezeway floor (boards) and the porch floor (a low platform)
  push(faceEl(A, [[g.bw[0], H0 + D.floorH, zf], [g.bw[1], H0 + D.floorH, zf], [g.bw[1], H0 + D.floorH, zb], [g.bw[0], H0 + D.floorH, zb]], RMAT.boards, "bwf", { noCull: true }));
  // the stone chimney at the left end (behind the left room's outer wall)
  const chX0 = g.xL - 120;
  const chX1 = g.xL;
  const cz0 = zr - 80;
  const cz1 = zr + 70;
  boxFaces(A, chX0 - 20, chX1, H0, H0 + 300, cz0 - 15, cz1 + 15, RMAT.stone, "chb").forEach(push);
  boxFaces(A, chX0 + 10, chX1, H0 + 300, ridge + 110, cz0, cz1, RMAT.stone, "cht").forEach(push);
  // the two log rooms
  const room = (x0: number, x1: number, key: string, sideL: boolean) => {
    // back, sides, front faces with back-face culling (the box), then logs on the visible faces
    boxFaces(A, x0, x1, H0, top, zf, zb, TM, key, ["tp", "bt"]).forEach(push);
    // front wall logs
    if (seen(A, [x0, H0, zf], [0, 0, -1])) els.push(...logWall(A, [[x0, H0, zf], [x1, H0, zf]], H0, top, `${key}F`, false));
    // the side walls: the breezeway side (a door) and the outer side
    const inner = sideL ? x1 : x0;
    const outer = sideL ? x0 : x1;
    const nIn: W3 = [sideL ? 1 : -1, 0, 0];
    const nOut: W3 = [sideL ? -1 : 1, 0, 0];
    if (seen(A, [inner, H0, zr], nIn)) {
      els.push(...logWall(A, [[inner, H0, zf], [inner, H0, zb]], H0, top, `${key}I`, false));
      // the door into the room off the breezeway
      const dz0 = zr - 70;
      const dz1 = zr + 70;
      push(faceEl(A, [[inner, H0 + D.floorH, dz0], [inner, H0 + D.floorH, dz1], [inner, H0 + 330, dz1], [inner, H0 + 330, dz0]], TM, `${key}door`, { noCull: true, fillOverride: mixHex(TM.dark, PAL.shadow, 0.4) }));
    }
    if (seen(A, [outer, H0, zr], nOut)) els.push(...logWall(A, [[outer, H0, zf], [outer, H0, zb]], H0, top, `${key}O`, false));
    // a small window in the front wall
    const wx = (x0 + x1) / 2;
    if (seen(A, [wx, H0, zf], [0, 0, -1])) {
      const fr: W3[] = [[wx - 85, H0 + 140, zf - 2], [wx + 85, H0 + 140, zf - 2], [wx + 85, H0 + 320, zf - 2], [wx - 85, H0 + 320, zf - 2]];
      push(faceEl(A, fr, RMAT.boards, `${key}wf`, { noCull: true, fillOverride: "#B8AB8C" }));
      const gl: W3[] = [[wx - 68, H0 + 155, zf - 3], [wx + 68, H0 + 155, zf - 3], [wx + 68, H0 + 305, zf - 3], [wx - 68, H0 + 305, zf - 3]];
      push(faceEl(A, gl, RMAT.boards, `${key}wg`, { noCull: true, fillOverride: mixHex("#2F3A39", "#5F877D", 0.25) }));
      const c1 = PP(A, wx, H0 + 155, zf - 4);
      const c2 = PP(A, wx, H0 + 305, zf - 4);
      const c3 = PP(A, wx - 68, H0 + 230, zf - 4);
      const c4 = PP(A, wx + 68, H0 + 230, zf - 4);
      els.push(<path key={`${key}wx`} d={`M${Pt(c1)}L${Pt(c2)}M${Pt(c3)}L${Pt(c4)}`} stroke={A.tone("#B8AB8C", zf, 230)} strokeWidth={9 * A.P.r(zf)} />);
    }
    // the notched corners: at each corner the logs of the two walls cross on alternate courses, each sticking out a
    // little past the other wall (a short round stub with its end grain), in 3D, so they read from every angle
    for (const [cx, sx] of [
      [x0, -1],
      [x1, 1],
    ] as [number, number][]) {
      for (const [cz, sz] of [
        [zf, -1],
        [zb, 1],
      ] as [number, number][]) {
        const sideSeen = seen(A, [cx, H0 + 200, zr], [sx, 0, 0]);
        const faceSeen = seen(A, [(x0 + x1) / 2, H0 + 200, cz], [0, 0, sz]);
        if (!sideSeen && !faceSeen) continue;
        els.push(...logCorner(A, cx, cz, sx, sz, H0, top, TM, `${key}k${sx}${sz}`));
      }
    }
  };
  // the roof's undersides (soffits) when the camera is below a slope's plane: drawn BEFORE the walls, which hide all
  // of it but the overhangs
  {
    const rx0u = g.xL - ovX;
    const rx1u = g.xR + ovX;
    const zfEu = zf - ovZ;
    const zbEu = zb + ovZ;
    const eHu = top - 20;
    const soffit = mixHex(RMAT.boards.dark, PAL.shadow, 0.3);
    const nF: W3 = [0, zr - zfEu, -(ridge - eHu)];
    const nB: W3 = [0, zbEu - zr, ridge - eHu];
    if (!seen(A, [X0, (eHu + ridge) / 2, (zfEu + zr) / 2], nF))
      push(faceEl(A, [[rx0u, eHu, zfEu], [rx1u, eHu, zfEu], [rx1u, ridge, zr], [rx0u, ridge, zr]], RMAT.boards, "rfu", { noCull: true, fillOverride: soffit }));
    if (!seen(A, [X0, (eHu + ridge) / 2, (zbEu + zr) / 2], nB))
      push(faceEl(A, [[rx1u, eHu, zbEu], [rx0u, eHu, zbEu], [rx0u, ridge, zr], [rx1u, ridge, zr]], RMAT.boards, "rbu", { noCull: true, fillOverride: soffit }));
  }
  // the far room first (from where the camera stands)
  const roomsOrder = A.cam.cx < X0 ? (["R", "L"] as const) : (["L", "R"] as const);
  for (const s of roomsOrder) {
    if (s === "L") room(g.xL, g.bw[0], "rl", true);
    else room(g.bw[1], g.xR, "rr", false);
  }
  // the main gable roof: the gable-end triangles, then the two slopes (culled), the eave's soffit
  const rx0 = g.xL - ovX;
  const rx1 = g.xR + ovX;
  const zfE = zf - ovZ;
  const zbE = zb + ovZ;
  const eH = top - 20;
  for (const [x, n] of [
    [g.xL, -1],
    [g.xR, 1],
  ] as [number, number][]) {
    if (!seen(A, [x, top, zr], [n, 0, 0])) continue;
    push(faceEl(A, [[x, top, zf], [x, top, zb], [x, ridge - 10, zr]], TM, `gab${n}`, { noCull: true }));
    // vertical gable boards
    let d = "";
    for (let z = zf + 40; z < zb; z += 46) {
      const hTop = top + (ridge - 10 - top) * (1 - Math.abs(z - zr) / (zr - zf));
      d += `M${Pt(PP(A, x, top, z))}L${Pt(PP(A, x, hTop, z))}`;
    }
    els.push(<path key={`gb${n}`} d={d} stroke={A.tone(TM.dark, zr, top)} strokeWidth={A.lw(0.8)} strokeOpacity={0.5} />);
  }
  push(faceEl(A, [[rx0, eH, zfE], [rx1, eH, zfE], [rx1, ridge, zr], [rx0, ridge, zr]], RMAT.slate, "rf"));
  push(faceEl(A, [[rx1, eH, zbE], [rx0, eH, zbE], [rx0, ridge, zr], [rx1, ridge, zr]], RMAT.slate, "rb"));
  for (const [x, n] of [
    [rx0, -1],
    [rx1, 1],
  ] as [number, number][]) {
    // the barge boards along the two roof edges (thin quads; never the whole gable)
    if (seen(A, [x, ridge - 40, zr], [n, 0, 0])) {
      push(faceEl(A, [[x, eH, zfE], [x, ridge, zr], [x, ridge + 16, zr], [x, eH + 16, zfE]], TM, `re${n}f`, { noCull: true }));
      push(faceEl(A, [[x, eH, zbE], [x, ridge, zr], [x, ridge + 16, zr], [x, eH + 16, zbE]], TM, `re${n}b`, { noCull: true }));
    }
  }
  // shingle courses on the visible slope
  if (seen(A, [X0, (eH + ridge) / 2, (zfE + zr) / 2], [0, 0.66, -0.75])) {
    let d = "";
    for (let t = 0.2; t < 1; t += 0.2) {
      const h = lerp(eH, ridge, t);
      const z = lerp(zfE, zr, t);
      d += `M${Pt(PP(A, rx0, h, z))}L${Pt(PP(A, rx1, h, z))}`;
    }
    els.push(<path key="shg" d={d} stroke={A.tone(RMAT.slate.dark, zr, ridge)} strokeWidth={A.lw(0.8)} strokeOpacity={0.35} />);
  }
  // the ridge's cream rim
  els.push(<path key="rrim" d={`M${Pt(PP(A, rx0, ridge, zr))}L${Pt(PP(A, rx1, ridge, zr))}`} stroke={PAL.cream} strokeWidth={A.lw(1.4)} strokeOpacity={0.45 * (1 - A.fog(zr))} />);
  // the porch floor (front edge face and top)
  const px0 = g.xL - 30;
  const px1 = g.xR + 30;
  boxFaces(A, px0, px1, H0, H0 + D.floorH, g.porch[0], g.porch[1], RMAT.boards, "pf", ["bt", "bk"]).forEach(push);
  if (inside) els.push(<g key="inside">{inside}</g>);
  // the porch roof (a catslide from under the eave down to the posts) and its posts
  const ph0 = top - 30;
  const ph1 = H0 + 345;
  const pz0 = zf - 30;
  const pz1 = g.porch[0] - 40;
  for (const dx of D.posts) {
    const x = X0 + dx;
    boxFaces(A, x - 13, x + 13, H0 + D.floorH, ph1 - 4, g.porch[0] + 6, g.porch[0] + 32, TM, `po${dx}`, ["bt", "tp", "bk"]).forEach(push);
  }
  push(faceEl(A, [[px0, ph1, pz1], [px1, ph1, pz1], [px1, ph0, pz0], [px0, ph0, pz0]], RMAT.slate, "prt"));
  push(faceEl(A, [[px1, ph1, pz1], [px0, ph1, pz1], [px0, ph0, pz0], [px1, ph0, pz0]], RMAT.boards, "prb", { fillOverride: mixHex(RMAT.boards.dark, PAL.shadow, 0.25) }));
  // the porch roof's front fascia (a beam on the posts)
  boxFaces(A, px0, px1, ph1 - 34, ph1, pz1 + 30, pz1 + 60, TM, "fas", ["bt", "bk", "tp"]).forEach(push);
  els.push(<path key="prim" d={`M${Pt(PP(A, px0, ph1, pz1))}L${Pt(PP(A, px1, ph1, pz1))}`} stroke={PAL.cream} strokeWidth={A.lw(1.2)} strokeOpacity={0.35} />);
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE 1970s FARMHOUSE AND ITS WINDMILL
// ===================================================================================================================
export const FARM = {
  w: 1400,
  d: 1000,
  wallH: 470,
  ridgeH: 760,
  floorH: 90,
  porchD: 330,
  /** porch posts' X offsets from X0 */
  posts: [-640, -220, 220, 640],
};
/** the farmhouse's ranges relative to (X0, Z0) = the centre of the porch's front edge */
export const farmRanges = (X0: number, Z0: number) => ({
  x: [X0 - FARM.w / 2, X0 + FARM.w / 2] as [number, number],
  porch: [Z0, Z0 + FARM.porchD] as [number, number],
  house: [Z0 + FARM.porchD, Z0 + FARM.porchD + FARM.d] as [number, number],
  /** the porch floor's height above H0 */
  floor: FARM.floorH,
});
export const FarmHouse: React.FC<{ A: AirWorld; X0: number; Z0: number; H0?: number; porch?: React.ReactNode }> = ({ A, X0, Z0, H0 = 0, porch }) => {
  const F = FARM;
  const g = farmRanges(X0, Z0);
  const [x0, x1] = g.x;
  const [zf, zb] = g.house;
  const zr = (zf + zb) / 2;
  const top = H0 + F.wallH;
  const ridge = H0 + F.ridgeH;
  const els: React.ReactNode[] = [];
  const push = (n: React.ReactNode) => n && els.push(n);
  // a low stone foundation and the white board walls
  boxFaces(A, x0, x1, H0, H0 + F.floorH, zf, zb, RMAT.stone, "fd", ["tp", "bt"]).forEach(push);
  boxFaces(A, x0, x1, H0 + F.floorH, top, zf, zb, RMAT.white, "fw", ["tp", "bt"]).forEach(push);
  // siding lines on the visible walls
  const siding = (a: W3, b: W3, key: string) => {
    let d = "";
    for (let h = H0 + F.floorH + 32; h < top; h += 32) d += `M${Pt(PP(A, a[0], h, a[2]))}L${Pt(PP(A, b[0], h, b[2]))}`;
    const Zm = (a[2] + b[2]) / 2;
    els.push(<path key={key} d={d} stroke={A.tone(RMAT.white.dark, Zm, 300)} strokeWidth={A.lw(0.7)} strokeOpacity={0.4} fill="none" />);
  };
  if (seen(A, [X0, top, zf], [0, 0, -1])) siding([x0, 0, zf], [x1, 0, zf], "sf");
  if (seen(A, [x0, top, zr], [-1, 0, 0])) siding([x0, 0, zf], [x0, 0, zb], "sl");
  if (seen(A, [x1, top, zr], [1, 0, 0])) siding([x1, 0, zf], [x1, 0, zb], "sr");
  // windows and the door on the front
  const win = (wx: number, key: string) => {
    push(faceEl(A, [[wx - 95, H0 + 190, zf - 2], [wx + 95, H0 + 190, zf - 2], [wx + 95, H0 + 420, zf - 2], [wx - 95, H0 + 420, zf - 2]], RMAT.white, `${key}t`, { noCull: true, fillOverride: "#F1EBDD" }));
    push(faceEl(A, [[wx - 78, H0 + 205, zf - 3], [wx + 78, H0 + 205, zf - 3], [wx + 78, H0 + 405, zf - 3], [wx - 78, H0 + 405, zf - 3]], RMAT.white, `${key}g`, { noCull: true, fillOverride: mixHex("#2F3A39", "#5F877D", 0.3) }));
    const c1 = PP(A, wx - 78, H0 + 305, zf - 4);
    const c2 = PP(A, wx + 78, H0 + 305, zf - 4);
    els.push(<path key={`${key}x`} d={`M${Pt(c1)}L${Pt(c2)}`} stroke={A.tone("#F1EBDD", zf, 300)} strokeWidth={7 * A.P.r(zf)} />);
  };
  if (seen(A, [X0, top, zf], [0, 0, -1])) {
    win(X0 - 430, "w1");
    win(X0 + 430, "w2");
    push(faceEl(A, [[X0 - 70, H0 + F.floorH, zf - 2], [X0 + 70, H0 + F.floorH, zf - 2], [X0 + 70, H0 + 420, zf - 2], [X0 - 70, H0 + 420, zf - 2]], RMAT.timber, "door", { noCull: true, fillOverride: "#6B5A47" }));
  }
  // the tin roof: gable ends and slopes with corrugation lines
  const ov = 50;
  const rx0 = x0 - ov;
  const rx1 = x1 + ov;
  const zfE = zf - 50;
  const zbE = zb + 50;
  for (const [x, n] of [
    [x0, -1],
    [x1, 1],
  ] as [number, number][]) {
    if (seen(A, [x, top, zr], [n, 0, 0])) push(faceEl(A, [[x, top, zf], [x, top, zb], [x, ridge - 10, zr]], RMAT.white, `fg${n}`, { noCull: true }));
  }
  push(faceEl(A, [[rx0, top - 15, zfE], [rx1, top - 15, zfE], [rx1, ridge, zr], [rx0, ridge, zr]], RMAT.tin, "tf"));
  push(faceEl(A, [[rx1, top - 15, zbE], [rx0, top - 15, zbE], [rx0, ridge, zr], [rx1, ridge, zr]], RMAT.tin, "tb"));
  if (seen(A, [X0, ridge, (zfE + zr) / 2], [0, 0.6, -0.8])) {
    let d = "";
    for (let x = rx0 + 30; x < rx1; x += 36) d += `M${Pt(PP(A, x, top - 15, zfE))}L${Pt(PP(A, x, ridge, zr))}`;
    els.push(<path key="corr" d={d} stroke={A.tone(RMAT.tin.lit, zr, ridge)} strokeWidth={A.lw(0.8)} strokeOpacity={0.45} />);
  }
  els.push(<path key="frim" d={`M${Pt(PP(A, rx0, ridge, zr))}L${Pt(PP(A, rx1, ridge, zr))}`} stroke={PAL.cream} strokeWidth={A.lw(1.4)} strokeOpacity={0.5 * (1 - A.fog(zr))} />);
  // the porch: a raised floor with two steps at the middle
  const [pz0, pz1] = g.porch;
  boxFaces(A, x0, x1, H0, H0 + F.floorH, pz0, pz1, RMAT.boards, "pfl", ["bt", "bk"]).forEach(push);
  boxFaces(A, X0 - 160, X0 + 160, H0, H0 + F.floorH * 0.66, pz0 - 70, pz0, RMAT.boards, "st1", ["bt", "bk"]).forEach(push);
  boxFaces(A, X0 - 160, X0 + 160, H0, H0 + F.floorH * 0.33, pz0 - 140, pz0 - 70, RMAT.boards, "st2", ["bt", "bk"]).forEach(push);
  if (porch) els.push(<g key="porch">{porch}</g>);
  // the porch roof (tin, a shallow shed) on white posts
  const ph1 = H0 + 430;
  const ph0 = top - 30;
  for (const dx of F.posts) {
    const x = X0 + dx;
    boxFaces(A, x - 11, x + 11, H0 + F.floorH, ph1 - 4, pz0 + 14, pz0 + 36, RMAT.white, `fp${dx}`, ["bt", "tp", "bk"]).forEach(push);
  }
  push(faceEl(A, [[x0 - 30, ph1, pz0 - 30], [x1 + 30, ph1, pz0 - 30], [x1 + 30, ph0, zf], [x0 - 30, ph0, zf]], RMAT.tin, "ptr"));
  push(faceEl(A, [[x1 + 30, ph1, pz0 - 30], [x0 - 30, ph1, pz0 - 30], [x0 - 30, ph0, zf], [x1 + 30, ph0, zf]], RMAT.white, "pts"));
  boxFaces(A, x0 - 30, x1 + 30, ph1 - 30, ph1, pz0 - 30, pz0, RMAT.white, "pfa", ["bt", "bk", "tp"]).forEach(push);
  return <g>{els}</g>;
};
/** the windmill: a tapering lattice tower (~9 m), the wheel (18 sails) turning, the tail vane */
export const Windmill: React.FC<{ A: AirWorld; X: number; Z: number; H: number; frame: number; turn?: number; height?: number; facing?: number }> = ({ A, X, Z, H, frame, turn, height = 9 * U, facing = 25 }) => {
  const r0 = 150;
  const r1 = 26;
  const ht = H + height;
  const lw = A.lw(1.1);
  const col = A.tone(RMAT.post.mid, Z, H + height / 2);
  const colLit = A.tone(RMAT.post.lit, Z, H + height / 2);
  const legs = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sz]) => [PP(A, X + sx * r0, H, Z + sz * r0), PP(A, X + sx * r1, ht, Z + sz * r1)] as [P2, P2]);
  let d = "";
  legs.forEach(([a, b]) => (d += `M${Pt(a)}L${Pt(b)}`));
  // braces (the front two faces' X braces at 4 levels)
  const lvl = [0, 0.25, 0.5, 0.75, 1];
  for (let i = 0; i < lvl.length - 1; i++) {
    const t0 = lvl[i];
    const t1 = lvl[i + 1];
    const at = (sx: number, sz: number, t: number) => {
      const rr = lerp(r0, r1, t);
      return PP(A, X + sx * rr, lerp(H, ht, t), Z + sz * rr);
    };
    d += `M${Pt(at(-1, -1, t0))}L${Pt(at(1, -1, t1))}M${Pt(at(1, -1, t0))}L${Pt(at(-1, -1, t1))}`;
    d += `M${Pt(at(-1, -1, t1))}L${Pt(at(1, -1, t1))}M${Pt(at(-1, -1, t0))}L${Pt(at(-1, 1, t1))}M${Pt(at(1, -1, t0))}L${Pt(at(1, 1, t1))}`;
  }
  // the wheel: a disc of sails facing `facing` deg off the camera axis
  const ang = turn ?? frame * 0.07;
  const R = 1.25 * U;
  const hub: [number, number, number] = [X, ht + 30, Z - 60];
  const fy = (facing * Math.PI) / 180;
  const ax: [number, number, number] = [Math.cos(fy), 0, Math.sin(fy)];
  const P3 = (u: number, v: number): P2 => PP(A, hub[0] + ax[0] * u, hub[1] + v, hub[2] + ax[2] * u);
  let sails = "";
  for (let i = 0; i < 18; i++) {
    const a = ang + (i / 18) * Math.PI * 2;
    const a2 = a + 0.13;
    const p0 = P3(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3);
    const p1 = P3(Math.cos(a) * R, Math.sin(a) * R);
    const p2 = P3(Math.cos(a2) * R, Math.sin(a2) * R);
    const p3 = P3(Math.cos(a2) * R * 0.32, Math.sin(a2) * R * 0.32);
    sails += `M${Pt(p0)}L${Pt(p1)}L${Pt(p2)}L${Pt(p3)}Z`;
  }
  const rim = Array.from({ length: 33 }, (_, i) => P3(Math.cos((i / 32) * Math.PI * 2) * R, Math.sin((i / 32) * Math.PI * 2) * R));
  const tail0 = PP(A, hub[0], hub[1], hub[2] + 40);
  const tail1 = PP(A, hub[0] - ax[2] * 0, hub[1], hub[2] + 300);
  const vane = [PP(A, hub[0], hub[1] + 60, hub[2] + 250), PP(A, hub[0], hub[1] + 90, hub[2] + 420), PP(A, hub[0], hub[1] - 70, hub[2] + 420), PP(A, hub[0], hub[1] - 40, hub[2] + 250)];
  return (
    <g>
      <path d={d} stroke={col} strokeWidth={lw * 1.4} fill="none" strokeLinecap="round" />
      <path d={`M${Pt(tail0)}L${Pt(tail1)}`} stroke={col} strokeWidth={lw * 2} />
      <path d={polyD(vane)} fill={A.tone(RMAT.tin.mid, Z, ht)} stroke={col} strokeWidth={lw} />
      <path d={sails} fill={A.tone(RMAT.tin.lit, Z, ht)} stroke={A.tone(RMAT.tin.dark, Z, ht)} strokeWidth={lw * 0.6} />
      <path d={`M${rim.map(Pt).join("L")}`} fill="none" stroke={colLit} strokeWidth={lw} strokeOpacity={0.7} />
      <circle cx={P3(0, 0)[0]} cy={P3(0, 0)[1]} r={18 * A.P.r(Z)} fill={col} />
    </g>
  );
};

// ===================================================================================================================
// ADDED AFTER WORLD_READY (new names only; see notes/SHARED_CHANGES.md)
// ===================================================================================================================
/** RidgeStackV2: the far hills as layered silhouettes that read in depth: each ridge a darker body under its crest
 *  fading to a pale valley mist at its foot (visible above the next nearer ridge), every farther ridge closer to the
 *  sky's own colour at its height on screen, a faint tree line along each near crest. Same Ridge[] as RidgeStack. */
export const RidgeStackV2: React.FC<{ A: AirWorld; ridges: Ridge[]; uid: string; nearInk?: string }> = ({ A, ridges, uid, nearInk }) => {
  const P = A.P;
  const k = A.k;
  const sorted = ridges.slice().sort((a, b) => b.Z - a.Z);
  const bottomY = A.cam.cy + 1040 / k;
  const toSy = (y: number) => 960 + (y - A.cam.cy) * k;
  const ink = nearInk ?? mixHex(mixHex(RMAT.grass.mid, RMAT.cedar.mid, 0.5), RMAT.grass.dark, 0.25);
  const zs = sorted.map((r) => r.Z);
  const zMin = Math.min(...zs);
  const zMax = Math.max(...zs);
  return (
    <g>
      {sorted.map((rd, i) => {
        const Z = rd.Z;
        if (Z < P.zNear + 100) return null;
        const r = P.r(Z);
        const hw = 620 / (k * r);
        const N = 72;
        const pts: P2[] = [];
        let yMin = Infinity;
        for (let j = 0; j <= N; j++) {
          const X = A.cam.cx - hw + (2 * hw * j) / N;
          const p = PP(A, X, ridgeTop(rd, X), Z);
          pts.push(p);
          yMin = Math.min(yMin, p[1]);
        }
        if (toSy(yMin) > 1980) return null;
        // depth 0 (nearest) .. 1 (farthest), by log distance from the eye
        const t = zMax > zMin ? c01(Math.log((Z + A.Dc) / (zMin + A.Dc)) / Math.log((zMax + A.Dc) / (zMin + A.Dc))) : 0;
        const sky = A.screenAir(yMin - 10 / k);
        const crestC = mixHex(A.tone(ink, Z, 0), sky, 0.2 + 0.72 * Math.pow(t, 0.8));
        const next = sorted[i + 1];
        let yN = yMin + 200 / k;
        if (next && next.Z > P.zNear + 100) yN = Math.max(yMin + 50 / k, PP(A, A.cam.cx, next.H, next.Z)[1]);
        const mist = mixHex(mixHex(A.screenAir(yN), PAL.creamLo, 0.38), crestC, 0.12 + 0.2 * t);
        const gid = `${uid}v${i}`;
        const d = `M${pts.map(Pt).join("L")}L${n2(pts[N][0])},${n2(bottomY)}L${n2(pts[0][0])},${n2(bottomY)}Z`;
        const treeLine = t < 0.45;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={n2(yMin)} x2="0" y2={n2(yN + 10 / k)}>
                <stop offset="0" stopColor={crestC} />
                <stop offset="0.18" stopColor={crestC} />
                <stop offset="0.8" stopColor={mist} />
                <stop offset="1" stopColor={mist} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${gid})`} />
            {treeLine ? (
              <path d={`M${pts.map((p) => `${n2(p[0])},${n2(p[1] + 3 / k)}`).join("L")}`} fill="none" stroke={mixHex(crestC, RMAT.cedar.dark, 0.5)} strokeWidth={6 / k} strokeOpacity={0.35 * (1 - t / 0.45)} strokeLinecap="round" />
            ) : null}
            <path d={`M${pts.map(Pt).join("L")}`} fill="none" stroke={PAL.cream} strokeWidth={1.3 / k} strokeOpacity={0.12 * (1 - t)} />
          </g>
        );
      })}
    </g>
  );
};
/** CedarBush: an Ashe juniper clump drawn as rounded, irregular dark masses (better read than CedarClump's spires);
 *  units ~500 tall at size 1 */
const cedarBushShapes = (seed: number, frame: number, m: Mat = RMAT.cedar, rim?: string): Shape[] => {
  const S: Shape[] = [];
  S.push({ d: ellP(20, -4, 300, 26), fill: "#2A2E26", cast: true, op: 0.3 });
  if (rim) S.push({ d: ellP(30, -2, 250, 16), fill: "#2A2E26", cast: true, op: 0.25 });
  const sw = (i: number) => Math.sin(frame * 0.045 + i * 1.3 + seed) * 2.5;
  const masses: [number, number, number, number, number][] = [
    [-170, -150, 130, 140, 0.35],
    [150, -170, 150, 160, 0.3],
    [-10, -260, 170, 230, 0.15],
    [-80, -120, 160, 115, 0.45],
    [100, -110, 160, 105, 0.5],
  ];
  // a rim of light on the upper-left edge: the masses again, a little up and left, in the rim colour, under them
  if (rim) masses.forEach(([x, y, rx, ry], i) => S.push({ d: blobP(x + sw(i) * (y / -260) - 9, y - 9, rx, ry, seed + i * 5, 0.16), fill: rim, op: 0.85 }));
  masses.forEach(([x, y, rx, ry, dk], i) => S.push({ d: blobP(x + sw(i) * (y / -260), y, rx, ry, seed + i * 5, 0.16), fill: mixHex(m.mid, m.dark, dk) }));
  [
    [-70, -360, 70, 60],
    [-150, -230, 60, 50],
    [40, -300, 55, 45],
  ].forEach(([x, y, rx, ry], i) => S.push({ d: blobP(x + sw(i + 7), y, rx, ry, seed + 40 + i, 0.2), fill: m.lit, sh: 0.5, op: 0.75 }));
  return S;
};
/** optional: mat = the foliage's tones (default RMAT.cedar), rim = a light colour for a rim on the upper-left edge (and a
 *  second, softer contact shadow) */
export const CedarBush: React.FC<{ A: AirWorld; X: number; Z: number; H: number; size?: number; seed?: number; frame: number; uid: string; mat?: Mat; rim?: string }> = ({ A, X, Z, H, size = 2.4 * U, seed = 1, frame, uid, mat, rim }) => {
  const r = A.P.r(Z);
  const sc = (r * size) / 500;
  return <RanchPaint shapes={cedarBushShapes(seed, frame, mat, rim)} at={PP(A, X, H, Z)} scale={sc} uid={uid} fog={{ rgb: A.airHex(Z, H + size * 0.5), amount: A.fog(Z) }} unitPx={A.k} />;
};

// ===================================================================================================================
/** HILL COUNTRY RIDGES (added for cut 59, preview 2): the far country as Texas Hill Country, never as swells.
 *  Each ridge line is a run of irregular hills, from a hash per cell of `lambda` world units: long flat-topped
 *  limestone benches (a flat top, rounded shoulders) and rounded knobs, of varying width (asymmetric flanks) and
 *  height, joined by a soft max so saddles sit between them, plus a little roughness. `amp` = the tallest hill's
 *  height above the saddles, `tree` = a tree's radius (world units), `dots` = tree density 0..1. Same Ridge[] as
 *  RidgeStack. hillTop(rd, X) = the ridge's height at X (world H). */
const HILL_KS = 9;
const hillBump = (si: number, q: number, cell: number) => {
  const h = (k: number) => hash2(q, si, k);
  const mesa = h(5) > 0.5;
  return {
    cx: (q + 0.5 + 0.6 * (h(1) - 0.5)) * cell,
    wl: cell * (0.8 + 0.75 * h(2)) * (mesa ? 1.25 : 1),
    wr: cell * (0.8 + 0.75 * h(3)) * (mesa ? 1.25 : 1),
    a: mesa ? 0.45 + 0.4 * h(4) : 0.35 + 0.65 * h(4),
    mesa,
  };
};
const bumpProf = (b: ReturnType<typeof hillBump>, X: number) => {
  const u = X < b.cx ? (b.cx - X) / b.wl : (X - b.cx) / b.wr;
  if (u >= 1) return 0;
  return b.a * (b.mesa ? 1 - sstep(0.42, 1, u) : 1 - sstep(0, 1, u));
};
export const hillTop = (rd: Ridge, X: number) => {
  const cell = rd.lambda;
  const q0 = Math.floor(X / cell);
  const si = Math.round(rd.seed * 13);
  let acc = Math.exp(HILL_KS * 0.1);
  for (let q = q0 - 2; q <= q0 + 2; q++) acc += Math.exp(HILL_KS * bumpProf(hillBump(si, q, cell), X));
  const top = Math.log(acc) / HILL_KS + 0.035 * (vnoise(X / (0.11 * cell), si, 4) - 0.5) + 0.02 * (vnoise(X / (0.035 * cell), si, 6) - 0.5);
  return rd.H + rd.amp * (top - 0.45);
};
/** the near hills' paint: olive-khaki from the ground's ramp (lit, body, shaded flank); then grey-green; then haze */
const HILL_NEAR = { lit: "#93845F", mid: "#7C6E52", dark: "#5A4F3B" };
const HILL_MID = { lit: "#8F937C", mid: "#7A806C", dark: "#5F6656" };
/** the grass-covered hills: her slope's dry yellow-green (lit), olive (shade); then paler grey-green */
const HILL_GRASS_NEAR = { lit: "#A9A87A", mid: "#8F9065", dark: "#6A714C" };
const HILL_GRASS_MID = { lit: "#A9AF8F", mid: "#979E80", dark: "#7F886C" };
/** optional: tRange maps this stack's depth rank into [t0, t1] of the near..far paint (a far skyline stack: [0.9, 1]);
 *  hazeHex = the colour the far ones dissolve into (default: the sky at their row), hazeMix = how far toward it from
 *  the sky (default 1); fade = extra mix toward the haze 0..1;
 *  grass = the bodies in her slope's dry yellow-green / olive grass (lit faces lighter, shaded flanks olive), paling to
 *  grey-green with distance, small limestone ledges on some bench edges, the tree clumps fuller;
 *  flatFar = the far half as clean stacked silhouettes: flat, gently graded fills, no flank shading inside a layer */
export const HillCountryRidges: React.FC<{ A: AirWorld; ridges: Ridge[]; uid: string; frame?: number; tRange?: [number, number]; hazeHex?: string; hazeMix?: number; fade?: number; grass?: boolean; flatFar?: boolean }> = ({ A, ridges, uid, tRange, hazeHex, hazeMix = 1, fade = 0, grass = false, flatFar = false }) => {
  const NEAR = grass ? HILL_GRASS_NEAR : HILL_NEAR;
  const MID = grass ? HILL_GRASS_MID : HILL_MID;
  const hazeAt = (y: number) => (hazeHex ? mixHex(A.screenAir(y), hazeHex, hazeMix) : A.screenAir(y));
  const P = A.P;
  const k = A.k;
  const sorted = ridges.slice().sort((a, b) => b.Z - a.Z);
  const bottomY = A.cam.cy + 1040 / k;
  const toSy = (y: number) => 960 + (y - A.cam.cy) * k;
  const zs = sorted.map((r) => r.Z);
  const zMin = Math.min(...zs);
  const zMax = Math.max(...zs);
  return (
    <g>
      {sorted.map((rd, i) => {
        const Z = rd.Z;
        if (Z < P.zNear + 100) return null;
        const r = P.r(Z);
        const hw = 640 / (k * r);
        const X0 = A.cam.cx - hw;
        const N = 110;
        const top = (X: number) => PP(A, X, hillTop(rd, X), Z);
        const pts: P2[] = [];
        let yMin = Infinity;
        for (let j = 0; j <= N; j++) {
          const p = top(X0 + (2 * hw * j) / N);
          pts.push(p);
          yMin = Math.min(yMin, p[1]);
        }
        if (toSy(yMin) > 1980) return null;
        // depth 0 (nearest) .. 1 (farthest), by log distance from the eye
        const tl = zMax > zMin ? c01(Math.log((Z + A.Dc) / (zMin + A.Dc)) / Math.log((zMax + A.Dc) / (zMin + A.Dc))) : 0;
        const t = tRange ? lerp(tRange[0], tRange[1], tl) : tl;
        const yMean = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        const sky = hazeAt(yMean);
        const g = sstep(0.04, 0.55, t);
        const haze = grass ? 0.05 + 0.8 * Math.pow(t, 1.15) : 0.1 + 0.5 * Math.pow(sstep(0.04, 1, t), 1.3);
        const paint = (c: "lit" | "mid" | "dark") => mixHex(mixHex(mixHex(NEAR[c], MID[c], g), sky, haze), sky, fade);
        const body = paint("mid");
        const lit = paint("lit");
        const shade = paint("dark");
        // the valley mist at the ridge's foot (down to the next nearer crest): light for the near hills, more far off
        const next = sorted[i + 1];
        let yN = yMin + 220 / k;
        if (next && next.Z > P.zNear + 100) yN = Math.max(yMin + 40 / k, PP(A, A.cam.cx, next.H + next.amp * 0.2, next.Z)[1]);
        const mist = flatFar ? mixHex(body, mixHex(hazeAt(yN), PAL.creamLo, 0.2), 0.3 - 0.2 * t) : mixHex(mixHex(hazeAt(yN), PAL.creamLo, 0.25), body, 0.6 - 0.3 * t);
        const gid = `${uid}h${i}`;
        const cid = `${uid}hc${i}`;
        const outline = `M${pts.map(Pt).join("L")}L${n2(pts[N][0])},${n2(bottomY)}L${n2(pts[0][0])},${n2(bottomY)}Z`;
        // the flanks: per hill a soft wedge under the slope away from the light (right) in shade, and under the one
        // toward it (left) lit, each sitting inside its own hill (blurred, clipped to the ridge)
        const si = Math.round(rd.seed * 13);
        const cell = rd.lambda;
        let shadeD = "";
        let litD = "";
        const wedge = (xp: number, xf: number) => {
          const s = Array.from({ length: 9 }, (_, j) => top(lerp(xp, xf, j / 8)));
          const Pk = s[0];
          const F = s[8];
          const dep = Math.max(8 / k, F[1] - Pk[1]) * 0.9 + 6 / k;
          return `M${s.map(Pt).join("L")}L${n2(F[0])},${n2(F[1] + dep * 0.6)}L${n2(Pk[0] + 0.3 * (F[0] - Pk[0]))},${n2(F[1] + dep)}Z`;
        };
        let ledges = "";
        if (t < (flatFar ? 0.5 : 0.85)) {
          for (let q = Math.floor(X0 / cell) - 2; q <= Math.ceil((X0 + 2 * hw) / cell) + 2; q++) {
            const b = hillBump(si, q, cell);
            shadeD += wedge(b.cx + (b.mesa ? 0.42 : 0.2) * b.wr, b.cx + 0.97 * b.wr);
            litD += wedge(b.cx - (b.mesa ? 0.42 : 0.2) * b.wl, b.cx - 0.97 * b.wl);
            // a small limestone ledge on some bench edges (the shoulder, just under the flat top)
            if (grass && b.mesa && t < 0.2 && hash2(q, si, 33) < 0.4) {
              const l0 = b.cx + (hash2(q, si, 34) < 0.5 ? 0.38 : -0.62) * (hash2(q, si, 34) < 0.5 ? b.wr : b.wl);
              const l1 = l0 + 0.14 * (b.wr + b.wl) * 0.5;
              const run = Array.from({ length: 6 }, (_, j) => {
                const p = top(lerp(l0, l1, j / 5));
                return [p[0], p[1] + 5 / k] as P2;
              });
              ledges += `M${run.map(Pt).join("L")}`;
            }
          }
        }
        // trees on the nearer ridges: live-oak motts and cedar brakes in patches, on the crest and down the slope;
        // each a little cluster of round crowns
        let oaks = "";
        let cedars = "";
        let caps = "";
        const treeOn = rd.dots > 0 && t < 0.42;
        const circ = (cx: number, cy: number, rx: number, ry: number) => `M${n2(cx - rx)},${n2(cy)}a${n2(rx)},${n2(ry)} 0 1 0 ${n2(2 * rx)},0a${n2(rx)},${n2(ry)} 0 1 0 ${n2(-2 * rx)},0Z`;
        if (treeOn) {
          const R = rd.tree * r;
          const sp = rd.tree * 1.9;
          const reach = Math.min(Math.max(30 / k, (yN - yMin) * 1.1), 200 / k);
          for (let q = Math.floor(X0 / sp); q <= Math.ceil((X0 + 2 * hw) / sp); q++) {
            const dens = vnoise(q / 6.1, si, 8);
            const cedarPatch = vnoise(q / 9.3 + 4.2, si, 9) > 0.5;
            for (let row = 0; row < 6; row++) {
              const hs = hash2(q, si * 3 + row, 12);
              if (hs > rd.dots * (row === 0 ? 0.85 : 0.75) * sstep(0.2, 0.55, dens)) continue;
              const X = (q + hash(hs * 97 + row)) * sp;
              const p = top(X);
              const sz = R * (0.7 + 0.6 * hash(hs * 131));
              const down = row === 0 ? -0.45 * sz : (0.4 + 0.6 * hash(hs * 211)) * reach * (row / 5);
              const cx = p[0];
              const cy = p[1] + down;
              if (sz * k < 1) continue;
              const cedar = cedarPatch ? hash(hs * 53) < 0.75 : hash(hs * 53) < 0.25;
              const nb = grass ? 2 + Math.floor(hash(hs * 71) * 3) : 1 + Math.floor(hash(hs * 71) * 3);
              for (let m = 0; m < nb; m++) {
                const ox = m === 0 ? 0 : [-0.85, 0.9, -0.3, 0.45][(m - 1) % 4] * sz;
                const oy = m === 0 ? 0 : [0.25, 0.2, 0.45, -0.35][(m - 1) % 4] * sz;
                const rr = m === 0 ? sz : sz * (0.55 + 0.25 * hash(hs * 17 + m));
                if (cedar) cedars += circ(cx + ox * 0.8, cy + oy, rr * 0.7, rr * 0.9);
                else {
                  oaks += circ(cx + ox, cy + oy, rr, rr * 0.8);
                  if (m === 0) caps += circ(cx - 0.28 * rr, cy - 0.3 * rr, rr * 0.5, rr * 0.38);
                }
              }
            }
          }
        }
        const tf = 0.3 + 0.6 * sstep(0, 0.42, t);
        const oakC = mixHex(RMAT.oak.mid, body, tf);
        const cedarC = grass ? mixHex(mixHex(RMAT.cedar.mid, RMAT.oak.dark, 0.4), body, tf * 0.9) : mixHex(mixHex(RMAT.cedar.dark, RMAT.cedar.mid, 0.5), body, tf * 0.9);
        const capC = mixHex(RMAT.oak.lit, lit, 0.25 + 0.6 * tf);
        const flankOp = 1 - 0.7 * t;
        const blur = Math.max(2, 9 * (1 - t)) / k;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={n2(yMin)} x2="0" y2={n2(yN + 20 / k)}>
                <stop offset="0" stopColor={body} />
                <stop offset="0.45" stopColor={body} />
                <stop offset="1" stopColor={mist} />
              </linearGradient>
              <filter id={`${gid}f`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation={n2(blur)} />
              </filter>
              <clipPath id={cid}>
                <path d={outline} />
              </clipPath>
            </defs>
            <path d={outline} fill={`url(#${gid})`} opacity={flatFar ? 1 - 0.7 * sstep(0.72, 1, t) : 1} />
            {shadeD ? (
              <g clipPath={`url(#${cid})`}>
                <g filter={`url(#${gid}f)`}>
                  <path d={litD} fill={lit} opacity={0.9 * flankOp} />
                  <path d={shadeD} fill={shade} opacity={flankOp} />
                </g>
              </g>
            ) : null}
            {ledges ? <path d={ledges} fill="none" stroke={mixHex(mixHex("#B9A27A", body, 0.3 + 0.5 * t), PAL.cream, 0.1)} strokeWidth={6 / k} strokeLinecap="round" opacity={0.6} /> : null}
            {cedars ? <path d={cedars} fill={cedarC} /> : null}
            {oaks ? <path d={oaks} fill={oakC} /> : null}
            {caps ? <path d={caps} fill={capC} opacity={0.7} /> : null}
            <path d={`M${pts.map(Pt).join("L")}`} fill="none" stroke={PAL.cream} strokeWidth={1.2 / k} strokeOpacity={0.1 * (1 - t)} />
          </g>
        );
      })}
    </g>
  );
};
