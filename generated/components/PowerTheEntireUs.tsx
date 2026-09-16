import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useMemo} from 'react';
import {loadFont} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';
import outlineJson from '../../public/us-solar/us_outline_z6.json';

const {fontFamily} = loadFont('normal', {weights: ['700'], subsets: ['latin']});

/**
 * PowerTheEntireUs — 208 f @ 24 fps, 1080x1920, opaque.
 *
 * Joel, podcast clip, cut starts at 28.719 s of the SRT:
 *   "Elon's right, like, you know, it takes 100 square miles or whatever,
 *    right? Like 100 by 100 to, like, power the entire US a few times over,
 *    right? Yeah, it's pretty remarkable."
 *
 * DURATION derivation (repeated from the brief):
 *   round((36.740 - 28.719) * 24) = round(8.021 * 24) = round(192.504) = 192
 *   + 16 frames of tail = 208 frames.
 * Word onsets, frame = round((t - 28.719) * 24):
 *   elon's 0 - right 9 - it 28 - takes 30 - 100 35 - square 43 - miles 48 -
 *   or 63 - whatever 66 - right? 74 - like/100 84 - by 92 - 100 95 - to 100 -
 *   power 109 - the 113 - entire 116 - u-s 121 (ends 133) - a 133 - few 134 -
 *   times 136 - over 140 (ends 146) - right? 146 - yeah 149 - pretty 162 -
 *   remarkable 166 (ends 193).
 *
 * THE PICTURE: the same photographic world as DesertSolarFill, one scale up.
 * Real satellite imagery (NASA Blue Marble, Web Mercator). The old conus_z6
 * pixel space (2799x1570) IS the world coordinate system, but the plate drawn
 * is namerica_z6.jpg (3584x5888, the same zoom-6 pixel space, extended): it
 * contains the old CONUS plate pixel-for-pixel, so it is drawn at world
 * (-387, -2193) at scale 1 and every square, patch offset, outline point and
 * camera key is unchanged. It carries NO edge feather — it runs past the frame
 * at every camera key, so there is no plate edge to hide.
 * ASSERT at the final K 0.366 (content centre y 835, not a centred frame): the
 * frame covers world x -80.6..2870.2, y -1497.1..3748.8. x and the top are
 * inside the plate's -387..3197 x -2193..3695; the bottom overruns it by 53.8
 * world px, so the plate carries an 80 px mirrored skirt off its bottom edge.
 * patch_z8.jpg is the same imagery four times sharper, drawn at 0.25 over
 * southern Nevada (feathered 60 world px, unchanged) so the close-up is a real
 * photograph and not an upscale of the wide plate.
 *
 * MOTION LIST (word -> frames)
 *  - "it takes 100 square miles" (28-48): the 100 x 100 mile square FILLS with
 *    solar strings. One diagonal wave from the bottom-left, 0.78 row +
 *    0.22 column, base arrival 2 + 40*t, +/-2 f deterministic jitter, 8 f drop.
 *    First string drops on f2, the last lands at f52 — complete on "miles"
 *    plus the drop tail. The white square stroke fades in f44-f52 as the last
 *    strings land. The #234a8a block under the strings is gated on the camera
 *    (see the Square comment), not on the fill.
 *  - "miles" (52-58): ONE label, "100 x 100 mi", fades in as the last strings
 *    land — screen space, centred under the square, cap-top 24 px below its
 *    bottom edge, recomputed from the camera every frame so it tracks the
 *    creep. Easing.out(cubic), a 6 px rise settling to 0.
 *  - "100 by 100" (84-98): NOTHING appears. V2 REVISION: the two dimension
 *    rules, their end ticks and both "100 mi" texts are gone. The client reads
 *    the line as ONE 100 x 100 mile square, so the piece keeps one square and
 *    one label from f58 to f108 and never re-states the measurement.
 *  - "to" (100-108): the label fades OUT, before the pull-back would shrink or
 *    slide it. It never returns.
 *  - "power the entire US" (88-118): ONE pull-back, K 7.25 -> 0.380,
 *    Easing.inOut(cubic). Lands on f118, three frames before "u-s" (f121).
 *  - "the entire US" (114-142): the contiguous-US outline TRACES on from the
 *    outline point nearest the square, Easing.inOut(quad). Extended from f138
 *    so the trace carries the hold a little longer now that nothing stamps in.
 *  - f142-f207: camera drift only. K 0.380 -> 0.366. Nothing else appears —
 *    the wide shot is the single square inside the finished outline.
 *
 * CAMERA. screen = (world - C) * K + (540, 835). Content centre is y 835
 * because captions live in the bottom band. K is interpolated in LOG space so
 * the 19x pull-back reads at a constant rate.
 *   f0   -> f88 : C = square centre (477.711, 839.016), K 7.60 -> 7.25.
 *                 A slow creep only; the frame is never parked.
 *   f88  -> f118: K 7.25 -> 0.380, Easing.inOut(Easing.cubic).
 *   f96  -> f118: C square centre -> CONUS centre (1394.8, 784.3), same ease.
 *                 DEVIATION from the brief's f88 start, KEPT in V2: with C
 *                 moving from f88 the square has slid 403 screen px left by f96,
 *                 dragging the label off-centre while it still reads. Holding C
 *                 on the square until f96 keeps square and label centred through
 *                 the whole hold; the pan still lands on f118 and peaks at
 *                 42 screen px/frame.
 *   f118 -> f207: hold drift, K 0.380 -> 0.366 linear, C fixed.
 * ASSERT at K = 0.380: the outline bbox (world x 81.3-2708.3, y 79.9-1488.6,
 * i.e. 2627.0 x 1408.7) is 998.3 x 535.3 screen px, centred on (540, 835)
 * because C is its centre — side margin (1080 - 998.3)/2 = 40.9 px >= 40,
 * vertical margin (1920 - 535.3)/2 = 692 px. The whole contiguous US is inside
 * the frame.
 * ASSERT at K = 7.25: the frame shows 1080/7.25 = 148.97 x 1920/7.25 = 264.83
 * world px, i.e. world x 403.23-552.20 and y 723.85-988.68. The patch covers
 * world x 227.5-728.0, y 591.5-1078.5, so the close-up is entirely inside the
 * sharp z8 image.
 *
 * SQUARE GEOMETRY. Local units: the square is 1000 x 1000, scaled into the
 * world by 82.712/1000 = 0.082712 (1 local = 0.5997 screen px at K 7.25 and
 * 0.0314 px at K 0.38). Rows: string height 24 + sand lane 12 = pitch 36, and
 * every 6 rows the lane is 32 (+20). Top margin 16 -> 25 rows, last row bottom
 * 984, bottom margin 16. Columns: one N-S lane 20 wide at local x 500 built
 * INTO the column layout (as DesertSolarFill does), strings laid away from its
 * edges with 8 px end gaps: left 332, 166, 0 and right 510, 676, 842.
 * DEVIATION: string length 158, not 160 — at 160 the six columns plus five gaps
 * plus the 20-wide lane come to 1012 and would hang 6 local px off each side of
 * the square. At 158 they sum to exactly 1000: 3*158 + 2*8 = 490 per half,
 * 490 + 20 + 490 = 1000, symmetric, zero margin, the lane exactly 20 wide
 * between two full strings. 25 x 6 = 150 strings, one square, 150 in total.
 *
 * Frame-driven throughout: useCurrentFrame + interpolate(clamp) + Easing. No
 * springs, no CSS transitions, no randomness.
 */

