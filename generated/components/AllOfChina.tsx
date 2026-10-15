// ---------------------------------------------------------------------------
// AllOfChina — Sarah Paine, "How the Depression pushed Japan to Pearl Harbor"
// (Dwarkesh map style, cut C). "And then they decide they're going to extend the
// program to all of China. And that doesn't go very well."
//
// CHECK LINE: Japan set out to take all of China, but its conquest stalled far
// short, in the north and along the coast.
//
// THE MOTION (one job: plan versus reality). Frame 0 is B's end state a little
// wider: Japan's home islands, Korea and Manchukuo orange, so orange = Japan. One
// continuous camera move pulls back and west to ALL of China by ~f56 (from then on
// the whole outline stays in frame, >= 30 px margins, with a slow push).
// THE PLAN comes out of Japan's orange: from "decide", a faint dashed-orange ghost
// wash spreads out of the Manchukuo line and the coast across China as one
// travelling front, reaching the far west on "China" (f67); the plan's dashed edge
// appears on China's LAND borders as the wash reaches them (never on the coast).
// THE REAL conquest follows behind it as one solid orange front out of Manchukuo
// and the Shanghai coast (the level sets of a baked arrival field), surges, slows
// and stops dead on the 1938 front at f100. "Doesn't go very well": the plan
// fails — the ghost wash drains back out of the interior toward the stalled front
// and the dashed edge fades to 0.25, leaving the vast interior empty. Hold: a
// faint highlight travels the stopped front. The land and sea outside China and
// Japan's empire are dimmed a notch so China is the picture.
//
// DURATION: the slot is sequence 00:00:50:06-00:00:54:22 = frames 1206-1318 at
// 24 fps = 112 frames, + 12 frames of living tail = 124.
//
// Beats (local frames): camera move f0-56; ghost wash f13 ("decide") -> f67
// ("China"); CHINA slides up from f59, lands f67; solid front f36 -> f100;
// drain f85-110; highlight f100 on; cut point f112.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  type Cam,
  type CamKey,
  Grain,
  Hatch,
  HatchPattern,
  LAND,
  Label,
  MapBase,
  type P2,
  SEA,
  SHADOW,
  Vignette,
  WorldSvg,
  clamp01,
  cumOf,
  lengthOf,
  pchip,
  px,
  runCamera,
  smoother,
  smoothstep,
} from "./pearlShared";
import { CANTON, CHINA_ALL, FREE_CHINA, FRONT_1938_PTS, JAPAN_1931, MANCHUKUO, OCCUPIED_1938 } from "./pearlAsiaMapData";
import { AOC_PLACES, AOC_ZONES, BORDER_RUNS, FIELD, GHOST } from "./allOfChinaData";

export const FPS = 24;
export const DURATION = 124; // 112-frame slot + 12 frames of tail

export const schema = z.object({
  chinaLabel: z.string(),
  vignette: z.number(),
  /** darkening of everything outside China and Japan's empire (0..1) */
  dimOutside: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ chinaLabel: "CHINA", vignette: 0.55, dimOutside: 0.3 });

// ---------------------------------------------------------------------------
// TIMING (local frames at 24 fps)
// ---------------------------------------------------------------------------
export const T = {
  ghost: [13, 67] as const, // the plan spreads: "decide" .. "China"
  china: 59, // label appear (lands ~f67)
  front: [36, 100] as const, // the real conquest: "the program" .. "very well"
  drain: [85, 110] as const, // the plan fails: "and that doesn't go very well"
  shimmer: [100, 132] as const, // the living hold: a faint highlight travels the stopped front
  cut: 112,
};

const EDGE_W = 3.5; // screen px: the plan's dashed edge
const EDGE_DASH_K = 1.09; // the dashes are sized for the final framing and fixed in world px (no crawl in the zoom)
const FRONT_W = 4; // screen px: the solid front
// THE PLAN's ghost hatch: open, sparse DASHED orange lines at -45 deg (the held
// hatch is dense, solid, +45 deg, over a wash), no tint. Sized in world px for the
// all-of-China framing and fixed through the zoom, so the dashes never crawl.
const GK = 1.09;
const GHOST_SPACING = 22 / GK;
const GHOST_DASH = 12 / GK;
const GHOST_GAP = 8 / GK;
const GHOST_W = 3; // screen px
const GHOST_OP = 0.5;
// its leading edge: a dashed orange frontier line
const FRONTIER_W = EDGE_W; // screen px: the same pen as the land-border edge it hands over to
const FRONTIER_DASH: [number, number] = [10, 7]; // screen px

