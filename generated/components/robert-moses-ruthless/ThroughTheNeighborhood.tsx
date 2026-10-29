// ---------------------------------------------------------------------------
// ThroughTheNeighborhood (robert-moses-ruthless, cut 18). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 242 frames.
// One stage inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective, from the
// kit kits/dwarkesh-3d/dwarkesh3d (its header is the API). The world, camera numbers and the people: ./throughPlan.ts.
//
// CHECK LINE: "Moses ran the expressway straight through a packed neighbourhood and emptied it, when a route two
// blocks south, along the park, would have touched only a handful of houses."
//
// THE LINE: "[He's saying to Robert Moses,] you're putting it right through a neighborhood where you have to evict tens
// of thousands of people. You can just move it two blocks to the south and you only have to evict a couple of hundred
// people."
// WORD -> FRAME (Whisper onsets, ~3-5 frames early): putting 2 · right 14 · through 21 · neighborhood 32 · evict 64 ·
// tens 79 · of 84 · thousands 90 · people 103 (ends 111) · move 128 · it · two 141 · blocks 147 · to 156 · the 159 ·
// south 166 · only 181 · evict 198 · a 208 · couple 211 · of 217 · hundred 220 · people 225 (ends 236) · cut 242.
// DURATION: the slot 18.936 -> 29.029 s = 10.093 s x 23.976 = 242 frames (f0..f241).
//
// THE MOTION (rev 1): East Tremont from high over Crotona Park, looking north (south = toward us, down the screen): rows
// of 3-6 storey brick and stucco walk-ups packed on a street grid (side streets every 60 m), the park's trees along the
// bottom. f2-40 a SOLID orange ribbon is drawn by a moving tip (left -> right, constant speed) along the roofs of the
// middle row while the camera drifts in; f40-104 ONE smooth lobe in on that row (figures ~59-62 px). From f62 every door
// of the row pours (front doors every ~5 m, two columns each, fanning into the front street; the corner houses' side
// doors feed a river down the middle side street toward us and one up it, away; the doors start staggered so it builds):
// ~210-250 rig figures on screen by f100-111, and behind the row the north street already stands full (crowd drawings,
// hidden until the row goes). f66-100 its lit windows go out, f90-110 its walls drain to DEAD, f96-124 the ribbon
// presses the emptied row flat: rubble lots on a pale DEAD floor with dark cellars, broken wall stubs, a gash across the
// whole width with the ribbon lying along it (done before "move it", f128). f104-174 the pull back and pan down to the
// park (one acceleration, one deceleration lobe) while a DASHED orange line (slim pieces of the ribbon, gaps the length
// of the dashes) is drawn by a moving tip (f128-166) along the park-edge street, two block rows south, through three
// small low houses. f174-188 a near hold on the two-shot (the gash and its crowds above, the dashed line below), then a
// gentle push in toward the park edge to f241 while five step out of the small houses' side doors onto the dashed line
// and turn to us (~60 px at f241, feet y ~1330, heads y ~1270: out of both caption bands). The zoom is monotone within
// each run: in f0-104, out f104-174, in f174-241.
// Orange = the expressway: SOLID = the route Moses built, DASHED (moving tip, faint glow) = the route two blocks south
// he refused. Everything else in muted earthy local colours (lit windows a warm cream, never orange); people never orange.
// CAUSE BEFORE EFFECT: the ribbon lies on the roofs from the first frame of the press and rides them down; every rig
// walker comes out of a door (clipped to it until past the wall); the standing crowd drawings appear only out of frame or
// behind the standing row.
//
// DEPTH: eye 304 m up (eyeY -3040 units, U = 10 units per metre), the settled frame's camera 230 m in front of the
// park-edge street (dRef 2300, kRef 0.944, dolly 0.3: a zoom is part dolly), focal ~2171 px settled (a long lens, ~45
// deg down at the route); horizon ~1560 px above the frame. Fog by the eye's distance (fogNear 1000, fogVis 2300
// units; the route row and its gash read through 0.4 of their depth's air so the subject keeps its DEAD colour).
// Park-edge street Z 0 (dashed Z 2), B1 Z 7, B2 Z 28, B3 (the route) Z 54-66, gash Z 53.1-67, rows on to Z ~230 m.
// Figures are a picture-book 3.8 m. Camera keys (throughPlan CAM_KEYS): k 1.2 -> 2.0 (f104) -> 0.98 (f174) -> 1.6 (f241).
//
// SOURCES: the place and the two routes are the speaker's (Robert Caro, The Power Broker, 1974, "One Mile"): the Cross
// Bronx Expressway through East Tremont, and the alternative route two blocks south along Crotona Park's northern
// edge. The grid is illustrative (no map); no figures on screen.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  AIR,
  AirBox,
  AirFloor,
  AirStage,
  DEAD,
  MAT,
  PandemicFolk,
  WorldSvg,
  airWorldOf,
  c01,
  hexRgb,
  lineOf,
  mixHex,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  ALT_Z,
  B3,
  BLDGS,
  BLOCK_P,
  DC_S,
  DOLLY,
  F_S,
  DURATION,
  FIG,
  FPS,
  HC,
  K_S,
  LINE_X0,
  LOT_H,
  PARK_EDGE,
  ROUTE_Z,
  ROWS,
  STOREY,
  STREET_W,
  T,
  U,
  WALKERS,
  camAt as planCam,
  crushAt,
  dashTipX,
  lineHeightAt,
  lineTipX,
  rowTopAt,
  stubsOf,
  walkerAt,
  type Bldg,
  type CrowdKindT,
  type Walker,
} from "./throughPlan";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const DEPTH: DepthOpts = { eyeY: -HC * U, dRef: DC_S * U, kRef: K_S, dolly: DOLLY };

