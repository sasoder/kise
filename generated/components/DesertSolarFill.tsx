import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useMemo} from 'react';
import {z} from 'zod';

/**
 * DesertSolarFill — 4.000 s (96 f @ 24 fps), 1080x1920, opaque.
 *
 * A top-down desert fills up with a real solar farm. Photographic: the sand is
 * an aerial photo, every string is a cut of a real top-down panel photo, and
 * the farm is built from the bottom of the world upward while the camera pushes
 * in. Nothing diagrammatic, no labels, no counters.
 *
 * GEOMETRY (world = the scaled photo; world px unless stated)
 *  - Source photo 1308x1718, scaled x1.151 -> WORLD 1506x1978, placed at
 *    (-213, -29) inside the 1080x1920 frame. Cover + 3% overscan, centred.
 *    Artifact check: the white blob on the source left edge (src x 0..25) lands
 *    at world x 0..28.8 -> frame x -213..-184, off frame. The row of white dots
 *    at src y >= 1700 lands at world y >= 1956.7 -> frame y >= 1927.7, off
 *    frame. Both cropped.
 *  - Row pitch 46 = string height 30 + sand lane 16. After every 7 rows the
 *    lane is 40 instead of 16 (+24 access lane). Grid starts at world y = 20.
 *    ROWS = 40 (last row top y = 1934, bottom 1964 <= 1978).
 *  - Strings are 200x30 (tile drawn at h 30, aspect kept from 1696x254).
 *  - One N-S access lane 28 wide centred at world x = 753 (= frame centre
 *    540 + 213), i.e. 739..767. The lane is BUILT INTO the column layout, not
 *    cut out of it: right of the lane x = 767, 973, 1179, 1385 (753 + 14, then
 *    +206); left of the lane x = 539, 333, 127, -79 (753 - 14 - 200, then
 *    -206), the leftmost string hanging off the world's left edge. So 539+200 =
 *    739 and the next string starts at 767 — exactly 28 px of sand between two
 *    full strings, and both halves of the world are dense. 8 columns, 8 strings
 *    per full row.
 *  - Roughly half the strings are mirrored (deterministic hash, scaleX(-1)) so
 *    one photo repeated 269 times does not read as a tiled texture swatch.
 *  - Pool exclusion in world coords (= source coords x 1.151). A string whose
 *    200x30 rect touches a pool polygon is dropped whole, never clipped, so the
 *    farm edge stays ragged the way a built farm's does.
 *
 * CAMERA
 *  - f0-f95: one continuous push-in, scale 1.000 -> 1.070 about the frame
 *    centre, Easing.inOut(Easing.quad) over the full range. No holds, no second
 *    move. Assert: at scale s the frame shows world x in
 *    [213 + 540 - 540/s, 213 + 540 + 540/s] = [248.5, 1257.5] at s = 1.07 and
 *    [213, 1293] at s = 1, both inside world 0..1506; likewise y [29, 1949] ->
 *    [92.8, 1885.2] inside 0..1978. The push can never reveal a photo edge.
 *
 * MOTION
 *  - f0-f7: sand only (the camera is already pushing).
 *  - f8-f76: the fill front is ONE DIAGONAL WAVE running from the bottom-left
 *    corner of the world to the top-right — not rows stepping, and not two
 *    halves stepping. For a string at row i (bottom row = 0, top row = N-1 = 39)
 *    and column c (0 = leftmost column across the FULL world, both halves in one
 *    left-to-right index, M = 8):
 *        t    = 0.78 * i/(N-1) + 0.22 * c/(M-1)
 *        base = 8 + 66 * t
 *    plus a deterministic +/-2 f hash jitter per string, so the front edge is
 *    soft rather than a ruled line. Row weight dominates column weight 0.78:0.22
 *    so the wave still reads as rising. Last possible landing: 74 + 2 = f76.
 *  - Each string's arrival is 8 f: opacity 0->1 over its first 2 f with
 *    Easing.out(Easing.quad), so a string is three-quarters opaque one frame in
 *    and solid by the second — no translucent ghosts standing at the front.
 *    Scale 1.06->1.00 and translateY -6->0 px still run over all 8 f with
 *    Easing.out(cubic) — it drops onto the sand and stops. Its contact shadow
 *    fades 0->0.32 over frames 3-8 of the arrival.
 *  - f66-f95: one sun sheen. A diagonal soft-edged white band, ~500 px wide,
 *    peak alpha 0.08, sweeps top-left to bottom-right with
 *    Easing.inOut(Easing.sin). It is painted per string tile (same 200x30 rect,
 *    gradient anchored in world space) so it only ever touches panels, never
 *    sand. The sweep ends at 125% (half-band = 10.15%), so by f95 the band's
 *    trailing feathered edge sits at 114.8% — fully off the bottom-right corner,
 *    nothing of the sheen left on the panels on the last frame.
 *  - f76-f95: nothing new appears; camera push + sheen exit only.
 *
 * Frame-driven throughout: useCurrentFrame + interpolate(clamp) + Easing. No
 * springs, no CSS transitions or animations, no randomness.
 */

