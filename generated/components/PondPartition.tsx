import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:01.060 -> 00:00:08.759 of the source cut. round(7.699 * 30) = 231.
export const DURATION = 231;

// One body of water, then a million of them. The argument is that nothing about
// the fish changes — the boundary does — so the fish is drawn once, at one size,
// and every beat after that is spent on where the edges fall.

// The field runs off every side of the canvas. A bounded rectangle of water
// reads as a chart frame, and an ocean with a visible edge is not an ocean.
const FIELD = {x: -252, y: -125.5, w: 1440, h: 2160};
const COLS = 10;
const ROWS = 16;
const CELL_W = FIELD.w / COLS;
const CELL_H = FIELD.h / ROWS;
const JITTER = 0.3;

const CENTER = {x: FIELD.x + FIELD.w / 2, y: FIELD.y + FIELD.h / 2};

const YOU = 8 * COLS + 5;
// Three of them ring the claim so the size comparison sits right against the
// boundary that excludes them. Three more sit far out as field texture.
const GIANTS: Record<number, number> = {
  [8 * COLS + 3]: 56,
  [9 * COLS + 7]: 52,
  [6 * COLS + 5]: 50,
  [3 * COLS + 1]: 46,
  [13 * COLS + 8]: 48,
  [12 * COLS + 2]: 44,
};
// Nine cells, claimed as one territory. With a fixed frame the pond has to be
// large enough to read where it sits, and a single cell never would be.
const CLAIM = new Set<number>([
  7 * COLS + 4, 7 * COLS + 5, 7 * COLS + 6,
  8 * COLS + 4, 8 * COLS + 5, 8 * COLS + 6,
  9 * COLS + 4, 9 * COLS + 5, 9 * COLS + 6,
]);

const YOU_SIZE = 30;
const CLAIM_FISH_MAX = 14;
const SWARM_COUNT = 460;

type Pt = [number, number];

const frac = (v: number) => v - Math.floor(v);
const hash = (i: number, k: number) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);
const signed = (i: number, k: number) => hash(i, k) * 2 - 1;

const dist = (x: number, y: number, px: number, py: number) => Math.hypot(x - px, y - py);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const clipHalfPlane = (poly: Pt[], nx: number, ny: number, d: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = nx * a[0] + ny * a[1] - d;
    const db = nx * b[0] + ny * b[1] - d;
    if (da <= 0) out.push(a);
    if (da <= 0 !== db <= 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
};

type Seed = {
  i: number;
  x: number;
  y: number;
  size: number;
  giant: boolean;
  you: boolean;
  claimed: boolean;
};

const seeds: Seed[] = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const i = row * COLS + col;
    const giantSize = GIANTS[i];
    const you = i === YOU;
    const claimed = CLAIM.has(i);
    let size = 14 + hash(i, 3) * 10;
    if (giantSize) size = giantSize;
    if (you) size = YOU_SIZE;
    // Nobody in the claim is allowed to rival him, or "the biggest fish in that
    // pond" stops being true at the exact moment it is asserted.
    else if (claimed) size = Math.min(size, CLAIM_FISH_MAX);
    seeds.push({
      i,
      x: FIELD.x + (col + 0.5 + signed(i, 1) * JITTER) * CELL_W,
      y: FIELD.y + (row + 0.5 + signed(i, 2) * JITTER) * CELL_H,
      size,
      giant: Boolean(giantSize),
      you,
      claimed,
    });
  }
}

const cells: Pt[][] = seeds.map((s, i) => {
  let poly: Pt[] = [
    [FIELD.x, FIELD.y],
    [FIELD.x + FIELD.w, FIELD.y],
    [FIELD.x + FIELD.w, FIELD.y + FIELD.h],
    [FIELD.x, FIELD.y + FIELD.h],
  ];
  for (let j = 0; j < seeds.length && poly.length > 2; j++) {
    if (j === i) continue;
    const o = seeds[j];
    poly = clipHalfPlane(
      poly,
      o.x - s.x,
      o.y - s.y,
      (o.x * o.x + o.y * o.y - s.x * s.x - s.y * s.y) / 2,
    );
  }
  return poly;
});