// ---- the camera (throughPlan: one lobe in on the route row, the pull back and pan to the park, a hold, a push in) --
export const camAt = (f: number): Cam => planCam(f);
const REST = swayCam(camAt(0), 0);

// ---- materials (local colours before fog) --------------------------------------------------------------------------
const BRICKS: Mat[] = [
  MAT.brick,
  { lit: "#9A7058", mid: "#765443", dark: "#3F2C22" },
  { lit: "#A87D62", mid: "#82604B", dark: "#45332A" },
  { lit: "#C3B293", mid: "#A39375", dark: "#6E614E" }, // oatmeal stucco
  { lit: "#8F5E4A", mid: "#6B4536", dark: "#38241C" },
];
const DRAINED: Mat = { lit: mixHex(DEAD, PAL.cream, 0.22), mid: DEAD, dark: mixHex(DEAD, PAL.shadow, 0.5) };
/** the pressed lots: a pale dusty floor of DEAD rubble with dark open cellars, chunks in DEAD and a darker DEAD */
const LOT_FLOOR = mixHex(DEAD, "#C8A66E", 0.45);
const CELLAR = mixHex(DEAD, "#2E241C", 0.72);
/** the broken wall stubs: DEAD, their fronts in shade, their broken tops catching the light */
const STUB: Mat = { lit: mixHex(DEAD, "#E9DEC6", 0.35), mid: mixHex(DEAD, "#2E241C", 0.4), dark: mixHex(DEAD, "#2E241C", 0.65) };
const RUBBLE_DARK: Mat = { lit: mixHex(DEAD, PAL.shadow, 0.12), mid: mixHex(DEAD, PAL.shadow, 0.3), dark: mixHex(DEAD, PAL.shadow, 0.6) };
const mixMat = (a: Mat, b: Mat, t: number): Mat => ({ lit: mixHex(a.lit, b.lit, t), mid: mixHex(a.mid, b.mid, t), dark: mixHex(a.dark, b.dark, t) });
const ROOFS = ["#625A50", "#6E6355", "#5A544D", "#74695B", "#685E52"];
const LIT_WIN = "#E4D1A6";
const DARK_WIN = "#3A3029";
const DOOR = "#2E241C";
const PAVE = "#8F8069";
const ASPHALT: Mat = { lit: "#6F6455", mid: "#625849", dark: "#3A322A" };
const LAWN = "#6D8063";
const STONE: Mat = { lit: "#A4977F", mid: "#857963", dark: "#4D4538" };
const TREE: Mat = { lit: "#7E9A7A", mid: "#5D7863", dark: "#34483D" };

const fx = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "0");
const pt = (v: P2) => `${fx(v[0])},${fx(v[1])}`;
const poly = (q: P2[]) => `M${q.map(pt).join("L")}Z`;
const ease = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};

// ---- the folk: the pandemics Worker (2.5D rig) baked to sprites at every yaw a walk or a turn needs -----------------
const INKS: Partial<typeof PandemicFolk.WORKER_INKS>[] = [
  { vest: "#5A4434", cap: "#4E4640", trousers: "#4A423C" },
  { vest: "#4F5B5C", cap: "#3F3A36", trousers: "#504840" },
  { vest: "#6E4A3E", cap: "#5A4A3E", trousers: "#4A4440" },
  { vest: "#5E6B60", cap: "#7A6450", trousers: "#463F39" },
  { vest: "#7A6E5C", cap: "#4E4640", trousers: "#4B443D", shirt: "#D9CDB4" },
].map((k) => ({ ...k, apron: mixHex(k.vest!, "#000000", 0.08), apronTie: mixHex(k.vest!, "#000000", 0.15) }));
const YAWS = [0, 30, 60, 90, 120, 150, 180];
const SPRITE_PX = 96;
const spriteKey = (ink: number, yaw: number) => {
  const m = yaw < 0 && yaw > -180;
  return `rmw${ink}_${Math.abs(yaw)}_${m ? 1 : 0}_${SPRITE_PX}`;
};
const SPRITE_REQS = (() => {
  const reqs: ReturnType<typeof makeReq>[] = [];
  function makeReq(ink: number, yaw: number, mirror: boolean) {
    const shapes = PandemicFolk.buildWorker(PandemicFolk.stand(yaw), { inks: INKS[ink], mirror }).shapes;
    return { key: spriteKey(ink, mirror ? -yaw : yaw), shapes, hPx: SPRITE_PX, hUnits: PandemicFolk.WORKER_UNITS, wUnits: 230 };
  }
  for (let ink = 0; ink < INKS.length; ink++) {
    for (const y of YAWS) {
      reqs.push(makeReq(ink, y, false));
      if (y > 0 && y < 180) reqs.push(makeReq(ink, y, true));
    }
  }
  return reqs;
})();
/** the far crowd: front-facing crowd drawings (pandemicFolkCrowd, natural inks), one sprite per kind and seed */
const CROWD_UNITS: Record<CrowdKindT, number> = { man: 506, woman: 474, boy: 376, girl: 368, oldMan: 502, oldWoman: 464 };
const CROWD_REQS = (() => {
  const out: ReturnType<typeof PandemicFolk.crowdSpriteReq>[] = [];
  for (const kind of Object.keys(CROWD_UNITS) as CrowdKindT[]) {
    for (let seed = 0; seed < 8; seed++) out.push(PandemicFolk.crowdSpriteReq(kind, "natural", seed, Math.round(SPRITE_PX * (CROWD_UNITS[kind] / 506))));
  }
  return out;
})();
const crowdKey = (kind: CrowdKindT, seed: number) => `${kind}|natural|${seed}|${Math.round(SPRITE_PX * (CROWD_UNITS[kind] / 506))}`;

