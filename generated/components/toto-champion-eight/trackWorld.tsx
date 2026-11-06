// TRACK_READY
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLOR, GRAIN, GROUND, VIGNETTE, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { M, type P2 } from "./champShared";

// ===========================================================================
// trackWorld — THE KART CIRCUIT of the Cheeky Pint S4E01 clip "toto - you can spot a champion at eight" (cut 11
// PotentialInTheKart, cut 23 EightBeatsTen). Side view at eye level, a camera trucking alongside the karts, the
// circuit streaming past in parallax (user revision 1: "the kid racing on a racetrack, camera tracked to him").
// Cheeky Pint "air" warmth: the golden-hour SKY of droneSeaShared, picture-book card objects lit from the upper
// left (the sun), haze by depth, the kit's brown vignette and grain. Nothing black; NO amber anywhere in the world.
//
//   TrackStage    the whole frame: sky, trees + grandstand, catch fence, marshal posts, tyre wall, the finish banner,
//                 far grass, far kerb, asphalt (with the chequered finish strip when `finish` is set), near kerb, near
//                 verge, then `children` (your karts, placed with OnLane), `overlay`, then vignette + grain.
//   TrackCam      { x, k, D, eye, groundY, dx?, dy? }: see below. trackCam() / pullOut() / truck() build one.
//   OnLane        a <g> that maps a lane's WORLD coords (x along the track, y down, 0 = the ground) to the screen;
//                 put a champShared KartWithKid (or F1Outline) inside with k={laneK(cam, z)}.
//   laneK / laneGroundY / project / planeCam / screenSpeed   the projection, for anything placed by hand.
//   LANES         the racing lanes' depths (world px from the subject lane, + = farther away).
//
// UNITS. World px, M = 400 px per metre (champShared). x runs along the track (karts drive toward +x, to the
// right), y is down (0 = the ground), z is the depth from the subject lane (0) away from the camera.
// THE CAMERA. A level pinhole camera at distance D (world px) in front of the plane z = 0, its eye `eye` world px
// above the ground, looking straight across the track. `k` is the scale ON z = 0 (screen px per world px);
// a plane at depth z scales by laneK = k * D / (D + z). `x` is the world x on the frame's centre column (the truck),
// `groundY` the screen y of the ground line at z = 0 (that fixes the horizon at groundY - eye * k).
// A truck = move x; a zoom = change k at fixed D; a dolly = change D with k (pullOut() blends the two).
// SPEED. The repeating parts are sized so a truck at up to TRACK.vMax world px per frame never strobes (each
// pattern's period is >= 3x its per-frame step at every depth); every layer gets a horizontal motion blur from
// the `v` you pass (the camera's world speed per frame).
// ===========================================================================

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `trk${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// --- the circuit's layout (depths in world px, + = farther than the subject lane) -------------------------------
export const TRACK = {
  /** the near verge runs from the near kerb back toward the camera */
  nearKerb: [-4.4 * M, -3.8 * M] as const,
  /** the racing surface, near edge to far edge (8.8 m wide: its near part fills the frame's lower part; the near kerb
   *  stays below a close frame and rises into view as the camera pulls out) */
  asphalt: [-3.8 * M, 5.0 * M] as const,
  farKerb: [5.0 * M, 5.6 * M] as const,
  marshal: 7.4 * M,
  tyreWall: 9.2 * M,
  fence: 10.6 * M,
  stand: 19 * M,
  treesFront: 24 * M,
  treesBack: 34 * M,
  /** kerb block length (red, cream, red...), tyre stack width / tyre height, fence post spacing and height */
  kerbBlock: 1.0 * M,
  /** the near kerb's blocks are longer (it streams fastest: period / step stays >= 4.7 at 1.7x the depth scale) */
  nearKerbBlock: 1.4 * M,
  tyreW: 0.62 * M,
  tyreH: 0.25 * M,
  tyreRows: 4,
  fencePost: 3.2 * M,
  fenceH: 2.8 * M,
  /** the fastest truck (world px / frame) the patterns are sized for: kerb period / step >= 4.7, tyre wall >= 5.8 */
  vMax: 170,
} as const;
/** racing lanes: depth from the subject lane (world px). A kart on a farther lane is smaller and higher. */
export const LANES = { near: -1.4 * M, subject: 0, mid: 1.3 * M, far: 2.6 * M, farthest: 3.9 * M } as const;

/** the circuit's own card tones (warm, muted, nothing black; never amber) */
export const TRACK_COLOR = {
  asphaltFar: "#9C9186",
  asphaltNear: "#716961",
  asphaltDark: "#5F5750",
  asphaltLight: "#ABA194",
  asphaltFleck: "#C2B8A9",
  line: "#EDE4D2",
  kerbRed: "#B65A41",
  kerbRedFoot: "#93452F",
  kerbCream: COLOR.cream,
  kerbCreamFoot: "#D8CDB8",
  grassFar: "#A7A56F",
  grass: "#8F9757",
  grassDark: "#717B3F",
  grassLit: "#ADB16D",
  flower: "#EFE4CC",
  tyre: "#4D423B",
  tyreLit: "#6A5D54",
  tyreGroove: "#3A312B",
  tyreCream: "#E7DCC7",
  tyreRed: "#B65A41",
  fence: "#8E8578",
  fenceLit: "#B3A999",
  mesh: "#C9BEAA",
  tree: ["#6C7744", "#5C683B", "#7C874D", "#66703F"],
  treeLit: ["#97A060", "#879252", "#A3AB69", "#8F985A"],
  trunk: "#6B5541",
  stand: "#D2C2A5",
  standShade: "#A99579",
  standRoof: "#BFAE8F",
  seatsA: "#A07D62",
  seatsB: "#8F9273",
  crowd: ["#C47B5A", "#737D8A", "#E2CFAA", "#949A6A", "#9A6878", "#F2E7D3"],
  booth: "#E9DFCB",
  boothRoof: "#949A6A",
  check: "#4A3F38",
  checkCream: "#EFE6D4",
  shadow: COLOR.shadow,
} as const;

// --- the camera ----------------------------------------------------------------------------------------------
export type TrackCam = {
  /** world x on the frame's centre column */
  x: number;
  /** scale on the subject lane z = 0 (screen px per world px) */
  k: number;
  /** the camera's distance to z = 0 (world px) */
  D: number;
  /** the eye's height above the ground (world px) */
  eye: number;
  /** the screen y of the ground line at z = 0 */
  groundY: number;
  /** a screen-px shake / sway applied to the whole picture (optional) */
  dx?: number;
  dy?: number;
};
export const laneK = (c: TrackCam, z: number) => (c.k * c.D) / (c.D + z);
export const horizonY = (c: TrackCam) => c.groundY - c.eye * c.k;
export const laneGroundY = (c: TrackCam, z: number) => horizonY(c) + c.eye * laneK(c, z);
/** a world point (x, y down from the ground, depth z) -> screen px */
export const project = (c: TrackCam, wx: number, wy: number, z: number): P2 => {
  const kz = laneK(c, z);
  return [540 + (wx - c.x) * kz + (c.dx ?? 0), horizonY(c) + (c.eye + wy) * kz + (c.dy ?? 0)];
};
/** the SVG transform that maps lane z's world coords (y 0 = the ground) to the screen */
export const laneTransform = (c: TrackCam, z: number) => {
  const kz = laneK(c, z);
  return `matrix(${f3(kz)} 0 0 ${f3(kz)} ${f3(540 - c.x * kz + (c.dx ?? 0))} ${f3(laneGroundY(c, z) + (c.dy ?? 0))})`;
};
/** a stout-style camera {x, y, k} for lane z (for stoutShared helpers like amberBandFor; y: world y at the frame's middle) */
export const planeCam = (c: TrackCam, z = 0) => {
  const kz = laneK(c, z);
  return { x: c.x - (c.dx ?? 0) / kz, y: (960 - laneGroundY(c, z) - (c.dy ?? 0)) / kz, k: kz };
};
/** a world speed (px / frame along x) at depth z -> screen px / frame */
export const screenSpeed = (c: TrackCam, v: number, z = 0) => v * laneK(c, z);
/** the default rig: the camera 6 m off the subject lane, its eye 1.5 m up (a marshal's eye: the lanes separate) */
export const TRACK_RIG = { D: 6 * M, eye: 1.5 * M } as const;
export const trackCam = (x: number, k: number, groundY: number, D: number = TRACK_RIG.D, eye: number = TRACK_RIG.eye): TrackCam => ({ x, k, D, eye, groundY });
/**
 * A pull-out from (k0, D0) to scale k: `dolly` 0 = a pure zoom (D fixed), 1 = a pure dolly (the focal length fixed, the
 * camera moving back: the background shrinks less than the subject). Returns { k, D }.
 */
export const pullOut = (k0: number, D0: number, k: number, dolly = 0.7) => ({ k, D: D0 * Math.pow(k0 / k, dolly) });
/** distance trucked by frame f at speed v(f) (world px / frame), integrated at 4 steps per frame from f0 */
export const truck = (f: number, v: (f: number) => number, f0 = 0) => {
  let d = 0;
  const n = Math.max(0, Math.ceil((f - f0) * 4));
  const h = n ? (f - f0) / n : 0;
  for (let i = 0; i < n; i++) d += v(f0 + (i + 0.5) * h) * h;
  return d;
};

/** places children on lane z: world coords inside (x along the track, y down, 0 = the ground) */
export const OnLane: React.FC<{ cam: TrackCam; z: number; children?: React.ReactNode }> = ({ cam, z, children }) => (
  <g transform={laneTransform(cam, z)}>{children}</g>
);

// --- the stage -----------------------------------------------------------------------------------------------
export type TrackStageProps = {
  /** the story clock (clouds drift, grain on twos, flags) */
  S: number;
  cam: TrackCam;
  /** the camera's world speed (px / frame along x): sets the motion blur of every layer */
  v?: number;
  /** a finish line across the track at world x (its leading edge), with a chequered banner on two posts on the far
   *  verge over it (gantry: false = the strip alone) */
  finish?: { x: number; gantry?: boolean } | null;
  /** your karts (OnLane groups), far lanes first */
  children?: React.ReactNode;
  /** drawn over everything but the gantry's near leg, the vignette and the grain (screen px) */
  overlay?: React.ReactNode;
  /** world seed offset (different tree / mark layouts) */
  seed?: number;
};

const CLOUDS = [
  { x: 140, h: 760, w: 420, t: 26, a: 0.3, v: 0.16 },
  { x: 880, h: 640, w: 520, t: 22, a: 0.26, v: 0.12 },
  { x: 520, h: 470, w: 640, t: 18, a: 0.28, v: 0.1 },
  { x: 1300, h: 330, w: 480, t: 14, a: 0.24, v: 0.08 },
  { x: 260, h: 200, w: 700, t: 12, a: 0.26, v: 0.06 },
];

export const TrackStage: React.FC<TrackStageProps> = ({ S, cam, v = 0, finish = null, children, overlay, seed = 0 }) => {
  const uid = uidOf(useId());
  const c = cam;
  const hor = horizonY(c);
  const kz = (z: number) => laneK(c, z);
  const P = (wx: number, wy: number, z: number) => project(c, wx, wy, z);
  const yG = (z: number) => laneGroundY(c, z) + (c.dy ?? 0);
  const fog = (z: number) => (z > 0 ? 0.62 * (1 - Math.exp(-z / (26 * M))) : 0);
  const hz = (col: string, z: number) => mixHex(col, SKY.haze, fog(z));
  /** the world x range visible at depth z (+ a margin in screen px) */
  const xr = (z: number, margin = 160): [number, number] => {
    const s = kz(z);
    return [c.x - (540 + margin + Math.abs(c.dx ?? 0)) / s, c.x + (540 + margin + Math.abs(c.dx ?? 0)) / s];
  };
  // blur: the motion (a ~180-degree shutter's box, as a gaussian) plus a little depth of field off the subject lane
  const defs: React.ReactNode[] = [];
  const blurG = (key: string, z: number, node: React.ReactNode, extraDof = 1) => {
    const mb = Math.min(44, 0.15 * Math.abs(v) * kz(z));
    const dof = extraDof * 3.2 * c.k * Math.abs(z) / (c.D + Math.max(z, -c.D * 0.9)) * (z > 0 ? 1 : 0.12);
    const sx = mb + dof;
    // the near verge: a touch of vertical softness too, so the tufts' flat feet never draw hard lines
    const sy = z < 0 ? Math.max(dof, Math.min(6, 1 + 0.08 * mb)) : dof;
    if (sx < 0.3 && sy < 0.3) return <g key={key}>{node}</g>;
    const id = `${uid}${key}`;
    defs.push(
      <filter key={id} id={id} filterUnits="userSpaceOnUse" x={-500} y={-300} width={2080} height={2600} colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation={`${f3(sx)} ${f3(sy)}`} />
      </filter>,
    );
    return (
      <g key={key} filter={`url(#${id})`}>
        {node}
      </g>
    );
  };
  /** tiled items: every item of a tile of length L (world px) whose x falls in the visible range at depth z */
  const tiled = <T,>(z: number, L: number, items: (T & { x: number })[], draw: (it: T & { x: number }, wx: number, key: string) => React.ReactNode, margin = 300, ext = 0) => {
    // `ext`: how far an item reaches to the right of its x (world px), so one that starts left of the frame still draws
    const [a0, b] = xr(z, margin);
    const a = a0 - ext;
    const out: React.ReactNode[] = [];
    for (let n = Math.floor(a / L) - 1; n <= Math.floor(b / L) + 1; n++)
      items.forEach((it, i) => {
        const wx = n * L + it.x;
        if (wx >= a - L * 0.02 && wx <= b) out.push(draw(it, wx, `${n}_${i}`));
      });
    return out;
  };
  const quad = (pts: P2[]) => `M${pts.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}Z`;
  const band = (z0: number, z1: number) => [yG(z1), yG(z0)] as const; // (far, near) screen y

  // --- sky ---------------------------------------------------------------------------------------------------
  const sx = c.dx ?? 0;
  const sky = (
    <g key="sky">
      <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, hor + 80))} fill={`url(#${uid}sky)`} />
      <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, hor + 80))} fill={`url(#${uid}sun)`} />
      <g style={{ filter: "blur(16px)" }}>
        {CLOUDS.map((q, i) => {
          const cx = ((q.x + S * q.v - c.x * 0.004) % 1700 + 1700) % 1700 - 300 + sx;
          return <ellipse key={i} cx={f3(cx)} cy={f3(hor - q.h * Math.sqrt(c.k / 0.6))} rx={q.w} ry={q.t} fill={q.h > 450 ? SKY.cloudHi : SKY.cloudLo} opacity={q.a} />;
        })}
      </g>
      <rect x={-60} y={f3(hor - 90)} width={1200} height={110} fill={SKY.haze} opacity={0.55} style={{ filter: "blur(20px)" }} />
    </g>
  );

  // --- the far ground under everything (grass, hazed toward the horizon) -----------------------------------------
  const ground = <rect key="g" x={-60} y={f3(hor - 2)} width={1200} height={f3(Math.max(0, 2000 - hor))} fill={`url(#${uid}far)`} />;

  // --- trees and the grandstand ---------------------------------------------------------------------------------
  const treeItems = (row: number, n: number, L: number) =>
    Array.from({ length: n }, (_, i) => {
      const h1 = hash(i * 3.1 + row * 17 + seed);
      const h2 = hash(i * 5.7 + row * 23 + seed);
      const h3 = hash(i * 9.3 + row * 31 + seed);
      return { x: ((i + 0.15 + 0.7 * h1) / n) * L, h: (4.6 + 4.6 * h2) * M, r: (1.5 + 1.5 * h3) * M, tone: Math.floor(h2 * 4) % 4, tall: h3 > 0.78 };
    });
  const drawTree = (z: number) => (t: { x: number; h: number; r: number; tone: number; tall: boolean }, wx: number, key: string) => {
    const s = kz(z);
    const [bx, by] = P(wx, 0, z);
    const cyc = by - (t.h - t.r) * s;
    const base = hz(TRACK_COLOR.tree[t.tone], z);
    const lit = hz(TRACK_COLOR.treeLit[t.tone], z);
    const R = t.r * s;
    const rx = t.tall ? R * 0.62 : R;
    const ry = t.tall ? R * 1.5 : R;
    return (
      <g key={key}>
        <ellipse cx={f3(bx + R * 0.35)} cy={f3(by)} rx={f3(R * 0.9)} ry={f3(Math.max(1, R * 0.08))} fill={hz(TRACK_COLOR.grassDark, z)} opacity={0.5} />
        <rect x={f3(bx - 0.13 * M * s)} y={f3(cyc)} width={f3(0.26 * M * s)} height={f3(by - cyc)} fill={hz(TRACK_COLOR.trunk, z)} />
        <ellipse cx={f3(bx)} cy={f3(cyc)} rx={f3(rx)} ry={f3(ry)} fill={base} />
        {t.tall ? null : <circle cx={f3(bx + R * 0.62)} cy={f3(cyc + R * 0.25)} r={f3(R * 0.7)} fill={base} />}
        {t.tall ? null : <circle cx={f3(bx - R * 0.7)} cy={f3(cyc + R * 0.3)} r={f3(R * 0.62)} fill={base} />}
        <ellipse cx={f3(bx - rx * 0.2)} cy={f3(cyc - ry * 0.2)} rx={f3(rx * 0.72)} ry={f3(ry * 0.7)} fill={lit} />
        {t.tall ? null : <circle cx={f3(bx - R * 0.82)} cy={f3(cyc + R * 0.12)} r={f3(R * 0.42)} fill={lit} />}
      </g>
    );
  };
  const treesBack = blurG("tb", TRACK.treesBack, tiled(TRACK.treesBack, 70 * M, treeItems(1, 13, 70 * M), drawTree(TRACK.treesBack)), 1.3);
  const treesFront = blurG("tf", TRACK.treesFront, tiled(TRACK.treesFront, 56 * M, treeItems(2, 7, 56 * M).filter((t) => t.x < 34 * M || t.x > 52 * M), drawTree(TRACK.treesFront)), 1.2);
  // the grandstand: one in every 56 m tile (between the front trees), seats in rows, a few spectators, the roof
  const standL = 15 * M;
  const crowd = Array.from({ length: 46 }, (_, i) => ({ x: hash(i * 1.7 + 5 + seed) * standL, row: i % 4, tone: Math.floor(hash(i * 2.3 + 9) * 6) % 6 }));
  const drawStand = (_t: { x: number }, wx: number, key: string) => {
    const z = TRACK.stand;
    const s = kz(z);
    const X = (u: number) => P(wx + u, 0, z)[0];
    const Y = (h: number) => P(wx, -h, z)[1];
    const H = (m: number) => m * M;
    const rows = [0, 1, 2, 3].map((r) => ({ y0: H(0.9 + r * 0.7), y1: H(0.9 + r * 0.7 + 0.7), col: r % 2 ? TRACK_COLOR.seatsB : TRACK_COLOR.seatsA }));
    return (
      <g key={key}>
        <rect x={f3(X(0))} y={f3(Y(H(4.6)))} width={f3(standL * s)} height={f3(Y(0) - Y(H(4.6)))} fill={hz(TRACK_COLOR.standShade, z)} />
        {rows.map((r, i) => (
          <rect key={i} x={f3(X(0))} y={f3(Y(r.y1))} width={f3(standL * s)} height={f3(Y(r.y0) - Y(r.y1))} fill={hz(r.col, z)} />
        ))}
        {crowd.map((p, i) => {
          const hy = H(0.9 + p.row * 0.7 + 0.42);
          return <circle key={`c${i}`} cx={f3(X(p.x))} cy={f3(Y(hy))} r={f3(0.17 * M * s)} fill={hz(TRACK_COLOR.crowd[p.tone], z)} />;
        })}
        <rect x={f3(X(0))} y={f3(Y(H(0.9)))} width={f3(standL * s)} height={f3(Y(0) - Y(H(0.9)))} fill={hz(TRACK_COLOR.stand, z)} />
        {[0.4, 5.2, 10, 14.6].map((u, i) => (
          <rect key={`p${i}`} x={f3(X(H(u)))} y={f3(Y(H(5.2)))} width={f3(0.2 * M * s)} height={f3(Y(H(3.7)) - Y(H(5.2)))} fill={hz(TRACK_COLOR.standShade, z)} />
        ))}
        <rect x={f3(X(-H(0.6)))} y={f3(Y(H(5.6)))} width={f3((standL + H(1.2)) * s)} height={f3(Y(H(5.1)) - Y(H(5.6)))} fill={hz(TRACK_COLOR.standRoof, z)} />
        <rect x={f3(X(-H(0.6)))} y={f3(Y(H(5.6)))} width={f3((standL + H(1.2)) * s)} height={f3(Math.max(1, 0.08 * M * s))} fill={hz(TRACK_COLOR.checkCream, z)} />
      </g>
    );
  };
  const stand = blurG("st", TRACK.stand, tiled(TRACK.stand, 56 * M, [{ x: 36 * M }], drawStand, 300, standL + 1.2 * M), 1.2);

  // --- the catch fence ----------------------------------------------------------------------------------------
  const fz = TRACK.fence;
  const fs = kz(fz);
  const fTop = P(0, -TRACK.fenceH, fz)[1];
  const fBase = yG(fz);
  const fence = blurG(
    "fe",
    fz,
    <>
      <rect x={-300} y={f3(fTop)} width={1680} height={f3(fBase - fTop)} fill={hz(TRACK_COLOR.mesh, fz)} opacity={0.3} />
      {[1, 0.55, 0.08].map((h, i) => (
        <rect key={i} x={-300} y={f3(P(0, -TRACK.fenceH * h, fz)[1])} width={1680} height={f3(Math.max(1, 0.045 * M * fs))} fill={hz(TRACK_COLOR.fence, fz)} />
      ))}
      {tiled(fz, TRACK.fencePost, [{ x: 0 }], (_t, wx, key) => {
        const [x0] = P(wx, 0, fz);
        const w = 0.1 * M * fs;
        return (
          <g key={key}>
            <rect x={f3(x0)} y={f3(fTop - 0.1 * M * fs)} width={f3(w)} height={f3(fBase - fTop + 0.1 * M * fs)} fill={hz(TRACK_COLOR.fence, fz)} />
            <rect x={f3(x0)} y={f3(fTop - 0.1 * M * fs)} width={f3(Math.max(0.8, w * 0.35))} height={f3(fBase - fTop + 0.1 * M * fs)} fill={hz(TRACK_COLOR.fenceLit, fz)} />
          </g>
        );
      })}
    </>,
  );

  // --- the tyre wall: four rows of tyres; the top and bottom rows plain (continuous bands: no per-stack seam to
  // strobe), the two middle rows painted in blocks of two stacks, red then cream (period 4 stacks = 2.48 m) --------------
  const tz = TRACK.tyreWall;
  const ts = kz(tz);
  const tBase = yG(tz);
  const th = TRACK.tyreH * ts;
  const rowBand = (r: number, key: string) => {
    const y1 = tBase - r * th;
    return (
      <g key={key}>
        <rect x={-300} y={f3(y1 - th * 0.97)} width={1680} height={f3(th * 0.97)} rx={f3(th * 0.4)} fill={hz(TRACK_COLOR.tyre, tz)} />
        <rect x={-300} y={f3(y1 - th * 0.92)} width={1680} height={f3(Math.max(0.8, th * 0.16))} fill={hz(TRACK_COLOR.tyreLit, tz)} />
        <rect x={-300} y={f3(y1 - th * 0.12)} width={1680} height={f3(Math.max(0.8, th * 0.12))} fill={hz(TRACK_COLOR.tyreGroove, tz)} opacity={0.6} />
      </g>
    );
  };
  const tyreWall = blurG(
    "ty",
    tz,
    <>
      {/* its shadow on the grass in front (the sun is behind it, upper left) */}
      <rect x={-300} y={f3(tBase - 1)} width={1680} height={f3(yG(tz - 0.7 * M) - tBase + 1)} fill={hz(TRACK_COLOR.grassDark, tz)} opacity={0.55} />
      {[0, 1, 2, 3].map((r) => rowBand(r, `r${r}`))}
      {tiled(
        tz,
        TRACK.tyreW * 4,
        [{ x: 0, p: 1 }, { x: TRACK.tyreW * 2, p: 0 }],
        (t, wx, key) => {
          const x0 = P(wx, 0, tz)[0];
          const w = TRACK.tyreW * 2 * ts;
          const paint = t.p ? TRACK_COLOR.tyreRed : TRACK_COLOR.tyreCream;
          return (
            <g key={key}>
              {[1, 2].map((r) => {
                const y1 = tBase - r * th;
                return (
                  <g key={r}>
                    <rect x={f3(x0 + w * 0.01)} y={f3(y1 - th * 0.97)} width={f3(w * 0.98)} height={f3(th * 0.97)} rx={f3(th * 0.35)} fill={hz(paint, tz)} />
                    <rect x={f3(x0 + w * 0.03)} y={f3(y1 - th * 0.92)} width={f3(w * 0.94)} height={f3(Math.max(0.8, th * 0.16))} rx={f3(th * 0.08)} fill={hz(mixHex(paint, "#FFF4E2", 0.3), tz)} />
                    <rect x={f3(x0 + w * 0.01)} y={f3(y1 - th * 0.14)} width={f3(w * 0.98)} height={f3(Math.max(0.8, th * 0.14))} fill={hz(mixHex(paint, TRACK_COLOR.tyreGroove, 0.45), tz)} />
                  </g>
                );
              })}
            </g>
          );
        },
        300,
        TRACK.tyreW * 2,
      )}
    </>,
  );

  // --- marshal posts (a booth and a waving sage flag) every 46 m --------------------------------------------------
  const mz = TRACK.marshal;
  const marshal = blurG(
    "ma",
    mz,
    tiled(mz, 46 * M, [{ x: 20 * M }], (_t, wx, key) => {
      const s = kz(mz);
      const [x0, y0] = P(wx, 0, mz);
      const bw = 1.5 * M * s;
      const bh = 2.1 * M * s;
      const pole = 3.4 * M * s;
      const wave = Math.sin(S * 0.45 + wx * 0.001);
      const fy = y0 - pole;
      const fl = 0.9 * M * s;
      return (
        <g key={key}>
          <ellipse cx={f3(x0 + bw * 0.7)} cy={f3(y0)} rx={f3(bw * 0.8)} ry={f3(Math.max(1, bh * 0.05))} fill={TRACK_COLOR.grassDark} opacity={0.5} />
          <rect x={f3(x0)} y={f3(y0 - bh)} width={f3(bw)} height={f3(bh)} fill={hz(TRACK_COLOR.booth, mz)} />
          <rect x={f3(x0 + bw * 0.2)} y={f3(y0 - bh * 0.78)} width={f3(bw * 0.6)} height={f3(bh * 0.3)} fill={hz(TRACK_COLOR.standShade, mz)} />
          <rect x={f3(x0 - bw * 0.08)} y={f3(y0 - bh - 0.18 * M * s)} width={f3(bw * 1.16)} height={f3(0.2 * M * s)} fill={hz(TRACK_COLOR.boothRoof, mz)} />
          <rect x={f3(x0 + bw * 1.25)} y={f3(fy)} width={f3(Math.max(1, 0.05 * M * s))} height={f3(pole)} fill={hz(TRACK_COLOR.fence, mz)} />
          <path
            d={`M${f3(x0 + bw * 1.27)} ${f3(fy)} C${f3(x0 + bw * 1.27 + fl * 0.4)} ${f3(fy - fl * 0.12 * wave)} ${f3(x0 + bw * 1.27 + fl * 0.7)} ${f3(fy + fl * 0.12 * wave)} ${f3(x0 + bw * 1.27 + fl)} ${f3(fy + fl * 0.04 * wave)} L${f3(x0 + bw * 1.27 + fl)} ${f3(fy + fl * 0.6 + fl * 0.04 * wave)} C${f3(x0 + bw * 1.27 + fl * 0.7)} ${f3(fy + fl * 0.6 + fl * 0.12 * wave)} ${f3(x0 + bw * 1.27 + fl * 0.4)} ${f3(fy + fl * 0.6 - fl * 0.12 * wave)} ${f3(x0 + bw * 1.27)} ${f3(fy + fl * 0.6)} Z`}
            fill={hz(TRACK_COLOR.boothRoof, mz)}
          />
        </g>
      );
    }),
  );

  // --- grass tufts on a ground row at depth z (random: no period to strobe) -------------------------------------
  const tuftRow = (z: number, row: number, n: number, L: number, scale = 1) =>
    tiled(
      z,
      L,
      Array.from({ length: n }, (_, i) => ({ x: hash(i * 7.7 + row * 13 + seed) * L, h: hash(i * 3.3 + row * 5 + seed), f: hash(i * 11.1 + row * 3 + seed) > 0.82 })),
      (t, wx, key) => {
        const s = kz(z) * scale;
        const [x0, y0] = P(wx, 0, z);
        const hh = (0.07 + 0.08 * t.h) * M * s;
        const ww = 0.06 * M * s;
        const col = hz(t.h > 0.5 ? TRACK_COLOR.grassDark : TRACK_COLOR.grassLit, z);
        return (
          <g key={key}>
            <path d={`M${f3(x0 - ww * 1.6)} ${f3(y0)} L${f3(x0 - ww * 0.9)} ${f3(y0 - hh)} L${f3(x0 - ww * 0.2)} ${f3(y0)} L${f3(x0 + ww * 0.3)} ${f3(y0 - hh * 1.3)} L${f3(x0 + ww)} ${f3(y0)} L${f3(x0 + ww * 1.5)} ${f3(y0 - hh * 0.8)} L${f3(x0 + ww * 2)} ${f3(y0)} Z`} fill={col} />
            {t.f ? <circle cx={f3(x0 + ww * 0.3)} cy={f3(y0 - hh * 1.3)} r={f3(Math.max(0.7, ww * 0.55))} fill={hz(TRACK_COLOR.flower, z)} /> : null}
          </g>
        );
      },
    );
  const farGrassRows = [6.0, 6.7, 7.5, 8.3].map((m, i) => blurG(`fg${i}`, m * M, tuftRow(m * M, i, 26, 14 * M)));

  // --- kerbs: red / cream blocks, a raised face toward the camera ------------------------------------------------
  const kerb = (z0: number, z1: number, key: string, BL: number = TRACK.kerbBlock) => {
    const h = 0.05 * M;
    return blurG(
      key,
      (z0 + z1) / 2,
      tiled(z1, BL * 2, [{ x: 0, p: 0 }, { x: BL, p: 1 }], (t, wx, k2) => {
        const a = wx;
        const b = wx + BL;
        const top = quad([P(a, -h, z1), P(b, -h, z1), P(b, -h, z0), P(a, -h, z0)]);
        const face = quad([P(a, -h, z0), P(b, -h, z0), P(b, 0, z0), P(a, 0, z0)]);
        return (
          <g key={k2}>
            <path d={top} fill={t.p ? TRACK_COLOR.kerbCream : TRACK_COLOR.kerbRed} />
            <path d={face} fill={t.p ? TRACK_COLOR.kerbCreamFoot : TRACK_COLOR.kerbRedFoot} />
          </g>
        );
      }, 400, BL),
    );
  };

  // --- the asphalt: a warm grey surface, the rubbered racing line, rubber marks and patches streaming past -----------
  const [aNear, aFar] = [TRACK.asphalt[0], TRACK.asphalt[1]];
  const [ayFar, ayNear] = band(aNear, aFar);
  const marks = (bucket: number) => {
    const NB = 6;
    const zs = Array.from({ length: NB + 1 }, (_, i) => lerp(aNear + 0.1 * M, aFar - 0.1 * M, i / NB));
    const zA = zs[bucket];
    const zB = zs[bucket + 1];
    const L = 12 * M;
    // three kinds, all random (no period): rubber streaks (long, thin, dark), aggregate flecks (short, light: the
    // motion blur draws them into speed lines) and a few repair patches
    const items = Array.from({ length: 50 }, (_, i) => {
      const q = i + bucket * 100;
      const kind = i < 12 ? 0 : i < 47 ? 1 : 2;
      const h = (n: number) => hash(q * n + seed);
      const len = (kind === 0 ? 1.0 + 3.2 * h(2.7) : kind === 1 ? 0.08 + 0.3 * h(2.7) : 0.6 + 1.2 * h(2.7)) * M;
      const w = (kind === 0 ? 0.015 + 0.04 * h(6.3) : kind === 1 ? 0.012 + 0.02 * h(6.3) : 0.15 + 0.2 * h(6.3)) * M;
      const col = kind === 0 ? TRACK_COLOR.asphaltDark : kind === 1 ? TRACK_COLOR.asphaltFleck : h(8.9) > 0.5 ? TRACK_COLOR.asphaltDark : TRACK_COLOR.asphaltLight;
      const a = kind === 0 ? 0.22 + 0.2 * h(3.9) : kind === 1 ? 0.3 + 0.3 * h(3.9) : 0.08 + 0.06 * h(3.9);
      return { x: h(1.9) * L, z: lerp(zA, zB, h(4.1)), len, w, col, a };
    });
    return blurG(
      `am${bucket}`,
      (zA + zB) / 2,
      tiled(zB, L, items, (t, wx, key) => {
        const s = kz(t.z);
        const [x0, y0] = P(wx, 0, t.z);
        const ry = Math.max(0.7, (c.eye * s * s * t.w) / (2 * c.k * c.D));
        return <ellipse key={key} cx={f3(x0 + (t.len * s) / 2)} cy={f3(y0)} rx={f3((t.len * s) / 2)} ry={f3(ry)} fill={t.col} opacity={t.a} />;
      }, 800, 4.3 * M),
    );
  };
  const lineAt = (z0: number, z1: number, key: string) => {
    const [y0, y1] = band(z0, z1);
    return <rect key={key} x={-300} y={f3(y0)} width={1680} height={f3(Math.max(0.8, y1 - y0))} fill={TRACK_COLOR.line} opacity={0.85} />;
  };
  const [rlFar, rlNear] = band(-0.7 * M, 0.7 * M);
  const asphalt = (
    <g key="asphalt">
      <rect x={-300} y={f3(ayFar)} width={1680} height={f3(ayNear - ayFar)} fill={`url(#${uid}asp)`} />
      <rect x={-300} y={f3(rlFar)} width={1680} height={f3(rlNear - rlFar)} fill={TRACK_COLOR.asphaltDark} opacity={0.12} />
      {[0, 1, 2, 3, 4, 5].map((b) => marks(b))}
      {lineAt(aFar - 0.14 * M, aFar - 0.04 * M, "lf")}
      {lineAt(aNear + 0.04 * M, aNear + 0.14 * M, "ln")}
    </g>
  );

  // --- the finish line: a chequered strip across the asphalt, a gantry over it -------------------------------------
  const FIN_W = 1.2 * M;
  const FIN_ROWS = 16;
  const finishStrip = finish
    ? (() => {
        const cols = 3;
        const cells: React.ReactNode[] = [];
        for (let j = 0; j < FIN_ROWS; j++) {
          const z0 = lerp(aNear, aFar, j / FIN_ROWS);
          const z1 = lerp(aNear, aFar, (j + 1) / FIN_ROWS);
          for (let i = 0; i < cols; i++) {
            const a = finish.x + (i * FIN_W) / cols;
            const b = finish.x + ((i + 1) * FIN_W) / cols;
            cells.push(<path key={`${i}_${j}`} d={quad([P(a, 0, z1), P(b, 0, z1), P(b, 0, z0), P(a, 0, z0)])} fill={(i + j) % 2 ? TRACK_COLOR.check : TRACK_COLOR.checkCream} />);
          }
        }
        return blurG("fin", (aNear + aFar) / 2, <>{cells}</>);
      })()
    : null;
  // the finish banner: two posts on the far verge, a chequered banner between them facing the track (no text)
  const BANNER = { z: 6.0 * M, left: -1.4 * M, right: 2.6 * M, y0: 2.3 * M, y1: 3.1 * M, post: 0.16 * M, top: 3.4 * M, cols: 10, rows: 2 };
  const gantryBack =
    finish && finish.gantry !== false
      ? (() => {
          const B = BANNER;
          const bz = B.z;
          const s = kz(bz);
          const x0 = finish.x + B.left;
          const x1 = finish.x + B.right;
          const cells: React.ReactNode[] = [];
          for (let i = 0; i < B.cols; i++)
            for (let r = 0; r < B.rows; r++) {
              const a = lerp(x0, x1, i / B.cols);
              const b = lerp(x0, x1, (i + 1) / B.cols);
              const ya = lerp(-B.y1, -B.y0, r / B.rows);
              const yb = lerp(-B.y1, -B.y0, (r + 1) / B.rows);
              const pa = P(a, ya, bz);
              const pb = P(b, yb, bz);
              cells.push(<rect key={`${i}_${r}`} x={f3(pa[0])} y={f3(pa[1])} width={f3(pb[0] - pa[0])} height={f3(pb[1] - pa[1])} fill={(i + r) % 2 ? TRACK_COLOR.check : TRACK_COLOR.checkCream} />);
            }
          const post = (x: number, key: string) => {
            const [px, py] = P(x - B.post / 2, 0, bz);
            const ty = P(x, -B.top, bz)[1];
            return (
              <g key={key}>
                <ellipse cx={f3(px + B.post * s * 2)} cy={f3(py)} rx={f3(B.post * s * 3)} ry={f3(Math.max(1, B.post * s * 0.4))} fill={TRACK_COLOR.grassDark} opacity={0.5} />
                <rect x={f3(px)} y={f3(ty)} width={f3(B.post * s)} height={f3(py - ty)} fill={hz(TRACK_COLOR.booth, bz)} />
                <rect x={f3(px)} y={f3(ty)} width={f3(Math.max(0.8, B.post * s * 0.35))} height={f3(py - ty)} fill="#FFF4E2" opacity={0.7} />
              </g>
            );
          };
          const [fx0, fy0] = P(x0, -B.y1, bz);
          const [fx1, fy1] = P(x1, -B.y0, bz);
          return blurG(
            "gb",
            bz,
            <>
              <rect x={f3(fx0 + 0.12 * M * s)} y={f3(fy0 + 0.12 * M * s)} width={f3(fx1 - fx0)} height={f3(fy1 - fy0)} fill={COLOR.shadow} opacity={0.18} />
              {post(x0 + B.post, "pl")}
              {post(x1 - B.post, "pr")}
              {cells}
              <rect x={f3(fx0)} y={f3(fy0)} width={f3(fx1 - fx0)} height={f3(Math.max(1, 0.05 * M * s))} fill="#FFF4E2" opacity={0.5} />
            </>,
            0.8,
          );
        })()
      : null;

  // --- the near verge: grass rows from the near kerb back toward the camera ---------------------------------------
  const verge: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const z = TRACK.nearKerb[0] - (0.25 + i * 0.5) * M;
    if (c.D + z < 0.6 * M) break;
    const y = yG(z);
    if (y > 2050) break;
    verge.push(blurG(`v${i}`, z, tuftRow(z, 40 + i, 16, 10 * M, 1)));
  }
  const [vy0] = band(TRACK.nearKerb[0], TRACK.nearKerb[0] + 1);
  const mown = [0, 1, 2, 3, 4].map((i) => {
    const za = TRACK.nearKerb[0] - (0.9 + i * 2.0) * M;
    const zb = za - 1.0 * M;
    if (c.D + zb < 0.4 * M) return null;
    const [y0, y1] = band(zb, za);
    return <rect key={`mw${i}`} x={-300} y={f3(y0)} width={1680} height={f3(Math.max(0, Math.min(2000, y1) - y0))} fill={TRACK_COLOR.grassLit} opacity={0.12} />;
  });
  const nearShade = (
    <g key="ns">
      <rect x={-300} y={f3(vy0)} width={1680} height={f3(Math.max(0, 2000 - vy0))} fill={`url(#${uid}near)`} />
      {mown}
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: SKY.haze, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${uid}sky`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor - 1250)} x2="0" y2={f3(hor)}>
            <stop offset="0" stopColor={SKY.top} />
            <stop offset="0.24" stopColor={SKY.upper} />
            <stop offset="0.46" stopColor={SKY.amber} />
            <stop offset="0.66" stopColor={SKY.mid} />
            <stop offset="0.83" stopColor={SKY.low} />
            <stop offset="0.93" stopColor={SKY.glow} />
            <stop offset="1" stopColor={SKY.haze} />
          </linearGradient>
          <radialGradient id={`${uid}sun`} gradientUnits="userSpaceOnUse" cx={f3(220 + sx)} cy={f3(hor - 330)} r={760}>
            <stop offset="0" stopColor={SKY.sun} stopOpacity="0.7" />
            <stop offset="0.35" stopColor={SKY.sun} stopOpacity="0.24" />
            <stop offset="1" stopColor={SKY.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}far`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor)} x2="0" y2={f3(yG(TRACK.farKerb[1]))}>
            <stop offset="0" stopColor={mixHex(TRACK_COLOR.grassFar, SKY.haze, 0.5)} />
            <stop offset="0.35" stopColor={hz(TRACK_COLOR.grassFar, TRACK.fence)} />
            <stop offset="1" stopColor={hz(TRACK_COLOR.grass, TRACK.farKerb[1])} />
          </linearGradient>
          <linearGradient id={`${uid}asp`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(ayFar)} x2="0" y2={f3(ayNear)}>
            <stop offset="0" stopColor={hz(TRACK_COLOR.asphaltFar, aFar)} />
            <stop offset="1" stopColor={TRACK_COLOR.asphaltNear} />
          </linearGradient>
          <linearGradient id={`${uid}near`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(vy0)} x2="0" y2="1920">
            <stop offset="0" stopColor={TRACK_COLOR.grass} />
            <stop offset="0.5" stopColor={mixHex(TRACK_COLOR.grass, TRACK_COLOR.grassDark, 0.4)} />
            <stop offset="1" stopColor={mixHex(TRACK_COLOR.grassDark, COLOR.shadow, 0.25)} />
          </linearGradient>
          {defs}
        </defs>
        {sky}
        {ground}
        {treesBack}
        {stand}
        {treesFront}
        {fence}
        {tyreWall}
        {marshal}
        {gantryBack}
        {farGrassRows}
        {kerb(TRACK.farKerb[0], TRACK.farKerb[1], "kf")}
        {asphalt}
        {finishStrip}
        {kerb(TRACK.nearKerb[0], TRACK.nearKerb[1], "kn", TRACK.nearKerbBlock)}
        {nearShade}
        {verge}
        {children}
      </svg>
      {overlay}
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <TrackGrain S={S} />
    </AbsoluteFill>
  );
};

/** the kit's grain on twos (as StoutStage) */
const TrackGrain: React.FC<{ S: number }> = ({ S }) => {
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2 + 7) * 2 - 1) * GRAIN.travel;
  return (
    <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
      <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
    </AbsoluteFill>
  );
};

/** a little life for a kart at speed: a fast bob (world px) and lean (deg) from the road, seeded per kart */
export const kartJitter = (f: number, seed = 0, amount = 1) => ({
  bob: amount * (1.3 * Math.sin(f * 2.3 + seed) + 0.8 * Math.sin(f * 3.7 + seed * 2.1) + 0.5 * Math.sin(f * 5.9 + seed * 0.7)),
  lean: amount * (0.35 * Math.sin(f * 1.7 + seed * 1.3) + 0.2 * Math.sin(f * 4.1 + seed)),
});
export { clamp01, lerp, smoothstep };