export const FPS = 24;
export const DURATION = 208;

export const schema = z.object({
  /** Outlines the square and the patch edge in red for calibration only. */
  debug: z.boolean().default(false),
});

export const defaultProps = schema.parse({});

// ------------------------------------------------------------------- world --
const WORLD_W = 2799;
const WORLD_H = 1570;

const PATCH_X = 227.5;
const PATCH_Y = 591.5;
const PATCH_SCALE = 0.25;
const PATCH_W = 2002 * PATCH_SCALE; // 500.5
const PATCH_H = 1948 * PATCH_SCALE; // 487
const PATCH_FEATHER = 60; // world px, all four sides

// The extended zoom-6 plate. Same pixel space as the old CONUS plate, which it
// contains pixel-for-pixel at (387, 2193) of its own image — so drawn here at
// world (-387, -2193) every world coordinate in this file is unchanged.
const PLATE_X = -387;
const PLATE_Y = -2193;
const PLATE_W = 3584;
const PLATE_H = 5888;
const PLATE_SKIRT = 80; // world px of mirrored edge-extend below the plate
/** Smoothstep-shaped ramp: a plain two-stop gradient leaves a visible knee where
 *  it reaches full opacity, which reads as an edge of its own. */
const featherMask = (dir: string, px: number) => {
  const ramp = [0, 0.25, 0.5, 0.75, 1].map((s) => ({at: s * px, a: s * s * (3 - 2 * s)}));
  const head = ramp.map((r) => `rgba(0,0,0,${r.a.toFixed(3)}) ${r.at.toFixed(2)}px`).join(', ');
  const tail = ramp
    .slice()
    .reverse()
    .map((r) => `rgba(0,0,0,${r.a.toFixed(3)}) calc(100% - ${r.at.toFixed(2)}px)`)
    .join(', ');
  return `linear-gradient(${dir}, ${head}, ${tail})`;
};