// ---- projection helpers (metres in, the kit's 2D world out) ---------------------------------------------------------
type Ctx = { A: AirWorld; cam: Cam; f: number };
/** a point at X, height up (m), Z (m) */
const pm = (A: AirWorld, X: number, up: number, Z: number) => A.P.p(X * U, -up * U, Z * U);
const toScreen = (cam: Cam, p: P2): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];
const tone = (A: AirWorld, hex: string, Zm: number, up = 0) => A.tone(hex, Zm * U, up * U);

// ---- the draw list ------------------------------------------------------------------------------------------------
type Item = { z: number; xs: number; svg?: React.ReactNode; fig?: FigDraw };
type FigDraw = { w: Walker; X: number; Z: number; yaw: number; moving: boolean; dist: number; clip?: P2[]; gloom?: number };

const rowOf = (Zm: number) => {
  for (const r of ROWS) if (Zm >= r.z0 && Zm <= r.z1) return r.z0;
  if (Zm >= -2 && Zm <= 5) return -2;
  return null;
};

// ---- a building ---------------------------------------------------------------------------------------------------
const DOOR_W = 3.0;
const DOOR_H = 4.7;
const SIDE_DOOR_W = 2.5;
/** a door on a side face (plane X = xs), centred on z */
const sideDoorQuad = (A: AirWorld, xs: number, z: number, w = SIDE_DOOR_W): P2[] => [pm(A, xs, 0, z - w / 2), pm(A, xs, 0, z + w / 2), pm(A, xs, DOOR_H, z + w / 2), pm(A, xs, DOOR_H, z - w / 2)];
const frontDoorQuad = (A: AirWorld, x: number, z: number): P2[] => [pm(A, x - DOOR_W / 2, 0, z), pm(A, x + DOOR_W / 2, 0, z), pm(A, x + DOOR_W / 2, DOOR_H, z), pm(A, x - DOOR_W / 2, DOOR_H, z)];
const STUBS = new Map(BLDGS.filter((b) => b.row === 3).map((b) => [b.key, stubsOf(b)]));
/** rubble on a lot: low flat chunks (m), a lighter and a darker DEAD */
const RUBBLE = new Map(
  BLDGS.filter((b) => b.row === 3).map((b) => {
    const n = Math.round((b.X1 - b.X0) / 1.1);
    return [
      b.key,
      Array.from({ length: n }, (_, i) => {
        const x = b.X0 + 1 + random(`rbx${b.seed}${i}`) * (b.X1 - b.X0 - 2);
        const z = b.Z0 + 1.2 + random(`rbz${b.seed}${i}`) * (b.Z1 - b.Z0 - 2.4);
        const w = 0.7 + random(`rbw${b.seed}${i}`) * 1.6;
        const d = 0.5 + random(`rbd${b.seed}${i}`) * 1.1;
        return { x, z, w, d, h: 0.3 + random(`rbh${b.seed}${i}`) * 0.8, light: random(`rbl${b.seed}${i}`) < 0.5 };
      }),
    ] as const;
  }),
);

/** each lot's open cellars (m): one or two dark pits */
const CELLARS = new Map(
  BLDGS.filter((b) => b.row === 3).map((b) => {
    const n = b.X1 - b.X0 > 18 ? 2 : 1;
    return [
      b.key,
      Array.from({ length: n }, (_, i) => {
        const w = 4 + random(`cw${b.seed}${i}`) * 4;
        const x = b.X0 + ((b.X1 - b.X0) * (i + 0.5)) / n + (random(`cx${b.seed}${i}`) - 0.5) * 3;
        const z = b.Z0 + 2.2 + random(`cz${b.seed}${i}`) * 1.2;
        return { x0: x - w / 2, x1: x + w / 2, z0: z, z1: z + 3 + random(`cd${b.seed}${i}`) * 2.5 };
      }),
    ] as const;
  }),
);

/** the route row (and its gash) read through a little less air than its depth gives: the cut's subject keeps its
 *  DEAD colour and its contrast against the rows round it */
const ROUTE_AIR = 0.4;
const clearer = (A: AirWorld): AirWorld => ({ ...A, tone: (hex, Z, h) => A.tone(hex, Z * ROUTE_AIR, h), fog: (Z) => A.fog(Z * ROUTE_AIR) });