export const FPS = 24;
export const DURATION = 96;

export const schema = z.object({
  /** Draws the pool-exclusion polygons in red over the bare photo. Calibration only. */
  debug: z.boolean().default(false),
});

export const defaultProps = schema.parse({});

// ---------------------------------------------------------------- geometry --
const SRC_W = 1308;
const SRC_H = 1718;
const PHOTO_SCALE = 1.151;
const WORLD_W = Math.round(SRC_W * PHOTO_SCALE); // 1506
const WORLD_H = Math.round(SRC_H * PHOTO_SCALE); // 1978
const WORLD_X = -213;
const WORLD_Y = -29;

const STRING_W = 200;
const STRING_H = 30;
const END_GAP = 6;
const ROW_STEP = STRING_W + END_GAP; // 206
const LANE = 16;
const ROW_PITCH = STRING_H + LANE; // 46
const ACCESS_EVERY = 7;
const ACCESS_EXTRA = 24;
const GRID_TOP = 20;

const NS_LANE_X = 753;
const NS_LANE_W = 28;

const CAM_FROM = 1.0;
const CAM_TO = 1.07;

// ------------------------------------------------------------------ pools ---
// Source-photo coordinates; scaled to world by PHOTO_SCALE below.
type Ellipse = {kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot: number};
type Poly = {kind: 'poly'; pts: [number, number][]; grow: number};

const POOLS_SRC: (Ellipse | Poly)[] = [
  // A — small greenish pool, upper left, plus its dark wet rim.
  {kind: 'ellipse', cx: 288, cy: 463, rx: 140, ry: 70, rot: -10},
  // B — blue teardrop, upper right.
  {
    kind: 'poly',
    pts: [
      [795, 292],
      [972, 278],
      [1016, 332],
      [960, 452],
      [878, 528],
      [812, 512],
      [762, 420],
    ],
    grow: 24,
  },
  // C — the big elongated green pool, lower middle.
  {kind: 'ellipse', cx: 582, cy: 1266, rx: 308, ry: 150, rot: -8},
];

const centroid = (pts: [number, number][]): [number, number] => {
  let sx = 0;
  let sy = 0;
  for (const p of pts) {
    sx += p[0];
    sy += p[1];
  }
  return [sx / pts.length, sy / pts.length];
};

const growPoly = (pts: [number, number][], by: number): [number, number][] => {
  const [cx, cy] = centroid(pts);
  return pts.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [cx + (dx / len) * (len + by), cy + (dy / len) * (len + by)] as [number, number];
  });
};

type WorldEllipse = {kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot: number};
type WorldPoly = {kind: 'poly'; pts: [number, number][]};
type WorldPool = WorldEllipse | WorldPoly;

const POOLS: WorldPool[] = POOLS_SRC.map((p) => {
  if (p.kind === 'ellipse') {
    return {
      kind: 'ellipse',
      cx: p.cx * PHOTO_SCALE,
      cy: p.cy * PHOTO_SCALE,
      rx: p.rx * PHOTO_SCALE,
      ry: p.ry * PHOTO_SCALE,
      rot: p.rot,
    };
  }
  return {
    kind: 'poly',
    pts: growPoly(p.pts, p.grow).map(
      ([x, y]) => [x * PHOTO_SCALE, y * PHOTO_SCALE] as [number, number],
    ),
  };
});