// The plan's wash: leaves from rest, near-constant speed, settles on the far border.
export const ghostU = (f: number) => {
  const x = clamp01((f - T.ghost[0]) / (T.ghost[1] - T.ghost[0]));
  return 0.55 * x + 0.45 * smoother(x);
};
// The drain: the wash pulls back to the stalled front.
export const drainV = (f: number) => smoother((f - T.drain[0]) / (T.drain[1] - T.drain[0]));
// The front: leaves from rest, surges across the plain, then visibly decelerates
// through "doesn't go very well" and stops dead on FRONT_1938 (monotone cubic,
// zero slope at both ends: no overshoot, no bounce).
const FRONT_CURVE = pchip([
  [T.front[0] - 10, 0],
  [T.front[0], 0],
  [44, 0.12],
  [56, 0.45], // the surge: "the program to all of China"
  [70, 0.73],
  [84, 0.9], // "and that doesn't go very well": slower and slower
  [93, 0.975],
  [T.front[1], 1],
  [T.front[1] + 20, 1],
]);
export const frontU = (f: number) => (f <= T.front[0] ? 0 : f >= T.front[1] ? 1 : clamp01(FRONT_CURVE(f)));

// ---------------------------------------------------------------------------
// CAMERA. f0: Japan's home islands, Korea and Manchukuo (B ends on (797, 806)
// k 2.42; this is a little wider so Hokkaido is whole). One continuous move
// pulls back and west to ALL of China (CHINA_ALL is 926.7 world px wide, so
// k <= 1.1007 keeps >= 30 px on both sides; its centre of mass at screen y 848),
// landing ~f56-60, then a slow push. The view's top may reach ~30 world px above
// the kit's rasters (they end at y 64, deep in Siberia): a land underlay fills it.
// ---------------------------------------------------------------------------
const CHINA_CX = (CHINA_ALL.box[0] + CHINA_ALL.box[2]) / 2;
const CHINA_CM_Y = 815.1; // China's area centroid, world y
const chinaAt = (f: number, k: number): CamKey => ({ f, x: CHINA_CX, y: CHINA_CM_Y + (960 - 848) / k, k });
export const CAM: CamKey[] = [
  { f: -30, x: 818, y: 797, k: 2.13 },
  { f: 0, x: 812, y: 800, k: 2.1 },
  chinaAt(54, 1.085),
  chinaAt(124, 1.0995),
  chinaAt(160, 1.1),
];

// ---------------------------------------------------------------------------
// FIELDS and their contours (marching squares, per frame)
// ---------------------------------------------------------------------------
type Grid = { nx: number; ny: number; x0: number; y0: number; h: number; v: Float32Array };
const decode = (b64: string, scale: number, g: { nx: number; ny: number; x0: number; y0: number; h: number }): Grid => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const u16 = new Uint16Array(bytes.buffer);
  const v = new Float32Array(u16.length);
  for (let i = 0; i < u16.length; i++) v[i] = u16[i] * scale;
  return { nx: g.nx, ny: g.ny, x0: g.x0, y0: g.y0, h: g.h, v };
};
/** the 1937-38 conquest's arrival time (0 at Manchukuo / Shanghai, 1 on FRONT_1938) */
const GRID = decode(FIELD.b64, FIELD.scale, FIELD);
/** the plan's spread (0 at the Manchukuo line and the coast, 1 at the farthest point of China) */
const GHOST_PLAN = decode(GHOST.plan, GHOST.scale, GHOST);
/** the plan's drain (0 on the occupied region, 1 at the farthest point from it) */
const GHOST_DRAIN = decode(GHOST.drain, GHOST.scale, GHOST);
const f2 = (n: number) => n.toFixed(2);

