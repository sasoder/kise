// ---------------------------------------------------------------------------
// AllOfChinaV2 — Sarah Paine, "How the Depression pushed Japan to Pearl Harbor"
// (Dwarkesh map style, cut C, cold-review V2 of AllOfChina). "And then they
// decide they're going to extend the program to all of China. And that doesn't
// go very well."
//
// CHECK LINE: Japan set out to take all of China, but its conquest stalled far
// short, in the north and along the coast.
//
// WORDS (local frames, automated alignment, +-2): And 2, then 5, they 8, decide 13,
// they're 20, extend 29, the 41, program 44, to 54, all 59, of 64, China 66,
// And 81, that 84, doesn't 88, go 95, very 99, well 104.
//
// THE MOTION (one job: plan versus reality). The camera opens on Manchukuo (whole),
// Korea and Japan (orange = Japan) and is pulling back by f2, out and west to ALL of
// China (~f50), keeping Korea and Kyushu on the right edge, then a steady push on
// the full claim to the end. THE PLAN grows OUT of Manchukuo's orange from "extend":
// a LIGHT, open claim (faint wash, sparse thin dashes, a crisp dashed frontier, a
// heavy dashed edge on China's land borders as it reaches them) spreads by land
// across China, reaching the far west on "China" (66). THE REAL conquest follows as
// one dense, solid-edged orange front out of Manchukuo and the Shanghai coast,
// surges, and stops DEAD on the 1938 front at f86 ("that" .. "doesn't"): hard stop,
// a small recoil (f86-97). Then the claim drains back from the far west onto that
// front as one crisp travelling dashed edge (f89-104, "doesn't" .. "well"), and the
// claim's border is left as a dashed cream outline of China ("a fallen state drains
// to a dashed cream outline"). Living hold: small orange north and coast against a
// huge un-taken China, the push and a faint highlight travelling the stopped front.
//
// CAUSE -> EFFECT: the front reaches the 1938 line (contact) f86; the claim's edge
// starts back from the far west f89 and lands on the stalled front f104.
//
// FRAMING: China proper's far west (x -65) to Kyushu (x 869) in shot from ~f52; the
// lowest orange (Taiwan at first, then Canton and Hainan) is held above screen
// y 1072 on every frame (camera y solved from k), so the caption bands stay clear.
//
// DURATION: delivered native media 50_AllOfChina.mov = 124 frames at 24 fps (slot
// seq 1206-1319 uses f0-113; f114-123 are the hold handle) -> 124.
//
// SOURCES: period geography as AllOfChina (pearlAsiaMapData: Manchukuo 1933 incl.
// Jehol; the 1938-39 front; Canton occupied Oct 1938; Hainan Feb 1939). The plan
// field is baked by the scratch tool bake-plan-field.ts into allOfChinaDataV2.ts.
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
  INK,
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
import { PLAN_FIELD } from "./allOfChinaDataV2";

export const FPS = 24;
export const DURATION = 124; // = the delivered 50_AllOfChina.mov (114 used + 10 handle)

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
  plan: [28, 66] as const, // the claim leaves Manchukuo on "extend" (29), reaches the far west on "China"
  china: 54, // label slide-up starts (visible ~58-60); landed by "China" (66)
  front: [37, 86] as const, // the real conquest: contact with the 1938 line at f86 ("that" .. "doesn't")
  drain: [89, 104] as const, // the claim drains back from the far west onto the stalled front ("doesn't" .. "well")
  shimmer: [100, 136] as const, // the living hold: a faint highlight travels the stopped front
};

// THE PLAN: a wash plus an open DASHED hatch at -45 deg (the held hatch is dense,
// solid, +45 deg over a stronger wash). Sized in world px for the wide framing.
// r2: the plan is kept LIGHT and OPEN (thin, widely spaced dashes over a faint wash)
// so it reads as planned, never as the dense solid-edged held hatch.
const GK = 1.09;
const GHOST_SPACING = 46 / GK;
const GHOST_DASH = 8 / GK;
const GHOST_GAP = 11 / GK;
const GHOST_W = 1.8; // screen px
const GHOST_OP = 0.55;
const PLAN_WASH = 0.05;
const EDGE_W = 6.2; // screen px: the plan's dashed land-border edge (its strongest part)
const EDGE_DASH: [number, number] = [15, 8]; // world px at the wide (no crawl in the zoom)
const FRONTIER_W = 5; // screen px: the plan's travelling dashed front
const FRONTIER_DASH: [number, number] = [12, 7];
const FRONT_W = 5; // screen px: the conquest's solid front