const inEllipse = (e: WorldEllipse, x: number, y: number) => {
  const a = (e.rot * Math.PI) / 180;
  const dx = x - e.cx;
  const dy = y - e.cy;
  const lx = dx * Math.cos(a) + dy * Math.sin(a);
  const ly = -dx * Math.sin(a) + dy * Math.cos(a);
  return (lx / e.rx) ** 2 + (ly / e.ry) ** 2 <= 1;
};

const inPoly = (pts: [number, number][], x: number, y: number) => {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      hit = !hit;
    }
  }
  return hit;
};

/** True if the 200x30 string rect touches any pool. Sampled on a 13x3 grid — far
 *  finer than the smallest pool feature — plus the shapes' own anchor points. */
const touchesPool = (x: number, y: number) => {
  for (const pool of POOLS) {
    if (pool.kind === 'ellipse') {
      if (
        pool.cx >= x &&
        pool.cx <= x + STRING_W &&
        pool.cy >= y &&
        pool.cy <= y + STRING_H
      ) {
        return true;
      }
    } else {
      for (const [px, py] of pool.pts) {
        if (px >= x && px <= x + STRING_W && py >= y && py <= y + STRING_H) return true;
      }
    }
    for (let i = 0; i <= 12; i++) {
      const sx = x + (STRING_W * i) / 12;
      for (let j = 0; j <= 2; j++) {
        const sy = y + (STRING_H * j) / 2;
        const hit = pool.kind === 'ellipse' ? inEllipse(pool, sx, sy) : inPoly(pool.pts, sx, sy);
        if (hit) return true;
      }
    }
  }
  return false;
};