const centroidOf = (poly: Pt[]): Pt => {
  let sx = 0;
  let sy = 0;
  for (const p of poly) {
    sx += p[0];
    sy += p[1];
  }
  return [sx / poly.length, sy / poly.length];
};

const cellCentroids = cells.map(centroidOf);

const cellBounds = cells.map((poly) => {
  const xs = poly.map((q) => q[0]);
  const ys = poly.map((q) => q[1]);
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
});

const pk = (p: Pt) => `${Math.round(p[0] * 2)}:${Math.round(p[1] * 2)}`;

type Edge = {a: Pt; b: Pt; owners: number[]};
const edgeMap = new Map<string, Edge>();
cells.forEach((poly, ci) => {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ka = pk(a);
    const kb = pk(b);
    if (ka === kb) continue;
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    const found = edgeMap.get(key);
    if (found) found.owners.push(ci);
    else edgeMap.set(key, {a, b, owners: [ci]});
  }
});

const claimedCount = (e: Edge) => e.owners.filter((o) => CLAIM.has(o)).length;
const allEdges = [...edgeMap.values()];
const outlineSegs = allEdges.filter((e) => claimedCount(e) === 1);
const innerSegs = allEdges.filter((e) => claimedCount(e) === 2);
const outsideEdges = allEdges.filter((e) => claimedCount(e) === 0);

// The nine cells are only ever seen as one shape, so the shared edges are
// dropped and what is left is walked into a single closed loop.
const chainLoop = (segs: Edge[]): Pt[] => {
  if (!segs.length) return [];
  const used = segs.map(() => false);
  used[0] = true;
  const pts: Pt[] = [segs[0].a, segs[0].b];
  let cur = segs[0].b;
  for (let guard = 0; guard < segs.length + 2; guard++) {
    let hit = -1;
    let next: Pt | null = null;
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      if (pk(segs[i].a) === pk(cur)) {
        hit = i;
        next = segs[i].b;
        break;
      }
      if (pk(segs[i].b) === pk(cur)) {
        hit = i;
        next = segs[i].a;
        break;
      }
    }
    if (hit < 0 || !next) break;
    used[hit] = true;
    if (pk(next) === pk(pts[0])) break;
    pts.push(next);
    cur = next;
  }
  return pts;
};

const outline = chainLoop(outlineSegs);

const outlinePath = outline.length
  ? `M${outline.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`
  : '';

const outlineLens: number[] = [];
let outlinePerimeter = 0;
for (let i = 0; i < outline.length; i++) {
  const a = outline[i];
  const b = outline[(i + 1) % outline.length];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  outlineLens.push(len);
  outlinePerimeter += len;
}