// The plan: leaves gently, then runs at full speed into the far west, arriving on
// "China" (the field's last 15 % is the thin far-western tail, so no end ease).
export const planU = (f: number) => Math.pow(clamp01((f - T.plan[0]) / (T.plan[1] - T.plan[0])), 1.2);
// The conquest: leaves from rest, surges, and is still moving when it hits the 1938
// line at f86; it stops dead, rebounds a little and settles (f86-97).
const FRONT_IN = pchip([
  [T.front[0] - 10, 0],
  [T.front[0], 0],
  [46, 0.1],
  [58, 0.38],
  [70, 0.65],
  [80, 0.86],
  [T.front[1], 1],
]);
const FRONT_HIT = pchip([
  [T.front[1], 1],
  [87.6, 1.05],
  [91, 0.95],
  [94.5, 1.01],
  [98, 1],
  [140, 1],
]);
export const frontU = (f: number) => (f <= T.front[0] ? 0 : f <= T.front[1] ? clamp01(FRONT_IN(f)) : FRONT_HIT(f));

// ---------------------------------------------------------------------------
// CAMERA. The lowest orange on screen stays above y 1072 (Taiwan's south tip,
// world y 1122, while close; Hainan's, 1208.6, from the wide), so cy is solved
// from k. Wide: China proper's far west (x -65) to Kyushu (x 869) = 934 world px.
// ---------------------------------------------------------------------------
// r2: opens at k 1.54 so Manchukuo's north tip (world y 457) is in frame with Taiwan
// still above the band; the pull-back is under way by f2; then a steady push on the
// full claim through "And that" and on to the end (Korea + Kyushu and the far west kept).
const camAt = (f: number, x: number, k: number, lowY: number, low = 1066): CamKey => ({ f, x, y: lowY - (low - 960) / k, k });
export const CAM: CamKey[] = [
  camAt(-44, 774, 1.556, 1122, 1062),
  camAt(-22, 772, 1.552, 1122, 1062),
  camAt(42, 412, 1.06, 1208.6),
  camAt(88, 412, 1.09, 1208.6),
  camAt(124, 412, 1.114, 1208.6),
  camAt(160, 412, 1.12, 1208.6),
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
/** the plan's spread: land distance from Manchukuo's China-facing boundary (1 = far west) */
const PLAN = decode(PLAN_FIELD.b64, PLAN_FIELD.scale, PLAN_FIELD);
/** distance from the occupied region (0 on the stalled front, 1 far west): the drain's level sets */
const FROM_FRONT = decode(GHOST.drain, GHOST.scale, GHOST);
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

// THE DRAIN: the claim pulls back from the far west onto the stalled front as one
// crisp travelling edge (level sets of the distance from the occupied region):
// constant speed off the far west, settling exactly on the held strip by "well".
const drainL = (f: number) => {
  const x = clamp01((f - T.drain[0]) / (T.drain[1] - T.drain[0]));
  return 1.02 * (1 - (0.6 * x + 0.4 * smoother(x)));
};

// ---------------------------------------------------------------------------
const AllOfChinaV2: React.FC<Props> = ({ chinaLabel, vignette, dimOutside }) => {
  const frame = useCurrentFrame();
  const cam: Cam = runCamera(CAM, frame);

  // the plan
  const gu = planU(frame);
  const planBand = gu <= 0 ? "" : gu < 1 ? isoband(PLAN, gu) : null; // null = everywhere
  const frontierOp = smoothstep(gu / 0.04) * (1 - smoothstep((gu - 0.95) / 0.05));
  const frontierD = frontierOp > 0.01 ? chainsD(isoline(PLAN, Math.min(0.998, gu))) : "";
  const edgeReveal = gu < 1 ? (gu > 0 ? isoband(PLAN, gu + 0.012) : "") : null; // null = fully revealed

  // the conquest
  const fu = frontU(frame);
  const band = fu > 0 ? isoband(GRID, fu) : "";
  const frontD = fu > 0 ? linesD(isoline(GRID, Math.min(fu, 0.99995))) : "";
  const frontOp = smoothstep(fu / 0.03);
  const hitting = frame > T.front[1] && frame < 99; // the overshoot may run past OCCUPIED_1938

  // the failure: the claim drains back from the far west onto the stalled front
  const dl = drainL(frame);
  const draining = frame >= T.drain[0];
  const planAlive = !draining || dl > 0.003;
  const drainBand = draining && planAlive ? isoband(FROM_FRONT, dl) : "";
  const drainEdgeOp = draining ? smoothstep(dl / 0.05) : 0;
  const drainEdgeD = drainEdgeOp > 0.01 ? chainsD(isoline(FROM_FRONT, dl)) : "";

  // the living hold
  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shS = FRONT_S0 + (FRONT_LEN - FRONT_S0) * shT;
  const shOp = Math.sin(Math.PI * shT) * 0.8;

  const dash = `${EDGE_DASH[0] / GK} ${EDGE_DASH[1] / GK}`;
  const R = { x: -2000, y: -2000, width: 6000, height: 6000 };

  const defs = (
    <>
      <pattern id="aoc2-plan" patternUnits="userSpaceOnUse" width={2 * GHOST_SPACING} height={GHOST_DASH + GHOST_GAP} patternTransform="rotate(-45)">
        {[
          [0.5 * GHOST_SPACING, 0],
          [1.5 * GHOST_SPACING, (GHOST_DASH + GHOST_GAP) / 2],
          [1.5 * GHOST_SPACING, (GHOST_DASH + GHOST_GAP) / 2 - (GHOST_DASH + GHOST_GAP)],
        ].map(([x, y0], i) => (
          <line key={`gh-${i}`} x1={x} y1={y0} x2={x} y2={y0 + GHOST_DASH} stroke={ACCENT} strokeWidth={px(cam, GHOST_W)} strokeLinecap="butt" />
        ))}
      </pattern>
      <HatchPattern id="aoc2-occ" cam={cam} spacing={10} width={2.3} />
      <clipPath id="aoc2-proper">
        <path d={FREE_CHINA.d} clipRule="evenodd" />
        <path d={OCCUPIED_1938.d} clipRule="evenodd" />
      </clipPath>
      <clipPath id="aoc2-free">
        <path d={FREE_CHINA.d} clipRule="evenodd" />
      </clipPath>
      <clipPath id="aoc2-occ-clip">
        <path d={OCCUPIED_1938.d} clipRule="evenodd" />
      </clipPath>
      {band ? (
        <clipPath id="aoc2-band">
          <path d={band} />
        </clipPath>
      ) : null}
      {/* the plan: everywhere it has reached, minus the solid conquest */}
      <mask id="aoc2-plan-mask" maskUnits="userSpaceOnUse" {...R}>
        {planBand === null ? <rect {...R} fill="#fff" /> : planBand ? <path d={planBand} fill="#fff" /> : null}
        {band ? (
          <g clipPath={hitting ? "url(#aoc2-proper)" : "url(#aoc2-occ-clip)"}>
            <path d={band} fill="#000" />
          </g>
        ) : null}
      </mask>
      <mask id="aoc2-frontier-mask" maskUnits="userSpaceOnUse" {...R}>
        <rect {...R} fill="#fff" />
        {band ? (
          <g clipPath="url(#aoc2-occ-clip)">
            <path d={band} fill="#000" />
          </g>
        ) : null}
      </mask>
      {edgeReveal ? (
        <clipPath id="aoc2-edge-reveal">
          <path d={edgeReveal} />
        </clipPath>
      ) : null}
      {draining ? (
        <mask id="aoc2-alive" maskUnits="userSpaceOnUse" {...R}>
          {drainBand ? <path d={drainBand} fill="#fff" /> : null}
        </mask>
      ) : null}
      {draining ? (
        <mask id="aoc2-dead" maskUnits="userSpaceOnUse" {...R}>
          <rect {...R} fill="#fff" />
          {drainBand ? <path d={drainBand} fill="#000" /> : null}
        </mask>
      ) : null}
    </>
  );

  const edgePaths = (color: string, casing: number, width: number) => (
    <>
      <path d={BORDER_D} stroke={SHADOW} strokeOpacity={casing} strokeWidth={px(cam, width + 3)} strokeDasharray={dash} />
      <path d={BORDER_D} stroke={color} strokeWidth={px(cam, width)} strokeDasharray={dash} />
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
          <mask id="aoc2-dim" maskUnits="userSpaceOnUse" {...R}>
            <rect {...R} fill="#fff" />
            <path d={CHINA_ALL.d} fill="#000" fillRule="evenodd" />
            <path d={JAPAN_1931.d} fill="#000" fillRule="evenodd" />
          </mask>
        }
      >
        <rect {...R} fill="#0C0907" opacity={dimOutside} mask="url(#aoc2-dim)" />
      </WorldSvg>
      <WorldSvg cam={cam} defs={defs}>
        {/* Japan's empire and Manchukuo: orange from the first frame */}
        <Hatch region={JAPAN_1931} cam={cam} id="aoc2-j31" />
        <Hatch region={MANCHUKUO} cam={cam} id="aoc2-mk" />

        {/* THE PLAN: a dashed-orange claim growing out of Manchukuo */}
        {planBand !== "" && planAlive ? (
          <g clipPath="url(#aoc2-proper)">
            <g mask="url(#aoc2-plan-mask)">
              <g mask={draining ? "url(#aoc2-alive)" : undefined}>
                <rect {...R} fill={ACCENT} opacity={PLAN_WASH} />
                <rect {...R} fill="url(#aoc2-plan)" opacity={GHOST_OP} />
              </g>
            </g>
          </g>
        ) : null}

        {frontierD ? (
          <g clipPath="url(#aoc2-proper)">
            <g mask="url(#aoc2-frontier-mask)" opacity={frontierOp} fill="none" strokeLinejoin="round">
              <path d={frontierD} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={px(cam, FRONTIER_W + 3)} strokeDasharray={`${px(cam, FRONTIER_DASH[0])} ${px(cam, FRONTIER_DASH[1])}`} />
              <path d={frontierD} stroke={ACCENT} strokeWidth={px(cam, FRONTIER_W)} strokeDasharray={`${px(cam, FRONTIER_DASH[0])} ${px(cam, FRONTIER_DASH[1])}`} />
            </g>
          </g>
        ) : null}

        {/* the drain's travelling edge: the claim pulling back onto the stalled front */}
        {drainEdgeD ? (
          <g clipPath="url(#aoc2-free)">
            <g mask="url(#aoc2-frontier-mask)" opacity={drainEdgeOp} fill="none" strokeLinejoin="round">
              <path d={drainEdgeD} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={px(cam, FRONTIER_W + 3)} strokeDasharray={`${px(cam, FRONTIER_DASH[0])} ${px(cam, FRONTIER_DASH[1])}`} />
              <path d={drainEdgeD} stroke={ACCENT} strokeWidth={px(cam, FRONTIER_W)} strokeDasharray={`${px(cam, FRONTIER_DASH[0])} ${px(cam, FRONTIER_DASH[1])}`} />
            </g>
          </g>
        ) : null}

        {/* THE REAL conquest: solid hatch out to the travelling front */}
        {band ? (
          <g clipPath={hitting ? "url(#aoc2-proper)" : "url(#aoc2-occ-clip)"}>
            <path d={band} fill={ACCENT_DEEP} fillOpacity={0.3} />
            <path d={band} fill="url(#aoc2-occ)" opacity={0.85} />
          </g>
        ) : null}
        {band && CANTON.edge ? (
          <g clipPath="url(#aoc2-band)">
            <path d={CANTON.edge} fill="none" stroke={ACCENT} strokeWidth={px(cam, FRONT_W * 0.8)} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
        {frontD ? (
          <g clipPath="url(#aoc2-proper)" opacity={frontOp} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={frontD} stroke={SHADOW} strokeOpacity={0.75} strokeWidth={px(cam, FRONT_W + 3)} />
            <path d={frontD} stroke={ACCENT} strokeWidth={px(cam, FRONT_W)} />
          </g>
        ) : null}
        {shOp > 0.01 ? (
          <g clipPath="url(#aoc2-proper)" fill="none" strokeLinecap="round">
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

        {/* the PLAN's dashed edge on China's land borders: revealed as the claim reaches them,
            then, as the claim drains back, left as a dashed cream outline of China */}
        {edgeReveal !== "" ? (
          <g clipPath={edgeReveal ? "url(#aoc2-edge-reveal)" : undefined} fill="none" strokeLinejoin="round">
            {draining ? (
              <>
                <g mask="url(#aoc2-dead)" opacity={0.92}>
                  {edgePaths(INK, 0.6, 5)}
                </g>
                {planAlive ? <g mask="url(#aoc2-alive)">{edgePaths(ACCENT, 0.6, EDGE_W)}</g> : null}
              </>
            ) : (
              edgePaths(ACCENT, 0.6, EDGE_W)
            )}
          </g>
        ) : null}

        <Label x={AOC_PLACES.chinaLabel[0]} y={AOC_PLACES.chinaLabel[1]} text={chinaLabel} appear={T.china} frame={frame} cam={cam} cap={46} spacing={0.3} />
      </WorldSvg>
      <Grain />
      <Vignette amount={vignette} />
    </AbsoluteFill>
  );
};

export default AllOfChinaV2;