// ------------------------------------------------------------------ layout --
const hash01 = (a: number, b: number) => {
  let h = Math.imul(a + 0x9e37, 73856093) ^ Math.imul(b + 0x85eb, 19349663);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

type Tile = {x: number; y: number; arrive: number; flip: boolean};

const buildTiles = (): {tiles: Tile[]; rows: number} => {
  const ys: number[] = [];
  for (let k = 0; ; k++) {
    const y = GRID_TOP + k * ROW_PITCH + Math.floor(k / ACCESS_EVERY) * ACCESS_EXTRA;
    if (y + STRING_H > WORLD_H) break;
    ys.push(y);
  }
  // The N-S access lane is part of the column layout, not a hole punched in it:
  // the two halves are laid out away from the lane edges, so the lane is exactly
  // NS_LANE_W of sand between two full strings and neither half is sparse.
  const xs: number[] = [];
  for (let x = NS_LANE_X - NS_LANE_W / 2 - STRING_W; x + STRING_W > 0; x -= ROW_STEP) xs.unshift(x);
  for (let x = NS_LANE_X + NS_LANE_W / 2; x < WORLD_W; x += ROW_STEP) xs.push(x);

  const rows = ys.length;
  const cols = xs.length;
  const tiles: Tile[] = [];

  for (let k = 0; k < rows; k++) {
    const y = ys[k];
    const i = rows - 1 - k; // bottom row = 0
    for (let c = 0; c < cols; c++) {
      const x = xs[c];
      if (touchesPool(x, y)) continue;
      // One diagonal wave: row dominates, column tilts it, so the front travels
      // bottom-left -> top-right instead of the halves stepping row by row.
      const t = 0.78 * (i / (rows - 1)) + 0.22 * (c / (cols - 1));
      const base = 8 + 66 * t;
      const jitter = Math.round((hash01(k, c) * 2 - 1) * 2);
      // Mirror roughly half the tiles: one photo repeated identically across
      // 269 strings reads as a texture swatch, not as a farm.
      const flip = hash01(c, k) < 0.5;
      // Clamped at 8 so the -2 jitter on the bottom row can never break the
      // f0-f7 sand-only hold.
      tiles.push({x, y, arrive: Math.max(8, base + jitter), flip});
    }
  }
  return {tiles, rows};
};

// Sheen: the gradient is anchored in world space and painted per tile, so it
// only ever lights panels. 135deg over a WORLD_W x WORLD_H box has gradient-line
// length (WORLD_W + WORLD_H)/sqrt(2) = 2464 px; a 500 px band is 2 x 10.15%.
const SHEEN_HALF_PCT = (250 / ((WORLD_W + WORLD_H) / Math.SQRT2)) * 100;

const sheenGradient = (centerPct: number) => {
  const w = SHEEN_HALF_PCT;
  const s = (v: number) => Math.max(0, Math.min(100, v)).toFixed(3);
  return (
    `linear-gradient(135deg,` +
    ` rgba(255,255,255,0) ${s(centerPct - w)}%,` +
    ` rgba(255,255,255,0.03) ${s(centerPct - w * 0.55)}%,` +
    ` rgba(255,255,255,0.08) ${s(centerPct)}%,` +
    ` rgba(255,255,255,0.03) ${s(centerPct + w * 0.55)}%,` +
    ` rgba(255,255,255,0) ${s(centerPct + w)}%)`
  );
};

// ------------------------------------------------------------------- scene --
export const DesertSolarFill: React.FC<z.infer<typeof schema>> = ({debug}) => {
  const frame = useCurrentFrame();
  const {tiles} = useMemo(buildTiles, []);

  const cam = interpolate(frame, [0, DURATION - 1], [CAM_FROM, CAM_TO], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sheenPct = interpolate(frame, [66, DURATION - 1], [-12, 125], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sheen = sheenGradient(sheenPct);

  return (
    <AbsoluteFill style={{backgroundColor: '#c9a97c'}}>
      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '540px 960px'}}>
        <div
          style={{
            position: 'absolute',
            left: WORLD_X,
            top: WORLD_Y,
            width: WORLD_W,
            height: WORLD_H,
            overflow: 'hidden',
          }}
        >
          <Img
            src={staticFile('desert-solar/desert.png')}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: WORLD_W,
              height: WORLD_H,
              display: 'block',
            }}
          />

          {debug ? (
            <svg
              width={WORLD_W}
              height={WORLD_H}
              viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
              style={{position: 'absolute', left: 0, top: 0}}
            >
              {POOLS.map((p, i) =>
                p.kind === 'ellipse' ? (
                  <ellipse
                    key={i}
                    cx={p.cx}
                    cy={p.cy}
                    rx={p.rx}
                    ry={p.ry}
                    transform={`rotate(${p.rot} ${p.cx} ${p.cy})`}
                    fill="none"
                    stroke="#ff0000"
                    strokeWidth={5}
                  />
                ) : (
                  <polygon
                    key={i}
                    points={p.pts.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill="none"
                    stroke="#ff0000"
                    strokeWidth={5}
                  />
                ),
              )}
            </svg>
          ) : (
            tiles.map((t) => {
              const dt = frame - t.arrive;
              const op = interpolate(dt, [0, 2], [0, 1], {
                easing: Easing.out(Easing.quad),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              if (op <= 0) return null;
              const drop = interpolate(dt, [0, 8], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const sc = 1.06 + (1 - 1.06) * drop;
              const ty = -6 + 6 * drop;
              const shadow = interpolate(dt, [3, 8], [0, 0.32], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div
                  key={`${t.x}-${t.y}`}
                  style={{
                    position: 'absolute',
                    left: t.x,
                    top: t.y,
                    width: STRING_W,
                    height: STRING_H,
                    opacity: op,
                    transform: `translateY(${ty}px) scale(${sc})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 2,
                      top: 3,
                      width: STRING_W,
                      height: STRING_H,
                      backgroundColor: '#000',
                      opacity: shadow,
                      filter: 'blur(2px)',
                    }}
                  />
                  <Img
                    src={staticFile('desert-solar/solar-string.png')}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: STRING_W,
                      height: STRING_H,
                      objectFit: 'fill',
                      display: 'block',
                      transform: t.flip ? 'scaleX(-1)' : undefined,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: STRING_W,
                      height: STRING_H,
                      backgroundImage: sheen,
                      backgroundSize: `${WORLD_W}px ${WORLD_H}px`,
                      backgroundPosition: `${-t.x}px ${-t.y}px`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default DesertSolarFill;