const Building: React.FC<{ c: Ctx; b: Bldg }> = ({ c, b }) => {
  const route = b.row === 3;
  const { f } = c;
  const A = route ? clearer(c.A) : c.A;
  const crush = route ? crushAt(f) : 0;
  const drain = route ? ease((f - T.drainA) / (T.drainB - T.drainA)) : 0;
  const mat = drain > 0 ? mixMat(BRICKS[b.mat], DRAINED, 0.9 * drain) : BRICKS[b.mat];
  const top = route ? Math.min(b.h, rowTopAt(f)) : b.h;
  const Zm = (b.Z0 + b.Z1) / 2;
  const els: React.ReactNode[] = [];
  els.push(<AirBox key="box" A={A} X0={b.X0 * U} X1={b.X1 * U} Y0={-top * U} Y1={0} Z0={b.Z0 * U} Z1={b.Z1 * U} mat={mat} uid={`bx${b.key}`} lw={A.lw(1.0)} />);
  // the roof (tar), inset inside the parapet; pressed down, it turns to the lot's rubble
  const ins = 0.45;
  const roofBase = ROOFS[b.seed % ROOFS.length];
  const roofHex = drain > 0 ? mixHex(roofBase, DRAINED.mid, 0.6 * drain) : roofBase;
  const roofCol = tone(A, crush > 0 ? mixHex(roofHex, LOT_FLOOR, crush) : roofHex, Zm, top);
  els.push(<path key="roof" d={poly([pm(A, b.X0 + ins, top - 0.15 * (1 - crush), b.Z0 + ins), pm(A, b.X1 - ins, top - 0.15 * (1 - crush), b.Z0 + ins), pm(A, b.X1 - ins, top - 0.15 * (1 - crush), b.Z1 - ins), pm(A, b.X0 + ins, top - 0.15 * (1 - crush), b.Z1 - ins)])} fill={roofCol} />);
  // a stair bulkhead on some roofs
  if (!b.small && !route && random(`bh${b.seed}`) < 0.45) {
    const bx = b.X0 + (b.X1 - b.X0) * (0.25 + 0.4 * random(`bhx${b.seed}`));
    els.push(<AirBox key="bh" A={A} X0={bx * U} X1={(bx + 2.6) * U} Y0={-(top + 2.2) * U} Y1={-(top - 0.2) * U} Z0={(b.Z0 + 4) * U} Z1={(b.Z0 + 7) * U} mat={mat} uid={`bh${b.key}`} lw={A.lw(0.8)} rim={0.6} />);
  }
  // the windows on the front: lit (warm cream) or dark glass; the doors
  const r = A.P.r(b.Z0 * U);
  const pxPerM = r * U * c.cam.k;
  const fog = A.fog(Zm * U);
  if (pxPerM * 1.1 > 2.2 && fog < 0.86) {
    let dLit = "";
    let dDark = "";
    const wid = b.X1 - b.X0;
    const nb = Math.max(2, Math.floor(wid / 3.0));
    const bay = wid / nb;
    const stH = b.small ? 3.1 : STOREY;
    for (let j = 0; j < b.storeys; j++) {
      const y0 = j * stH + (b.small ? 0.9 : 0.85);
      const y1 = y0 + (b.small ? 1.4 : 1.5);
      if (y1 > top - 0.35) continue;
      for (let i = 0; i < nb; i++) {
        const xc = b.X0 + bay * (i + 0.5);
        if (!b.small && j === 0 && b.doors.some((dx) => Math.abs(xc - dx) < DOOR_W / 2 + 0.9)) continue;
        if (b.small && j === 0 && i === 0) continue;
        const p0 = pm(A, xc - 0.58, y1, b.Z0);
        const p1 = pm(A, xc + 0.58, y0, b.Z0);
        const d = `M${fx(p0[0])},${fx(p0[1])}H${fx(p1[0])}V${fx(p1[1])}H${fx(p0[0])}Z`;
        const lit = random(`lw${b.seed}_${i}_${j}`) < 0.42;
        const out = route ? T.winA + random(`lo${b.seed}_${i}_${j}`) * (T.winB - T.winA) : 1e9;
        if (lit && f < out) dLit += d;
        else dDark += d;
      }
    }
    const hMid = b.h / 2;
    if (dDark) els.push(<path key="wd" d={dDark} fill={tone(A, mixHex(DARK_WIN, mat.mid, 0.12 + 0.4 * crush), b.Z0, hMid)} />);
    if (dLit) els.push(<path key="wl" d={dLit} fill={tone(A, LIT_WIN, b.Z0, hMid)} />);
    // the cornice: a thin darker line a little under the top
    if (top > 2) {
      const cy0 = pm(A, b.X0, top - 0.75, b.Z0);
      const cy1 = pm(A, b.X1, top - 0.75, b.Z0);
      els.push(<path key="cor" d={`M${pt(cy0)}L${pt(cy1)}`} stroke={tone(A, lineOf(mat), b.Z0, top)} strokeWidth={A.lw(1.4) * 1.4} strokeOpacity={0.7} />);
    }
    const doorFill = tone(A, route ? mixHex(DOOR, DRAINED.dark, 0.5 * crush) : DOOR, b.Z0, 1);
    const doorLine = tone(A, mixHex(STONE.lit, mat.mid, 0.3), b.Z0, 1);
    if (!b.small && top > 1.2) {
      // the front doors (tall entrances; the evicted pour out of them)
      const dh = Math.min(DOOR_H, top - 0.5);
      let dd = "";
      for (const dx of b.doors) {
        const d0 = pm(A, dx - DOOR_W / 2, dh, b.Z0);
        const d1 = pm(A, dx + DOOR_W / 2, 0, b.Z0);
        dd += `M${fx(d0[0])},${fx(d0[1])}H${fx(d1[0])}V${fx(d1[1])}H${fx(d0[0])}Z`;
      }
      els.push(<path key="door" d={dd} fill={doorFill} stroke={doorLine} strokeWidth={A.lw(1.2) * 1.2} />);
      // a corner house's side doors, on its face to the side street (when that face is seen)
      if (b.side && top > DOOR_H + 0.3 && (b.side.dir < 0 ? b.X0 * U > c.cam.cx : b.X1 * U < c.cam.cx)) {
        const q = b.side.zs.map((z) => poly(sideDoorQuad(A, b.side!.xs, z))).join("");
        els.push(<path key="sdoors" d={q} fill={doorFill} stroke={doorLine} strokeWidth={A.lw(1.0)} />);
      }
    } else if (b.small) {
      // a small house's side door (on the face turned to the middle)
      const xs = b.X1 < 0 ? b.X1 : b.X0;
      els.push(<path key="sdoor" d={poly(sideDoorQuad(A, xs, 1.1))} fill={tone(A, DOOR, b.Z0, 1)} stroke={tone(A, STONE.lit, b.Z0, 1)} strokeWidth={A.lw(1.0)} />);
    }
  }
  // pressed flat: the lot's rubble and the broken wall stubs left standing as the press comes down past them, far first
  if (route && crush > 0) {
    const ra = c01((crush - 0.55) / 0.4);
    const parts: { z: number; el: React.ReactNode }[] = [];
    if (ra > 0) {
      const cel = CELLARS.get(b.key)!.map((q) => poly([pm(A, q.x0, LOT_H + 0.01, q.z0), pm(A, q.x1, LOT_H + 0.01, q.z0), pm(A, q.x1, LOT_H + 0.01, q.z1), pm(A, q.x0, LOT_H + 0.01, q.z1)])).join("");
      els.push(<path key="cel" d={cel} fill={tone(A, CELLAR, Zm)} opacity={ra} />);
      RUBBLE.get(b.key)!.forEach((q, i) =>
        parts.push({
          z: q.z,
          el: (
            <g key={`rb${i}`} opacity={ra}>
              <AirBox A={A} X0={(q.x - q.w / 2) * U} X1={(q.x + q.w / 2) * U} Y0={-(LOT_H + q.h * ra) * U} Y1={-LOT_H * U} Z0={(q.z - q.d / 2) * U} Z1={(q.z + q.d / 2) * U} mat={q.light ? DRAINED : RUBBLE_DARK} uid={`rb${b.key}${i}`} lw={A.lw(0.6)} rim={0.5} />
            </g>
          ),
        }),
      );
    }
    STUBS.get(b.key)!.forEach((s, i) => {
      if (top > s.h + 0.25) return;
      const op = c01((s.h + 0.25 - top) / 0.25);
      parts.push({
        z: (s.Z0 + s.Z1) / 2,
        el: (
          <g key={`st${i}`} opacity={op}>
            <AirBox A={A} X0={s.X0 * U} X1={s.X1 * U} Y0={-s.h * U} Y1={0} Z0={s.Z0 * U} Z1={s.Z1 * U} mat={STUB} uid={`st${b.key}${i}`} lw={A.lw(0.8)} rim={1} />
          </g>
        ),
      });
    });
    parts.sort((p, q) => q.z - p.z).forEach((p) => els.push(p.el));
  }
  return <g>{els}</g>;
};