const pointAtLength = (t: number): Pt => {
  let acc = 0;
  for (let i = 0; i < outline.length; i++) {
    if (acc + outlineLens[i] >= t) {
      const a = outline[i];
      const b = outline[(i + 1) % outline.length];
      const k = outlineLens[i] === 0 ? 0 : (t - acc) / outlineLens[i];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    acc += outlineLens[i];
  }
  return outline[0] ?? [CENTER.x, CENTER.y];
};

const claimCenter = (() => {
  if (!outline.length) return CENTER;
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
})();

type Fish = {
  key: string;
  x: number;
  y: number;
  size: number;
  giant: boolean;
  you: boolean;
  inside: boolean;
  seed: boolean;
  arrive: number;
  bob: number;
  bobPhase: number;
  tilt: number;
  tiltPhase: number;
};

const nearestSeed = (x: number, y: number) => {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < seeds.length; i++) {
    const d = (seeds[i].x - x) ** 2 + (seeds[i].y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
};

const makeFish = (
  key: string,
  i: number,
  x: number,
  y: number,
  size: number,
  giant: boolean,
  you: boolean,
  inside: boolean,
  seed: boolean,
  arrive: number,
): Fish => ({
  key,
  x,
  y,
  size,
  giant,
  you,
  inside,
  seed,
  arrive,
  bob: 2 + size * 0.09,
  bobPhase: hash(i, 5) * Math.PI * 2,
  tilt: 1.4 + hash(i, 6) * 1.4,
  tiltPhase: hash(i, 7) * Math.PI * 2,
});

// Nearly all of it is already there on frame 0 — the sentence starts mid-thought
// and an empty opening frame wastes the only second nobody has to be told about.
const seedFish: Fish[] = seeds.map((s) =>
  makeFish(
    `s${s.i}`,
    s.i,
    s.x,
    s.y,
    s.size,
    s.giant,
    s.you,
    s.claimed,
    true,
    -22 + (dist(s.x, s.y, CENTER.x, CENTER.y) / 1340) * 30,
  ),
);

// Swarm arrival is stored relative to the "million" beat and offset in the
// component, so the count lands on the word rather than on frame 0.
const swarmFish: Fish[] = [];
for (let n = 0; n < SWARM_COUNT; n++) {
  const i = 1000 + n;
  const x = FIELD.x + hash(i, 11) * FIELD.w;
  const y = FIELD.y + hash(i, 12) * FIELD.h;
  swarmFish.push(
    makeFish(
      `w${n}`,
      i,
      x,
      y,
      6 + hash(i, 13) * 5,
      false,
      false,
      CLAIM.has(nearestSeed(x, y)),
      false,
      hash(i, 14) * 14,
    ),
  );
}

const bodyPath = (s: number) => {
  const h = s * 0.55;
  return (
    `M${s},0` +
    `C${s},${-h * 0.76} ${s * 0.42},${-h} ${-s * 0.1},${-h}` +
    `C${-s * 0.55},${-h} ${-s * 0.8},${-h * 0.55} ${-s * 0.86},0` +
    `C${-s * 0.8},${h * 0.55} ${-s * 0.55},${h} ${-s * 0.1},${h}` +
    `C${s * 0.42},${h} ${s},${h * 0.76} ${s},0Z`
  );
};

const tailPath = (s: number) => {
  const h = s * 0.55;
  return `M${-s * 0.78},0L${-s * 1.5},${-h * 1.2}L${-s * 1.3},0L${-s * 1.5},${h * 1.2}Z`;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OUT = Easing.out(Easing.cubic);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  swarmOpacity: z.number().min(0).max(1),
  seedOpacity: z.number().min(0).max(1),
  giantOpacity: z.number().min(0).max(1),
  youOpacity: z.number().min(0).max(1),
  edgeOpacity: z.number().min(0).max(1),
  waterOpacity: z.number().min(0).max(1),
  liveliness: z.number().min(0).max(2),
  // Beat frames lifted from the SRT at 30fps, relative to 00:00:01.060:
  //     0 "the internet"    ·   9 "enables the"   ·  31 "creation of a"
  //    54 "million"         ·  63 "different ponds" · 89 "so you get"
  //   101 "to define"       · 116 "your own"      · 127 "pond be"
  //   142 "the only"        · 151 "biggest fish in" · 176 "that pond"
  //   202 "that's how you"  · 215 "succeed"
  beats: z.object({
    million: z.number().int(),
    ponds: z.number().int(),
    define: z.number().int(),
    pond: z.number().int(),
    only: z.number().int(),
    biggest: z.number().int(),
    thatPond: z.number().int(),
    succeed: z.number().int(),
  }),
});

export type PondPartitionProps = z.infer<typeof schema>;

export const defaultProps: PondPartitionProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#FFC543',
  shadow: 'rgba(0, 0, 0, 0.28)',
  swarmOpacity: 0.3,
  seedOpacity: 0.55,
  giantOpacity: 0.44,
  youOpacity: 0.74,
  edgeOpacity: 0.26,
  waterOpacity: 0.03,
  liveliness: 1,
  beats: {
    million: 54,
    ponds: 63,
    define: 101,
    pond: 127,
    only: 142,
    biggest: 151,
    thatPond: 176,
    succeed: 202,
  },
});