const SQ_X = 436.3551300054146;
const SQ_Y = 797.6597684863091;
const SQ_SIDE = 82.71196221139313;
const SQ_CX = SQ_X + SQ_SIDE / 2; // 477.711
const SQ_CY = SQ_Y + SQ_SIDE / 2; // 839.016

const US_CX = 1394.8;
const US_CY = 784.3;

const SCREEN_CX = 540;
const SCREEN_CY = 835;

// ------------------------------------------------------------------ camera --
const K0 = 7.6;
const K1 = 7.25;
const K2 = 0.38;
const K3 = 0.366;

const PULL_FROM = 88;
const PULL_TO = 118;
const PAN_FROM = 96;

/** K lives in log space so the 19x pull-back feels like one constant rate. */
const cameraScale = (f: number) => {
  if (f <= PULL_FROM) {
    return Math.exp(
      interpolate(f, [0, PULL_FROM], [Math.log(K0), Math.log(K1)], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
  }
  if (f <= PULL_TO) {
    return Math.exp(
      interpolate(f, [PULL_FROM, PULL_TO], [Math.log(K1), Math.log(K2)], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
  }
  return Math.exp(
    interpolate(f, [PULL_TO, DURATION - 1], [Math.log(K2), Math.log(K3)], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
};

const cameraCentre = (f: number): [number, number] => {
  const p = interpolate(f, [PAN_FROM, PULL_TO], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return [SQ_CX + (US_CX - SQ_CX) * p, SQ_CY + (US_CY - SQ_CY) * p];
};

// ------------------------------------------------------------- panel layout --
const SQ_LOCAL = 1000;
const LOCAL_TO_WORLD = SQ_SIDE / SQ_LOCAL; // 0.082712

const STRING_W = 158;
const STRING_H = 24;
const END_GAP = 8;
const COL_STEP = STRING_W + END_GAP; // 166
const LANE = 12;
const ROW_PITCH = STRING_H + LANE; // 36
const ACCESS_EVERY = 6;
const ACCESS_EXTRA = 20; // the lane is 32 instead of 12 after every 6 rows
const GRID_TOP = 16;

const NS_LANE_X = 500;
const NS_LANE_W = 20;

const DROP_F = 8;
const ARRIVE_MAX = 44; // 44 + 8 = 52, the last string lands on f52

const hash01 = (a: number, b: number) => {
  let h = Math.imul(a + 0x9e37, 73856093) ^ Math.imul(b + 0x85eb, 19349663);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

type Tile = {x: number; y: number; arrive: number; flip: boolean};

const buildTiles = (): Tile[] => {
  const ys: number[] = [];
  for (let k = 0; ; k++) {
    const y = GRID_TOP + k * ROW_PITCH + Math.floor(k / ACCESS_EVERY) * ACCESS_EXTRA;
    if (y + STRING_H > SQ_LOCAL) break;
    ys.push(y);
  }
  // The N-S lane is part of the column layout, not a hole punched in it: the
  // two halves are laid out away from the lane edges, so the lane is exactly
  // NS_LANE_W of sand between two full strings and neither half is sparse.
  const xs: number[] = [];
  for (let x = NS_LANE_X - NS_LANE_W / 2 - STRING_W; x >= 0; x -= COL_STEP) xs.unshift(x);
  for (let x = NS_LANE_X + NS_LANE_W / 2; x + STRING_W <= SQ_LOCAL; x += COL_STEP) xs.push(x);

  const rows = ys.length; // 25
  const cols = xs.length; // 6
  const tiles: Tile[] = [];
  for (let k = 0; k < rows; k++) {
    const y = ys[k];
    const i = rows - 1 - k; // bottom row = 0
    for (let c = 0; c < cols; c++) {
      // One diagonal wave from the bottom-left: row dominates, column tilts it.
      // Every string is inside the square and every string is on frame during
      // the close-up, so the wave normalises over the full 0..1 range.
      const t = 0.78 * (i / (rows - 1)) + 0.22 * (c / (cols - 1));
      const base = 2 + 40 * t;
      const jitter = Math.round((hash01(k, c) * 2 - 1) * 2);
      // Mirror roughly half the tiles so 150 copies of one photo do not read as
      // a tiled texture swatch.
      const flip = hash01(c, k) < 0.5;
      tiles.push({
        x: xs[c],
        y,
        arrive: Math.min(ARRIVE_MAX, Math.max(0, base + jitter)),
        flip,
      });
    }
  }
  return tiles;
};

const TILES = buildTiles();

// ------------------------------------------------------------------ outline --
const RAW_POINTS = (outlineJson as unknown as {points: [number, number][]}).points;

/** Rotated so the trace starts at the outline point nearest the square. */
const buildOutline = () => {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < RAW_POINTS.length; i++) {
    const d = (RAW_POINTS[i][0] - SQ_CX) ** 2 + (RAW_POINTS[i][1] - SQ_CY) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const pts: [number, number][] = [];
  for (let i = 0; i < RAW_POINTS.length; i++) {
    pts.push(RAW_POINTS[(best + i) % RAW_POINTS.length]);
  }
  let length = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    length += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const d =
    `M ${pts[0][0]} ${pts[0][1]} ` +
    pts
      .slice(1)
      .map((p) => `L ${p[0]} ${p[1]}`)
      .join(' ') +
    ' Z';
  return {d, length};
};

const OUTLINE_FROM = 114;
const OUTLINE_TO = 142;

// -------------------------------------------------------------------- label --
const LABEL_IN_FROM = 52;
const LABEL_IN_TO = 58;
const LABEL_OUT_FROM = 100;
const LABEL_OUT_TO = 108;
const LABEL_RISE = 6; // px, settling to 0
const LABEL_FS = 40;
const LABEL_GAP = 24; // px from the square's bottom edge to the label's cap-top
/** Line-box top -> cap top for Barlow 700 at 40 px / 40 px line-height, measured
 *  off the f60 still (white cap row minus the div's top). The label is placed by
 *  its cap-top, so the 24 px gap is the gap the eye actually sees. */
const LABEL_CAP_INSET = 6.4;

// ------------------------------------------------------------------- square --
const UNDER_COLOR = '#234a8a';
const UNDER_OPACITY = 0.72;

type SquareProps = {
  frame: number;
  k: number;
};

const Square: React.FC<SquareProps> = ({frame, k}) => {
  // The solid block under the strings exists so that at the wide shot, where a
  // string is 0.16 screen px tall, the square reads as one saturated block
  // instead of a moiré. DEVIATION from the brief: it is NOT a flat f0-f48 fade.
  // At the close-up a 72% solar-blue rect over the unbuilt half of the square reads as
  // a patch of smog sitting on the desert (confirmed on the f24 still), so the
  // fill fade is gated on the camera: the block arrives only as the strings go
  // sub-pixel, K 5 -> 2, which is inside the pull-back. In the close-up the
  // strings carry the read on their own.
  const blockGate = interpolate(k, [2, 5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fill = interpolate(frame, [0, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const underOp = UNDER_OPACITY * Math.min(fill, blockGate);
  const strokeOp =
    0.85 *
    interpolate(frame, [44, 52], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // 1.5 screen px, expressed in local units: the world div scales by k and the
  // square scales by LOCAL_TO_WORLD on top of that.
  const strokeW = 1.5 / (LOCAL_TO_WORLD * k);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: SQ_LOCAL,
        height: SQ_LOCAL,
        transform: `scale(${LOCAL_TO_WORLD})`,
        transformOrigin: '0 0',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: SQ_LOCAL,
          height: SQ_LOCAL,
          backgroundColor: UNDER_COLOR,
          opacity: underOp,
        }}
      />
      {TILES.map((t) => {
        const dt = frame - t.arrive;
        const op = interpolate(dt, [-1, 1], [0, 1], {
          easing: Easing.out(Easing.quad),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (op <= 0) return null;
        const drop = interpolate(dt, [0, DROP_F], [0, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const sc = 1.06 + (1 - 1.06) * drop;
        const ty = -5 + 5 * drop;
        const shadow = interpolate(dt, [3, DROP_F], [0, 0.32], {
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
                left: 1,
                top: 1.5,
                width: STRING_W,
                height: STRING_H,
                backgroundColor: '#000',
                opacity: shadow,
                filter: 'blur(1px)',
              }}
            />
            <Img
              src={staticFile('us-solar/solar-string.png')}
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
          </div>
        );
      })}
      <svg
        width={SQ_LOCAL}
        height={SQ_LOCAL}
        viewBox={`0 0 ${SQ_LOCAL} ${SQ_LOCAL}`}
        style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
      >
        <rect
          x={strokeW / 2}
          y={strokeW / 2}
          width={SQ_LOCAL - strokeW}
          height={SQ_LOCAL - strokeW}
          fill="none"
          stroke="#ffffff"
          strokeWidth={strokeW}
          opacity={strokeOp}
        />
      </svg>
    </div>
  );
};

// -------------------------------------------------------------------- scene --
export const PowerTheEntireUs: React.FC<z.infer<typeof schema>> = ({debug}) => {
  const frame = useCurrentFrame();
  const outline = useMemo(buildOutline, []);

  const k = cameraScale(frame);
  const [cx, cy] = cameraCentre(frame);

  const sx = (wx: number) => (wx - cx) * k + SCREEN_CX;
  const sy = (wy: number) => (wy - cy) * k + SCREEN_CY;

  // The square in screen space — the label is drawn here, not in the world, so
  // the type stays crisp and a fixed 40 px at every camera scale, and it tracks
  // the camera creep because these are recomputed every frame.
  const x0 = sx(SQ_X);
  const x1 = sx(SQ_X + SQ_SIDE);
  const y1 = sy(SQ_Y + SQ_SIDE);

  const outlineP = interpolate(frame, [OUTLINE_FROM, OUTLINE_TO], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ONE label, on completion: in as the last strings land (f52-f58), out as the
  // pull-back starts (f100-f108), never again.
  const labelIn = interpolate(frame, [LABEL_IN_FROM, LABEL_IN_TO], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelOut = interpolate(frame, [LABEL_OUT_FROM, LABEL_OUT_TO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelOp = labelIn * labelOut;
  const labelRise = LABEL_RISE * (1 - labelIn);

  return (
    <AbsoluteFill style={{backgroundColor: '#0b1220', overflow: 'hidden'}}>
      {/* WORLD. screen = (world - C) * k + (540, 835) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${SCREEN_CX}px, ${SCREEN_CY}px) scale(${k}) translate(${-cx}px, ${-cy}px)`,
          transformOrigin: '0 0',
        }}
      >
        {/* The North America plate at scale 1, NO mask: it runs past the frame at
            every camera key, so there is no edge to feather away.
            DEVIATION from the brief's assert, which put the frame at world
            y -1839..3407: the content centre is SCREEN_CY 835, not 960, so at
            the final K 0.366 the frame is world x -80.6..2870.2, y -1497.1..
            3748.8. x and the top sit inside the plate (-387..3197, -2193..),
            but the plate ends at y 3695 — 53.8 world px (19.7 screen px) of
            #0b1220 showed along the bottom edge from ~f164 on, confirmed on the
            f207 still. The skirt below is the plate mirrored about its own
            bottom edge (clipped to 80 world px), so the bottom row continues
            itself with no join and no flat band. */}
        <Img
          src={staticFile('us-solar/namerica_z6.jpg')}
          style={{
            position: 'absolute',
            left: PLATE_X,
            top: PLATE_Y,
            width: PLATE_W,
            height: PLATE_H,
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: PLATE_X,
            top: PLATE_Y + PLATE_H,
            width: PLATE_W,
            height: PLATE_SKIRT,
            overflow: 'hidden',
          }}
        >
          <Img
            src={staticFile('us-solar/namerica_z6.jpg')}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: PLATE_W,
              height: PLATE_H,
              display: 'block',
              transform: 'scaleY(-1) translateY(-100%)',
              transformOrigin: '0 0',
            }}
          />
        </div>

        {/* The sharp z8 patch, feathered 60 world px on all four sides so no
            seam shows against the z6 plate during the pull-back. Two nested
            single-gradient masks rather than mask-composite. */}
        <div
          style={{
            position: 'absolute',
            left: PATCH_X,
            top: PATCH_Y,
            width: PATCH_W,
            height: PATCH_H,
            maskImage: featherMask('to right', PATCH_FEATHER),
            WebkitMaskImage: featherMask('to right', PATCH_FEATHER),
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: PATCH_W,
              height: PATCH_H,
              maskImage: featherMask('to bottom', PATCH_FEATHER),
              WebkitMaskImage: featherMask('to bottom', PATCH_FEATHER),
            }}
          >
            <Img
              src={staticFile('us-solar/patch_z8.jpg')}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: PATCH_W,
                height: PATCH_H,
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* PANEL — ONE square, 1000 local units scaled by 0.082712. */}
        <div
          style={{position: 'absolute', left: SQ_X, top: SQ_Y, width: SQ_SIDE, height: SQ_SIDE}}
        >
          <Square frame={frame} k={k} />
        </div>
        {/* US OUTLINE — world space, stroke and shadow divided by k so both are
            constant on screen (a CSS-transformed SVG scales its own stroke). */}
        {outlineP > 0 ? (
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              overflow: 'visible',
              filter: `drop-shadow(0 ${1 / k}px ${4 / k}px rgba(0,0,0,0.6))`,
            }}
          >
            <path
              d={outline.d}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2 / k}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.8}
              strokeDasharray={outline.length}
              strokeDashoffset={outline.length * (1 - outlineP)}
            />
          </svg>
        ) : null}

        {debug ? (
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{position: 'absolute', left: 0, top: 0}}
          >
            <rect
              x={PATCH_X}
              y={PATCH_Y}
              width={PATCH_W}
              height={PATCH_H}
              fill="none"
              stroke="#ff0000"
              strokeWidth={4 / k}
            />
            <rect
              x={SQ_X}
              y={SQ_Y}
              width={SQ_SIDE}
              height={SQ_SIDE}
              fill="none"
              stroke="#00ff00"
              strokeWidth={4 / k}
            />
          </svg>
        ) : null}
      </div>

      {/* ONE LABEL — screen space, centred under the square, placed by its
          cap-top 24 px below the square's bottom edge and recomputed from the
          camera transform every frame so it tracks the creep. In f52-f58 as the
          last strings land, out f100-f108 as the pull-back starts. It never
          returns: the wide shot is the bare square inside the outline. */}
      {labelOp > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: (x0 + x1) / 2,
            top: y1 + LABEL_GAP - LABEL_CAP_INSET,
            transform: `translate(-50%, ${labelRise}px)`,
            fontFamily,
            fontWeight: 700,
            fontSize: LABEL_FS,
            lineHeight: `${LABEL_FS}px`,
            letterSpacing: '0.02em',
            color: '#ffffff',
            whiteSpace: 'nowrap',
            opacity: labelOp,
            textShadow: '0 2px 6px rgba(0,0,0,0.55)',
          }}
        >
          100 × 100 mi
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default PowerTheEntireUs;