// ---- the ground: streets, pavements and lots, the park, the gash ----------------------------------------------------
const Ground: React.FC<{ c: Ctx }> = ({ c }) => {
  const { A, f } = c;
  const els: React.ReactNode[] = [];
  els.push(<AirFloor key="floor" A={A} x0={-900 * U} x1={900 * U} z0={-80 * U} z1={900 * U} mat={ASPHALT} jointAmt={0} melt={0.5} />);
  // pavements round every block (a lighter tone), by row
  ROWS.forEach((r) => {
    if (r.z0 > 330) return;
    const Zm = (r.z0 + r.z1) / 2;
    const col = tone(A, PAVE, Zm);
    let d = "";
    const n = Math.ceil((540 * (DC_S + r.z1)) / F_S / BLOCK_P) + 2;
    for (let i = -n; i < n; i++) {
      const x0 = i * BLOCK_P + STREET_W / 2 - 2.2;
      const x1 = (i + 1) * BLOCK_P - STREET_W / 2 + 2.2;
      d += poly([pm(A, x0, 0, r.z0 - 2.2), pm(A, x1, 0, r.z0 - 2.2), pm(A, x1, 0, r.z1 + 2.2), pm(A, x0, 0, r.z1 + 2.2)]);
    }
    els.push(<path key={`pv${r.id}`} d={d} fill={col} />);
  });
  // the park's lawn, its paths, and the park-edge street's pavement on the park side
  els.push(<path key="lawn" d={poly([pm(A, -400, 0, PARK_EDGE - 0.6), pm(A, 400, 0, PARK_EDGE - 0.6), pm(A, 400, 0, -80), pm(A, -400, 0, -80)])} fill={tone(A, LAWN, -12)} />);
  els.push(<path key="lawnpv" d={poly([pm(A, -400, 0, PARK_EDGE), pm(A, 400, 0, PARK_EDGE), pm(A, 400, 0, PARK_EDGE - 0.6), pm(A, -400, 0, PARK_EDGE - 0.6)])} fill={tone(A, PAVE, PARK_EDGE)} />);
  // the gash: the whole width of the row pressed to DEAD rubble, across the side streets too
  const g = c01((crushAt(f) - 0.45) / 0.45);
  if (g > 0) {
    const A = clearer(c.A);
    const z0 = B3.z0 - 0.9;
    const z1 = B3.z1 + 1.0;
    els.push(<path key="gash" d={poly([pm(A, -600, 0, z0), pm(A, 600, 0, z0), pm(A, 600, 0, z1), pm(A, -600, 0, z1)])} fill={tone(A, LOT_FLOOR, ROUTE_Z)} opacity={g} />);
    // its torn edges: a darker line along both
    els.push(<path key="gashe" d={`M${pt(pm(A, -600, 0, z0))}L${pt(pm(A, 600, 0, z0))}M${pt(pm(A, -600, 0, z1))}L${pt(pm(A, 600, 0, z1))}`} stroke={tone(A, mixHex(DEAD, PAL.shadow, 0.5), ROUTE_Z)} strokeWidth={A.lw(1.4)} strokeOpacity={0.6 * g} />);
  }
  return <g>{els}</g>;
};