/** one path (all subpaths clockwise, nonzero) covering { t <= u } */
const isoband = (g: Grid, u: number) => {
  const { nx, ny, x0, y0, h, v } = g;
  const parts: string[] = [];
  const cx = [0, 0, 0, 0];
  const cy = [0, 0, 0, 0];
  const cv = [0, 0, 0, 0];
  for (let j = 0; j < ny - 1; j++) {
    let run = -1;
    const flush = (i1: number) => {
      const xa = x0 + run * h;
      const xb = x0 + i1 * h;
      const ya = y0 + j * h;
      parts.push(`M${f2(xa)},${f2(ya)}H${f2(xb)}V${f2(ya + h)}H${f2(xa)}Z`);
      run = -1;
    };
    for (let i = 0; i < nx - 1; i++) {
      const n = j * nx + i;
      const a = v[n] - u;
      const b = v[n + 1] - u;
      const c = v[n + nx + 1] - u;
      const e = v[n + nx] - u;
      if (a <= 0 && b <= 0 && c <= 0 && e <= 0) {
        if (run < 0) run = i;
        continue;
      }
      if (run >= 0) flush(i);
      if (a > 0 && b > 0 && c > 0 && e > 0) continue;
      const xl = x0 + i * h;
      const yt = y0 + j * h;
      cx[0] = xl;
      cy[0] = yt;
      cv[0] = a;
      cx[1] = xl + h;
      cy[1] = yt;
      cv[1] = b;
      cx[2] = xl + h;
      cy[2] = yt + h;
      cv[2] = c;
      cx[3] = xl;
      cy[3] = yt + h;
      cv[3] = e;
      let d = "";
      for (let k = 0; k < 4; k++) {
        const k2 = (k + 1) & 3;
        const pin = cv[k] <= 0;
        if (pin) d += `${d ? "L" : "M"}${f2(cx[k])},${f2(cy[k])}`;
        if (pin !== cv[k2] <= 0) {
          const t = cv[k] / (cv[k] - cv[k2]);
          d += `${d ? "L" : "M"}${f2(cx[k] + (cx[k2] - cx[k]) * t)},${f2(cy[k] + (cy[k2] - cy[k]) * t)}`;
        }
      }
      parts.push(`${d}Z`);
    }
    if (run >= 0) flush(nx - 1);
  }
  return parts.join("");
};

/** the contour { t == u } as chained polylines */
const isoline = (g: Grid, u: number): P2[][] => {
  const { nx, ny, x0, y0, h, v } = g;
  const pt = new Map<number, P2>();
  // edge keys: horizontal (i,j)-(i+1,j) = 2n; vertical (i,j)-(i,j+1) = 2n + 1
  const cross = (key: number): P2 => {
    const hit = pt.get(key);
    if (hit) return hit;
    const n = key >> 1;
    const i = n % nx;
    const j = (n - i) / nx;
    const va = v[n] - u;
    const vb = (key & 1 ? v[n + nx] : v[n + 1]) - u;
    const t = va / (va - vb);
    const p: P2 = key & 1 ? [x0 + i * h, y0 + (j + t) * h] : [x0 + (i + t) * h, y0 + j * h];
    pt.set(key, p);
    return p;
  };
  const adj = new Map<number, number[]>();
  const link = (p: number, q: number) => {
    const ap = adj.get(p);
    if (ap) ap.push(q);
    else adj.set(p, [q]);
    const aq = adj.get(q);
    if (aq) aq.push(p);
    else adj.set(q, [p]);
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const n = j * nx + i;
      const a = v[n] <= u;
      const b = v[n + 1] <= u;
      const c = v[n + nx + 1] <= u;
      const e = v[n + nx] <= u;
      if (a === b && b === c && c === e) continue;
      const kT = 2 * n;
      const kB = 2 * (n + nx);
      const kL = 2 * n + 1;
      const kR = 2 * (n + 1) + 1;
      const es: number[] = [];
      if (a !== b) es.push(kT);
      if (b !== c) es.push(kR);
      if (c !== e) es.push(kB);
      if (e !== a) es.push(kL);
      if (es.length === 2) link(es[0], es[1]);
      else if (es.length === 4) {
        const mid = (v[n] + v[n + 1] + v[n + nx + 1] + v[n + nx]) / 4 <= u;
        if (mid === a) {
          link(kT, kR);
          link(kB, kL);
        } else {
          link(kT, kL);
          link(kR, kB);
        }
      }
    }
  }
  const used = new Set<number>();
  const lines: P2[][] = [];
  const walk = (start: number) => {
    const out: P2[] = [cross(start)];
    used.add(start);
    let prev = -1;
    let cur = start;
    for (;;) {
      const nb = (adj.get(cur) ?? []).filter((q) => q !== prev && !used.has(q));
      if (!nb.length) {
        if ((adj.get(cur) ?? []).includes(start) && out.length > 2) out.push(cross(start));
        break;
      }
      prev = cur;
      cur = nb[0];
      used.add(cur);
      out.push(cross(cur));
    }
    return out;
  };
  for (const [k, nb] of adj) if (nb.length === 1 && !used.has(k)) lines.push(walk(k));
  for (const k of adj.keys()) if (!used.has(k)) lines.push(walk(k));
  return lines;
};
/** the main front only: the Canton / Hainan pockets fill from their landings without a drawn front */
const linesD = (lines: P2[][]) =>
  lines
    .filter((l) => l.length > 1 && l.every(([, y]) => y < AOC_ZONES.canton))
    .map((l) => `M${l.map(([x, y]) => `${f2(x)},${f2(y)}`).join("L")}`)
    .join("");