const PondPartition: React.FC<PondPartitionProps> = ({
  ink,
  accent,
  shadow,
  swarmOpacity,
  seedOpacity,
  giantOpacity,
  youOpacity,
  edgeOpacity,
  waterOpacity,
  liveliness,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ramp = (a: number, b: number, easing = OUT) =>
    interpolate(frame, [a, b], [0, 1], {easing, ...clamp});

  const waveEnd = beats.ponds + 29;

  // The camera never moves. Every comparison the graphic makes is held inside
  // one fixed frame, so nothing is revealed or removed by the shot itself.
  const camScale = 1;
  const pivotX = CENTER.x;
  const pivotY = CENTER.y;
  const camera = `translate(${(width / 2 - camScale * pivotX).toFixed(2)} ${(
    height / 2 -
    camScale * pivotY
  ).toFixed(2)}) scale(${camScale.toFixed(4)})`;
  const sw = (w: number) => w / camScale;

  const viewHalfW = width / (2 * camScale) + 220;
  const viewHalfH = height / (2 * camScale) + 220;
  const vx0 = pivotX - viewHalfW;
  const vx1 = pivotX + viewHalfW;
  const vy0 = pivotY - viewHalfH;
  const vy1 = pivotY + viewHalfH;
  const boxOut = (x0: number, x1: number, y0: number, y1: number) =>
    x1 < vx0 || x0 > vx1 || y1 < vy0 || y0 > vy1;

  // The partition is driven off a wavefront, not a timer: every edge draws from
  // whichever end the wave reaches first, so retiming can never desync them.
  const waveR = interpolate(frame, [beats.ponds, waveEnd], [0, 1450], {easing: OUT, ...clamp});

  const recede = ramp(waveEnd, waveEnd + 18);
  const iso = ramp(beats.only, beats.only + 16);
  const rippleR = interpolate(frame, [beats.succeed, beats.succeed + 26], [0, 1150], {
    easing: OUT,
    ...clamp,
  });
  const rippleUp = ramp(beats.succeed, beats.succeed + 26);

  const context = 1 - recede * 0.62;
  const outsideMul = context * (1 - iso * 0.62) * (1 + rippleUp * 0.5);
  const insideMul = context * (1 + iso * 1.6);
  // The excluded giants brighten for a moment on "biggest fish in" — that flash
  // is the size comparison, and it is the only reason the word lands.
  const giantFlash = interpolate(
    frame,
    [beats.biggest, beats.biggest + 8, beats.thatPond],
    [0, 1, 0.55],
    {easing: OUT, ...clamp},
  );

  const trace = interpolate(frame, [beats.define, beats.pond], [0, 1], {
    easing: Easing.bezier(0.24, 0, 0.32, 1),
    ...clamp,
  });
  const snap = interpolate(frame, [beats.pond, beats.pond + 6, beats.pond + 16], [0, 1, 0], {
    easing: OUT,
    ...clamp,
  });
  const pondFill = ramp(beats.pond, beats.pond + 14) * 0.05;
  const dissolve = ramp(beats.pond, beats.pond + 18);
  const penOut = 1 - ramp(beats.pond, beats.pond + 6);
  const pen = trace > 0.001 && penOut > 0.01 ? pointAtLength(trace * outlinePerimeter) : null;
  const youColor = interpolateColors(frame, [beats.pond - 3, beats.pond + 9], [ink, accent]);

  const fishNode = (f: Fish) => {
    if (boxOut(f.x, f.x, f.y, f.y)) return null;
    const at = f.seed ? f.arrive : beats.million - 3 + f.arrive;
    const on = interpolate(frame, [at, at + (f.seed ? 14 : 11)], [0, 1], {
      easing: OUT,
      ...clamp,
    });
    if (on <= 0.001) return null;

    let base = swarmOpacity;
    if (f.giant) base = giantOpacity;
    else if (f.you) base = youOpacity;
    else if (f.seed) base = seedOpacity;

    let o = on * base * (f.inside ? insideMul : outsideMul);
    if (f.giant) o += giantFlash * 0.26 * on;
    if (f.you) o = on * Math.max(base, ramp(beats.pond - 3, beats.pond + 9));

    let tint = 0;
    if (rippleR > 1 && f.seed && !f.giant && !f.inside && !f.you) {
      tint = clamp01((rippleR - dist(f.x, f.y, claimCenter.x, claimCenter.y)) / 220);
      o *= 1 + tint * 0.45;
    }
    if (o <= 0.004) return null;

    const bob = Math.sin((frame / 108) * Math.PI * 2 + f.bobPhase) * f.bob * liveliness;
    const tilt = Math.sin((frame / 127) * Math.PI * 2 + f.tiltPhase) * f.tilt * liveliness;
    const fill = f.you ? youColor : tint > 0.01 ? interpolateColors(tint, [0, 1], [ink, accent]) : ink;
    return (
      <g
        key={f.key}
        transform={`translate(${f.x.toFixed(1)} ${(f.y + bob).toFixed(2)}) rotate(${tilt.toFixed(2)})`}
        fill={fill}
        opacity={Math.min(1, o)}
      >
        <path d={bodyPath(f.size)} />
        <path d={tailPath(f.size)} />
      </g>
    );
  };

  const edgeNode = (e: Edge, i: number, inner: boolean) => {
    if (
      boxOut(
        Math.min(e.a[0], e.b[0]),
        Math.max(e.a[0], e.b[0]),
        Math.min(e.a[1], e.b[1]),
        Math.max(e.a[1], e.b[1]),
      )
    )
      return null;
    const d1 = dist(e.a[0], e.a[1], CENTER.x, CENTER.y);
    const d2 = dist(e.b[0], e.b[1], CENTER.x, CENTER.y);
    const from = d1 <= d2 ? e.a : e.b;
    const to = d1 <= d2 ? e.b : e.a;
    const p = clamp01((waveR - Math.min(d1, d2)) / Math.max(Math.abs(d2 - d1), 46));
    if (p <= 0.001) return null;
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const o = edgeOpacity * p * (inner ? context * (1 - dissolve) : outsideMul);
    if (o <= 0.004) return null;
    return (
      <line
        key={`${inner ? 'i' : 'o'}${i}`}
        x1={from[0]}
        y1={from[1]}
        x2={to[0]}
        y2={to[1]}
        stroke={ink}
        strokeWidth={sw(2)}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - p)}
        opacity={o}
      />
    );
  };

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          <g transform={camera}>
            {/* Water first, so the cells read as surfaces rather than wireframe. */}
            {cells.map((poly, i) => {
              const b = cellBounds[i];
              if (boxOut(b.x0, b.x1, b.y0, b.y1)) return null;
              const p = clamp01((waveR - dist(cellCentroids[i][0], cellCentroids[i][1], CENTER.x, CENTER.y)) / 120);
              const o = waterOpacity * p * (CLAIM.has(i) ? context * (1 - dissolve) : outsideMul);
              if (o <= 0.002 || poly.length < 3) return null;
              return (
                <polygon
                  key={`c${i}`}
                  points={poly.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ')}
                  fill={ink}
                  opacity={o}
                />
              );
            })}

            {outsideEdges.map((e, i) => edgeNode(e, i, false))}
            {innerSegs.map((e, i) => edgeNode(e, i, true))}
            {outlineSegs.map((e, i) => edgeNode(e, i + 900, false))}

            {pondFill > 0.002 && outlinePath ? (
              <path d={outlinePath} fill={accent} opacity={pondFill} />
            ) : null}

            {swarmFish.map(fishNode)}
            {seedFish.map(fishNode)}

            {/* The boundary is drawn, not granted — the stroke travels the whole
                perimeter and the pond only exists once it closes on itself. */}
            {trace > 0.001 && outlinePath ? (
              <path
                d={outlinePath}
                fill="none"
                stroke={accent}
                strokeWidth={sw(5 + snap * 4)}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={outlinePerimeter}
                strokeDashoffset={outlinePerimeter * (1 - trace)}
              />
            ) : null}

            {pen ? (
              <circle cx={pen[0]} cy={pen[1]} r={sw(9)} fill={accent} opacity={penOut} />
            ) : null}

            {/* And then so does everyone else's. */}
            {rippleR > 1
              ? allEdges.map((e, i) => {
                  const mx = (e.a[0] + e.b[0]) / 2;
                  const my = (e.a[1] + e.b[1]) / 2;
                  if (claimedCount(e) === 2) return null;
                  if (boxOut(mx, mx, my, my)) return null;
                  const o =
                    clamp01((rippleR - dist(mx, my, claimCenter.x, claimCenter.y)) / 220) * 0.26;
                  if (o <= 0.004) return null;
                  return (
                    <line
                      key={`r${i}`}
                      x1={e.a[0]}
                      y1={e.a[1]}
                      x2={e.b[0]}
                      y2={e.b[1]}
                      stroke={accent}
                      strokeWidth={sw(2)}
                      strokeLinecap="round"
                      opacity={o}
                    />
                  );
                })
              : null}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default PondPartition;