// ---- the solid line: a flat orange ribbon on the route row's roofs, pressed down with them onto the gash -----------
const SolidLine: React.FC<{ c: Ctx }> = ({ c }) => {
  const { A, f } = c;
  if (f < T.lineA) return null;
  const tip = lineTipX(f);
  const hh = lineHeightAt(f);
  const za = ROUTE_Z - 2;
  const zb = ROUTE_Z + 2;
  const col = A.toneO(ACCENT, ROUTE_Z * U, hh * U);
  const deep = A.toneO(ACCENT_DEEP, ROUTE_Z * U, hh * U);
  const top = poly([pm(A, LINE_X0, hh, za), pm(A, tip, hh, za), pm(A, tip, hh, zb), pm(A, LINE_X0, hh, zb)]);
  const edge = poly([pm(A, LINE_X0, hh, za), pm(A, tip, hh, za), pm(A, tip, hh - 0.45, za), pm(A, LINE_X0, hh - 0.45, za)]);
  const tp = pm(A, tip, hh, ROUTE_Z);
  const drawing = f <= T.lineB + 14;
  const tipR = 3.2 * A.P.r(ROUTE_Z * U) * U;
  return (
    <g>
      <defs>
        <radialGradient id="sltip">
          <stop offset="0" stopColor="#FFF1C8" stopOpacity={0.95} />
          <stop offset="0.35" stopColor={ACCENT} stopOpacity={0.6} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={edge} fill={deep} />
      <path d={top} fill={col} />
      {drawing ? <ellipse cx={tp[0]} cy={tp[1]} rx={tipR} ry={tipR * 0.8} fill="url(#sltip)" /> : null}
    </g>
  );
};

// ---- the dashed line: the refused route along the park-edge street, drawn by a moving tip ---------------------------
/** slim, line-like dashes: about the ribbon's width on screen, gaps the length of the dashes (m) */
const DASH = 7;
const GAP = 6.2;
const DASH_HALF = 0.7;
const DashedLine: React.FC<{ c: Ctx }> = ({ c }) => {
  const { A, f } = c;
  if (f < T.dashA) return null;
  const tip = dashTipX(f);
  const x0 = -220;
  const za = ALT_Z - DASH_HALF;
  const zb = ALT_Z + DASH_HALF;
  const hh = 0.25;
  const col = A.toneO(ACCENT, ALT_Z * U, 0);
  const deep = A.toneO(ACCENT_DEEP, ALT_Z * U, 0);
  // each dash a short piece of the solid ribbon: its top and its deep front edge
  let d = "";
  let e = "";
  for (let x = x0; x < tip; x += DASH + GAP) {
    const xb = Math.min(x + DASH, tip);
    d += poly([pm(A, x, hh, za), pm(A, xb, hh, za), pm(A, xb, hh, zb), pm(A, x, hh, zb)]);
    e += poly([pm(A, x, hh, za), pm(A, xb, hh, za), pm(A, xb, 0, za), pm(A, x, 0, za)]);
  }
  const tp = pm(A, tip, hh, ALT_Z);
  const tipR = 2.4 * A.P.r(ALT_Z * U) * U;
  return (
    <g>
      <defs>
        <radialGradient id="dltip">
          <stop offset="0" stopColor="#FFF1C8" stopOpacity={0.9} />
          <stop offset="0.35" stopColor={ACCENT} stopOpacity={0.55} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={e} fill={deep} />
      <path d={d} fill={col} />
      {f <= T.dashB + 10 ? <ellipse cx={tp[0]} cy={tp[1]} rx={tipR} ry={tipR * 0.7} fill="url(#dltip)" /> : null}
    </g>
  );
};