/** dashed contour chains, each started at its north end so the dash phase is stable frame to frame */
const chainsD = (lines: P2[][]) =>
  lines
    .filter((l) => l.length > 2)
    .map((l) => {
      const closed = Math.hypot(l[0][0] - l[l.length - 1][0], l[0][1] - l[l.length - 1][1]) < 1e-6;
      let pts = l;
      if (closed) {
        let iy = 0;
        l.forEach(([, y], i) => {
          if (y < l[iy][1]) iy = i;
        });
        pts = [...l.slice(iy, l.length - 1), ...l.slice(0, iy + 1)];
      } else if (l[l.length - 1][1] < l[0][1]) pts = [...l].reverse();
      return `M${pts.map(([x, y]) => `${f2(x)},${f2(y)}`).join("L")}`;
    })
    .join("");

// the plan's dashed edge: China's LAND borders (Vietnam round to Mongolia), one path
const BORDER_D = (BORDER_RUNS as P2[][]).map((r) => `M${r.map(([x, y]) => `${f2(x)},${f2(y)}`).join("L")}`).join("");

// the stopped front (the kit's line), for the hold's highlight
const FRONT = FRONT_1938_PTS as P2[];
const FRONT_LEN = lengthOf(FRONT);
const FRONT_D = `M${FRONT.map(([x, y]) => `${f2(x)},${f2(y)}`).join("L")}`;
const FRONT_S0 = (() => {
  const c = cumOf(FRONT);
  const border = AOC_PLACES.frontEntersChina as unknown as P2;
  let bi = 0;
  FRONT.forEach(([x, y], i) => {
    if (Math.hypot(x - border[0], y - border[1]) < Math.hypot(FRONT[bi][0] - border[0], FRONT[bi][1] - border[1])) bi = i;
  });
  return c[bi];
})();

// ---------------------------------------------------------------------------
const AllOfChina: React.FC<Props> = ({ chinaLabel, vignette, dimOutside }) => {
  const frame = useCurrentFrame();
  const cam: Cam = runCamera(CAM, frame);

  // the plan: spread, then drain
  const gu = ghostU(frame);
  const dv = drainV(frame);
  const draining = frame >= T.drain[0];
  const ghostBand = draining ? (dv < 1 ? isoband(GHOST_DRAIN, 1 - dv) : "") : gu > 0 ? isoband(GHOST_PLAN, gu) : "";
  // the frontier: the wash's leading (then retreating) edge, a dashed orange line;
  // it leaves the orange as the wash does, hands over to the land border it reaches,
  // and in the drain it pulls back onto the stalled front and is gone
  const fLevel = draining ? 1 - dv : gu;
  const frontierOp = draining
    ? smoothstep((1 - dv) / 0.06) * smoothstep(dv / 0.04)
    : smoothstep(gu / 0.05) * (1 - smoothstep((gu - 0.95) / 0.05));
  const frontierD = frontierOp > 0.01 ? chainsD(isoline(draining ? GHOST_DRAIN : GHOST_PLAN, Math.min(0.998, fLevel))) : "";
  const edgeReveal = !draining && gu < 1 ? (gu > 0 ? isoband(GHOST_PLAN, gu + 0.015) : "") : null; // null = fully revealed
  const edgeOp = 1 - 0.75 * smoother((frame - T.drain[0]) / (T.drain[1] - 2 - T.drain[0]));

  // the conquest
  const fu = frontU(frame);
  const band = fu > 0 ? isoband(GRID, fu) : "";
  const frontD = fu > 0 ? linesD(isoline(GRID, Math.min(fu, 0.99995))) : "";
  const frontOp = smoothstep(fu / 0.03);

  // the living hold: one faint highlight travelling the stopped front, north to
  // south, at constant speed (it rides FRONT_1938 itself; outside China it is clipped)
  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shS = FRONT_S0 + (FRONT_LEN - FRONT_S0) * shT;
  const shOp = Math.sin(Math.PI * shT) * 0.85;

  const dash = `${10 / EDGE_DASH_K} ${7 / EDGE_DASH_K}`;
  const R = { x: -2000, y: -2000, width: 6000, height: 6000 };

  const defs = (
    <>
      <pattern id="aoc-ghost" patternUnits="userSpaceOnUse" width={2 * GHOST_SPACING} height={GHOST_DASH + GHOST_GAP} patternTransform="rotate(-45)">
        {[
          [0.5 * GHOST_SPACING, 0],
          [1.5 * GHOST_SPACING, (GHOST_DASH + GHOST_GAP) / 2],
          [1.5 * GHOST_SPACING, (GHOST_DASH + GHOST_GAP) / 2 - (GHOST_DASH + GHOST_GAP)],
        ].map(([x, y0], i) => (
          <line key={`gh-${i}`} x1={x} y1={y0} x2={x} y2={y0 + GHOST_DASH} stroke={ACCENT} strokeWidth={px(cam, GHOST_W)} />
        ))}
      </pattern>
      <HatchPattern id="aoc-occ" cam={cam} spacing={10} width={2.1} />
      <clipPath id="aoc-proper">
        <path d={FREE_CHINA.d} clipRule="evenodd" />
        <path d={OCCUPIED_1938.d} clipRule="evenodd" />
      </clipPath>
      <clipPath id="aoc-occ-clip">
        <path d={OCCUPIED_1938.d} clipRule="evenodd" />
      </clipPath>
      {band ? (
        <clipPath id="aoc-band">
          <path d={band} />
        </clipPath>
      ) : null}
      {/* the frontier: everywhere but under the solid conquest */}
      <mask id="aoc-frontier-mask" maskUnits="userSpaceOnUse" {...R}>
        <rect {...R} fill="#fff" />
        {band ? (
          <g clipPath="url(#aoc-occ-clip)">
            <path d={band} fill="#000" />
          </g>
        ) : null}
      </mask>
      {ghostBand ? (
        <mask id="aoc-ghost-mask" maskUnits="userSpaceOnUse" {...R}>
          <path d={ghostBand} fill="#fff" />
          {band ? (
            <g clipPath="url(#aoc-occ-clip)">
              <path d={band} fill="#000" />
            </g>
          ) : null}
        </mask>
      ) : null}
      {edgeReveal ? (
        <clipPath id="aoc-edge-reveal">
          <path d={edgeReveal} />
        </clipPath>
      ) : null}
    </>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: SEA, overflow: "hidden" }}>
      <WorldSvg cam={cam}>
        <rect x={-2000} y={-2000} width={5000} height={2068} fill={LAND} />
      </WorldSvg>
      <MapBase world="asia" cam={cam} />
      {/* everything outside China and Japan's empire, a notch darker */}
      <WorldSvg
        cam={cam}
        defs={
          <mask id="aoc-dim" maskUnits="userSpaceOnUse" {...R}>
            <rect {...R} fill="#fff" />
            <path d={CHINA_ALL.d} fill="#000" fillRule="evenodd" />
            <path d={JAPAN_1931.d} fill="#000" fillRule="evenodd" />
          </mask>
        }
      >
        <rect {...R} fill="#0C0907" opacity={dimOutside} mask="url(#aoc-dim)" />
      </WorldSvg>
      <WorldSvg cam={cam} defs={defs}>
        {/* Japan's empire and Manchukuo: orange from the first frame (B's end state) */}
        <Hatch region={JAPAN_1931} cam={cam} id="aoc-j31" />
        <Hatch region={MANCHUKUO} cam={cam} id="aoc-mk" />

        {/* THE PLAN: a ghost wash out of Japan's orange, then draining away */}
        {ghostBand ? (
          <g clipPath="url(#aoc-proper)">
            <g mask="url(#aoc-ghost-mask)">
              <rect {...R} fill="url(#aoc-ghost)" opacity={GHOST_OP} />
            </g>
          </g>
        ) : null}

        {frontierD ? (
          <g clipPath="url(#aoc-proper)">
            <g mask="url(#aoc-frontier-mask)" opacity={frontierOp} fill="none" strokeLinejoin="round">
              <path d={frontierD} stroke={SHADOW} strokeOpacity={0.45} strokeWidth={px(cam, FRONTIER_W + 2)} strokeDasharray={`${px(cam, FRONTIER_DASH[0])} ${px(cam, FRONTIER_DASH[1])}`} />
              <path d={frontierD} stroke={ACCENT} strokeWidth={px(cam, FRONTIER_W)} strokeDasharray={`${px(cam, FRONTIER_DASH[0])} ${px(cam, FRONTIER_DASH[1])}`} />
            </g>
          </g>
        ) : null}

        {/* THE REAL conquest: solid hatch out to the travelling front */}
        {band ? (
          <g clipPath="url(#aoc-occ-clip)">
            <path d={band} fill={ACCENT_DEEP} fillOpacity={0.2} />
            <path d={band} fill="url(#aoc-occ)" opacity={0.7} />
          </g>
        ) : null}
        {band && CANTON.edge ? (
          <g clipPath="url(#aoc-band)">
            <path d={CANTON.edge} fill="none" stroke={ACCENT} strokeWidth={px(cam, FRONT_W * 0.8)} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
        {frontD ? (
          <g clipPath="url(#aoc-proper)" opacity={frontOp} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={frontD} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={px(cam, FRONT_W + 2.4)} />
            <path d={frontD} stroke={ACCENT} strokeWidth={px(cam, FRONT_W)} />
          </g>
        ) : null}
        {shOp > 0.01 ? (
          <g clipPath="url(#aoc-proper)" fill="none" strokeLinecap="round">
            {[
              [90, 0.3],
              [46, 0.55],
              [18, 0.9],
            ].map(([len, o]) => (
              <path
                key={`sh-${len}`}
                d={FRONT_D}
                stroke="#FFF1CC"
                strokeOpacity={o * shOp}
                strokeWidth={px(cam, FRONT_W)}
                strokeDasharray={`${px(cam, len)} ${FRONT_LEN * 2}`}
                strokeDashoffset={-(shS - px(cam, len) / 2)}
              />
            ))}
          </g>
        ) : null}

        {/* the PLAN's dashed edge on China's land borders, revealed as the wash reaches them */}
        {edgeReveal !== "" ? (
          <g clipPath={edgeReveal ? "url(#aoc-edge-reveal)" : undefined} opacity={edgeOp} fill="none" strokeLinejoin="round">
            <path d={BORDER_D} stroke={SHADOW} strokeOpacity={0.45} strokeWidth={px(cam, EDGE_W + 2)} strokeDasharray={dash} />
            <path d={BORDER_D} stroke={ACCENT} strokeWidth={px(cam, EDGE_W)} strokeDasharray={dash} />
          </g>
        ) : null}

        <Label x={AOC_PLACES.chinaLabel[0]} y={AOC_PLACES.chinaLabel[1]} text={chinaLabel} appear={T.china} frame={frame} cam={cam} cap={46} spacing={0.3} />
      </WorldSvg>
      <Grain />
      <Vignette amount={vignette} />
    </AbsoluteFill>
  );
};

export default AllOfChina;