// ---- the park: a low wall and rounded trees ---------------------------------------------------------------------------
type Tree = { X: number; Z: number; r: number; h: number; seed: number };
const TREES: Tree[] = (() => {
  const out: Tree[] = [];
  // a dense park: rows of crowns on a jittered grid, a few gaps (lawn) left open
  for (let j = 0; j < 8; j++) {
    for (let i = -16; i <= 16; i++) {
      const s = j * 100 + i + 50;
      if (random(`tg${s}`) < 0.14) continue;
      const X = i * 7.4 + (j % 2) * 3.7 + (random(`tx${s}`) - 0.5) * 3.2;
      const Z = PARK_EDGE - 5 - j * 5.6 - random(`tz${s}`) * 2.2;
      out.push({ X, Z, r: 3.3 + random(`tr${s}`) * 1.5, h: 5.6 + random(`th${s}`) * 1.8, seed: s });
    }
  }
  return out;
})();
const TreeEl: React.FC<{ c: Ctx; t: Tree }> = ({ c, t }) => {
  const { A } = c;
  const rr = A.P.r(t.Z * U) * U;
  const base = pm(A, t.X, 0, t.Z);
  const cc = pm(A, t.X, t.h, t.Z);
  const R = t.r * rr;
  const trunk = tone(A, "#4E3F31", t.Z, 2);
  const blobs: [number, number, number][] = [
    [-0.45, 0.15, 0.72],
    [0.42, 0.2, 0.7],
    [0, -0.25, 0.85],
  ];
  const id = `tg${t.seed}`;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor={tone(A, TREE.lit, t.Z, t.h + 2)} />
          <stop offset="0.55" stopColor={tone(A, TREE.mid, t.Z, t.h)} />
          <stop offset="1" stopColor={tone(A, TREE.dark, t.Z, t.h - 2)} />
        </radialGradient>
      </defs>
      <ellipse cx={base[0] + R * 0.35} cy={base[1] - R * 0.05} rx={R * 1.1} ry={R * 0.38} fill={PAL.shadow} opacity={0.32 * (1 - A.fog(t.Z * U))} />
      <path d={`M${fx(base[0] - R * 0.09)},${fx(base[1])}L${fx(base[0] - R * 0.06)},${fx(cc[1])}L${fx(base[0] + R * 0.06)},${fx(cc[1])}L${fx(base[0] + R * 0.09)},${fx(base[1])}Z`} fill={trunk} />
      {blobs.map(([dx, dy, s], i) => (
        <circle key={i} cx={cc[0] + dx * R} cy={cc[1] + dy * R} r={R * s} fill={`url(#${id})`} />
      ))}
      <path d={`M${fx(cc[0] - R * 0.7)},${fx(cc[1] - R * 0.75)}A${fx(R * 0.85)},${fx(R * 0.85)} 0 0 1 ${fx(cc[0] + R * 0.2)},${fx(cc[1] - R * 1.05)}`} fill="none" stroke={PAL.cream} strokeOpacity={0.3 * (1 - A.fog(t.Z * U))} strokeWidth={R * 0.06} strokeLinecap="round" />
    </g>
  );
};

// ---- the folk on canvas -------------------------------------------------------------------------------------------
type Lookup = (key: string) => PandemicFolk.Sprite | undefined;
let TMP: HTMLCanvasElement | null = null;
const drawFigure = (ctx: CanvasRenderingContext2D, c: Ctx, g: FigDraw, get: Lookup) => {
  const { A, cam, f } = c;
  const Zu = g.Z * U;
  const feet = toScreen(cam, pm(A, g.X, 0, g.Z));
  const cr = g.w.crowd;
  const hPx = FIG * U * A.P.r(Zu) * cam.k * (cr ? (CROWD_UNITS[cr.kind] / 506) * (0.97 + 0.06 * ((cr.seed * 37) % 7) / 6) : 1);
  if (feet[0] < -90 || feet[0] > 1170 || feet[1] < -30 || feet[1] > 1920 + hPx * 1.2) return;
  const sp = get(cr ? crowdKey(cr.kind, cr.seed) : spriteKey(g.w.ink, g.yaw));
  if (!sp) return;
  // a walk: a little bob and rock on twos (the rig has no stride)
  const ph = g.moving ? (g.dist / 1.05) * Math.PI : 0;
  const ftw = Math.floor(f / 2) * 2;
  const bob = g.moving ? Math.abs(Math.sin(ph)) * 0.045 * hPx : 0;
  const idle = PandemicFolk.sway(ftw, g.w.id.length * 7 + g.w.ink + (cr ? cr.seed * 13 + Math.round(g.X * 3) : 0), FPS);
  const rot = g.moving ? 2.2 * Math.sin(ph) : idle.rot;
  void ftw;
  // the contact shadow (soft, to the lower right)
  const fog = A.figFog(Zu);
  const shR = hPx * 0.22;
  const sx = feet[0] + shR * 0.25;
  const sy = feet[1] - shR * 0.05;
  const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, shR);
  const sh = hexRgb(PAL.shadow);
  const a = 0.55 * (1 - fog) * (g.gloom ? 1 - g.gloom : 1);
  grd.addColorStop(0, `rgba(${sh[0]},${sh[1]},${sh[2]},${a.toFixed(3)})`);
  grd.addColorStop(1, `rgba(${sh[0]},${sh[1]},${sh[2]},0)`);
  ctx.save();
  if (g.clip) {
    ctx.beginPath();
    g.clip.forEach((q, i) => {
      const s = toScreen(cam, q);
      if (i === 0) ctx.moveTo(s[0], s[1]);
      else ctx.lineTo(s[0], s[1]);
    });
    ctx.closePath();
    ctx.clip();
  }
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(sx, sy, shR, shR * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  // the figure, fogged by its own distance (and darkened in a doorway) on a scratch canvas
  const pad = Math.ceil(hPx * 0.8);
  const W = Math.ceil(hPx * 1.2 + pad);
  const H = Math.ceil(hPx * 1.3 + pad);
  if (!TMP) TMP = document.createElement("canvas");
  TMP.width = W;
  TMP.height = H;
  const t = TMP.getContext("2d")!;
  t.clearRect(0, 0, W, H);
  const ox = W / 2;
  const oy = H - pad / 2;
  PandemicFolk.blitFolk(t, sp, ox, oy, hPx, { rot });
  const ff = A.folkFog(Zu);
  const air = typeof ff.rgb === "string" ? hexRgb(ff.rgb) : ff.rgb;
  t.globalCompositeOperation = "source-atop";
  if (ff.amount > 0.005) {
    t.fillStyle = `rgba(${Math.round(air[0])},${Math.round(air[1])},${Math.round(air[2])},${ff.amount.toFixed(3)})`;
    t.fillRect(0, 0, W, H);
  }
  if (g.gloom && g.gloom > 0.005) {
    const d = hexRgb(DOOR);
    t.fillStyle = `rgba(${d[0]},${d[1]},${d[2]},${g.gloom.toFixed(3)})`;
    t.fillRect(0, 0, W, H);
  }
  t.globalCompositeOperation = "source-over";
  ctx.drawImage(TMP, feet[0] - ox, feet[1] - bob - oy);
  ctx.restore();
};

// ---- the cut --------------------------------------------------------------------------------------------------------
const ThroughTheNeighborhood: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const get = PandemicFolk.useFolkSprites(useMemo(() => [...SPRITE_REQS, ...CROWD_REQS], []));
  const cam = swayCam(camAt(frame), frame);
  const A = airWorldOf({
    cam,
    rest: REST,
    depth: DEPTH,
    frame,
    scene: { fogNear: 1000, fogVis: 2300, fogMax: 0.9, hHigh: 600, moteUnit: 14 },
    figFog: { near: 450, vis: 2600, max: 0.7 },
  });
  const c: Ctx = { A, cam, f: frame };
  const halfW = 540 / cam.k;

  // ---- collect the items
  const items: Item[] = [];
  const inView = (b: Bldg) => {
    const r = A.P.r(b.Z0 * U);
    const xa = cam.cx + (b.X0 * U - cam.cx) * r;
    const xb = cam.cx + (b.X1 * U - cam.cx) * r;
    return xb > cam.cx - halfW - 40 && xa < cam.cx + halfW + 40;
  };
  for (const b of BLDGS) {
    if (!inView(b)) continue;
    const rz = b.small ? -2 : ROWS[b.row - 1].z0;
    items.push({ z: rz, xs: Math.abs((b.X0 + b.X1) / 2), svg: <Building key={b.key} c={c} b={b} /> });
  }
  // the park's low wall and trees
  items.push({ z: PARK_EDGE - 0.6, xs: 0, svg: <AirBox key="wall" A={A} X0={-400 * U} X1={400 * U} Y0={-0.9 * U} Y1={0} Z0={(PARK_EDGE - 0.6) * U} Z1={PARK_EDGE * U} mat={STONE} uid="pwall" lw={A.lw(0.9)} /> });
  for (const t of TREES) items.push({ z: t.Z, xs: Math.abs(t.X), svg: <TreeEl key={`t${t.seed}`} c={c} t={t} /> });
  items.push({ z: B3.z0 - 0.001, xs: 0, svg: <SolidLine key="solid" c={c} /> });
  items.push({ z: ALT_Z + 1.3, xs: 0, svg: <DashedLine key="dash" c={c} /> });
  // the folk
  const bByKey = (k: string) => BLDGS.find((b) => b.key === k)!;
  for (const w of WALKERS) {
    const st = walkerAt(w, frame);
    if (!st.visible) continue;
    const g: FigDraw = { w, X: st.X, Z: st.Z, yaw: st.yaw, moving: st.moving, dist: st.dist };
    let k: { z: number; xs: number } | null = null;
    if (w.door) {
      const b = bByKey(w.door.b);
      if (w.door.face === "front" && st.Z > b.Z0) {
        g.clip = frontDoorQuad(A, w.door.x, b.Z0);
        g.gloom = 0.55 * c01((st.Z - b.Z0) / 0.7);
        k = { z: B3.z0 - 0.0005, xs: 0 };
      }
      if (w.door.face !== "front") {
        const xs = w.door.x;
        const inside = w.door.face === "sideR" ? st.X < xs : st.X > xs;
        if (inside) {
          g.clip = sideDoorQuad(A, xs, w.door.z);
          g.gloom = 0.55 * c01(Math.abs(st.X - xs) / 0.8);
          if (b.small) k = { z: -2.0005, xs: 0 };
        }
      }
    }
    if (!k) {
      const rz = rowOf(st.Z);
      k = rz === null ? { z: st.Z, xs: Math.abs(st.X) } : { z: rz, xs: Math.abs(st.X) };
    }
    items.push({ z: k.z, xs: k.xs, fig: g });
  }
  items.sort((a, b) => (b.z !== a.z ? b.z - a.z : b.xs - a.xs));

  // ---- segment into SVG layers and canvas layers (the folk), in painter's order
  const layers: React.ReactNode[] = [];
  let svgBuf: React.ReactNode[] = [<Ground key="ground" c={c} />];
  let figBuf: FigDraw[] = [];
  const flushSvg = () => {
    if (!svgBuf.length) return;
    layers.push(
      <WorldSvg key={`s${layers.length}`} cam={cam}>
        {svgBuf}
      </WorldSvg>,
    );
    svgBuf = [];
  };
  const flushFig = () => {
    if (!figBuf.length) return;
    const list = figBuf.slice();
    layers.push(
      <PandemicFolk.FolkCanvas
        key={`c${layers.length}`}
        draw={(ctx) => {
          for (const g of list) drawFigure(ctx, c, g, get);
        }}
      />,
    );
    figBuf = [];
  };
  for (const it of items) {
    if (it.fig) {
      flushSvg();
      figBuf.push(it.fig);
    } else {
      flushFig();
      svgBuf.push(it.svg);
    }
  }
  flushFig();
  flushSvg();

  return (
    <AirStage v={A.v} bloom={0.22}>
      {layers}
    </AirStage>
  );
};

export default ThroughTheNeighborhood;
