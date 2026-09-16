import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {useMemo} from 'react';
import {loadFont} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';
import outlineJson from '../../public/us-solar/us_outline_z6.json';
import geometry from '../../public/us-solar/geometry.json';

const {fontFamily} = loadFont('normal', {weights: ['700'], subsets: ['latin']});

/**
 * CoalMiningLand — 136 f @ 24 fps, 1080x1920, opaque.
 *
 * Joel, same podcast clip as PowerTheEntireUs, cut starts at 38.579 s:
 *   "We could power the whole US with the amount of land that's currently used
 *    for, like, coal mining, right?"
 *
 * DURATION derivation (repeated from the brief):
 *   round((43.579 - 38.579) * 24) = round(5.000 * 24) = 120
 *   + 16 frames of tail = 136 frames.
 * Word onsets, frame = round((t - 38.579) * 24):
 *   we 0 - could 3 - power 7 - the 13 - whole 15 - u-s 18 (ends 29) - with 29 -
 *   the 31 - amount 37 - of 39 - land 43 - that's 47 - currently 52 - used 56 -
 *   for 63 - like 67 - coal 72 - mining 85 (ends 97) - right? 97 (ends 120).
 *
 * THE PICTURE: the mirror of PowerTheEntireUs. Identical world — the conus_z6
 * pixel space, the namerica_z6 plate at world (-387, -2193) with its 80 px
 * mirrored bottom skirt, the same log-space camera, the same Square string
 * grid, the same label styling. It OPENS exactly where the sister cut ended:
 * the wide contiguous US at K 0.366 centred on (1394.8, 784.3) with the white
 * outline ALREADY DRAWN (no trace) — but with no Nevada square, because this
 * line is about the other end of the comparison. The sharp z8 close-up patch is
 * appalachia_z8.jpg over WV/KY/VA instead of southern Nevada; the Nevada
 * patch_z8 is not drawn (at K 0.366 it is the same imagery and invisible).
 *
 * MOTION LIST (word -> frames)
 *  - f0-f24 "we could power the whole US": camera creep IN only, K 0.366 ->
 *    0.372, C fixed on the CONUS centre. The reverse of the sister cut's
 *    closing drift OUT, so the join across the two cuts reads as continuous.
 *    Nothing appears or moves but the camera.
 *  - "the amount of land" (f24-f50): ONE push-in, Easing.inOut(cubic),
 *    K 0.372 -> 6.5, C -> the coalfield centroid (2016.44, 818.22). It lands on
 *    f50, two frames before "currently" (f52) and 22 before "coal" (f72).
 *  - "currently used for, like, coal mining" (f50-f100): the coalfield-shaped
 *    patch FILLS with solar strings. One diagonal wave from the bbox's
 *    bottom-left, 0.78 row + 0.22 column normalised over the strings actually
 *    placed (half strings included), base arrival 50 + 42*t, +/-2 f
 *    deterministic jitter, 8 f drop. The first strings drop as the camera lands
 *    (arrive 52.7) and the last lands on f98.3 — "mining" ends f97. The
 *    ARRIVE_MAX clamp keeps the last landing at or under f100 either way.
 *    Nothing is visible before f50.
 *  - NO polygon stroke anywhere. The ragged string cluster alone is the shape
 *    of the land; an outline sat far outside the strings and read as a ring.
 *  - "right?" (f97-f103): ONE label, "coal mining land", fades in with a 6 px
 *    rise — screen space, centred on the polygon centroid's screen x, cap-top
 *    24 px below the polygon bbox's bottom edge, recomputed from the camera
 *    every frame so it rides the creep. It stays to f135.
 *  - f50-f135: hold creep, K 6.5 -> 6.75 linear, C fixed. Never parked.
 *
 * CAMERA. screen = (world - C) * K + (540, 835); content centre y 835 because
 * captions live in the bottom band. K is interpolated in LOG space.
 * ASSERT at K 6.5, C = (2016.44, 818.22), content centre y 835: the frame
 * covers world x 2016.44 -/+ 540/6.5 = 1933.36..2099.52 and world y
 * 818.22 - 835/6.5 = 689.76 .. 818.22 + 1085/6.5 = 985.14. The appalachia_z8
 * patch covers world 1853..2237 x 623..1007, so the whole landed frame is
 * inside the sharp z8 image with 80 world px to spare on the nearest side.
 * ASSERT at the final K 6.75 the frame is world x 1936.44..2096.44,
 * y 694.52..978.96 — also fully inside the patch, so the hold creep never
 * reaches a patch edge.
 * ASSERT the polygon at K 6.5 lands on screen x 152.3..921.9, y 520.3..1192.4:
 * the mining land fills the frame width with 152 px of margin and its label
 * sits at y ~1216, above the caption band.
 *
 * COALFIELD GEOMETRY. coalfield_polygon_world (10 points, world bbox
 * 1956.82..2075.15 x 769.80..873.21 = 118.33 x 103.41 world px). The same
 * string grid as the sister cut's Square is tiled over that bbox in local units
 * (1 local = 0.082712 world px, so the bbox is 1430.6 x 1250.2 local): string
 * 158 x 24, end gap 8, row pitch 36 with the wider 32 px lane after every 6
 * rows, top margin 16, mirrored tiles, contact shadow. 31 rows x 8 columns of
 * candidates; a full string is KEPT only if all four of its corners are inside
 * the polygon. DENSER EDGE: where a full string fails, its two halves are
 * tested separately — left half at the same x, right half at x + 83, each 75
 * local long (75 + 8 + 75 = 158, so halves sit on the full-string grid) — and
 * each half whose four corners are inside is placed. Nothing is ever clipped;
 * the ragged cluster now hugs the polygon. 149 full + 27 half = 176 strings.
 * DEVIATION from the sister cut, per the brief: no N-S access lane (the columns
 * simply start at the bbox's left edge), because the land is a blob, not a
 * surveyed square, and a ruler-straight lane through it would read as a road.
 *
 * Frame-driven throughout: useCurrentFrame + interpolate(clamp) + Easing. No
 * springs, no CSS transitions, no randomness.
 *
 * PREVIEW (half-res h264, as in the sister cut):
 *   bunx remotion render src/index.ts CoalMiningLand \
 *     <scratchpad>/CoalMiningLand_preview.mp4 \
 *     --config=<scratchpad>/preview.config.ts --scale=0.5 --muted
 * FINAL:
 *   bunx remotion render src/index.ts CoalMiningLand out/CoalMiningLand.mov --muted
 */

export const FPS = 24;
export const DURATION = 136;

export const schema = z.object({
  /** Outlines the patch edge and the polygon in red/green for calibration only. */
  debug: z.boolean().default(false),
});

export const defaultProps = schema.parse({});

// ------------------------------------------------------------------- world --
const WORLD_W = 2799;
const WORLD_H = 1570;

// The sharp zoom-8 patch over the central Appalachian coalfield.
const PATCH_X = 1853;
const PATCH_Y = 623;
const PATCH_SCALE = 0.25;
const PATCH_W = 1536 * PATCH_SCALE; // 384
const PATCH_H = 1536 * PATCH_SCALE; // 384
const PATCH_FEATHER = 60; // world px, all four sides

// The extended zoom-6 plate. Same pixel space as the old CONUS plate, which it
// contains pixel-for-pixel, so drawn at world (-387, -2193) at scale 1.
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

// ---------------------------------------------------------------- coalfield --
const POLY: [number, number][] = (
  geometry as unknown as {coalfield_polygon_world: {points: [number, number][]}}
).coalfield_polygon_world.points;

const POLY_MIN_X = Math.min(...POLY.map((p) => p[0])); // 1956.82
const POLY_MAX_X = Math.max(...POLY.map((p) => p[0])); // 2075.15
const POLY_MIN_Y = Math.min(...POLY.map((p) => p[1])); // 769.80
const POLY_MAX_Y = Math.max(...POLY.map((p) => p[1])); // 873.21
const POLY_W = POLY_MAX_X - POLY_MIN_X; // 118.33
const POLY_H = POLY_MAX_Y - POLY_MIN_Y; // 103.41

const CF_CX = 2016.44;
const CF_CY = 818.22;

const US_CX = 1394.8;
const US_CY = 784.3;

const SCREEN_CX = 540;
const SCREEN_CY = 835;

// ------------------------------------------------------------------ camera --
const K0 = 0.366; // the sister cut's last frame, exactly
const K1 = 0.372;
const K2 = 6.5;
const K3 = 6.75;

const CREEP_TO = 24;
const PUSH_TO = 50;

/** K lives in log space so the 17x push-in reads as one constant rate. */
const cameraScale = (f: number) => {
  if (f <= CREEP_TO) {
    return Math.exp(
      interpolate(f, [0, CREEP_TO], [Math.log(K0), Math.log(K1)], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
  }
  if (f <= PUSH_TO) {
    return Math.exp(
      interpolate(f, [CREEP_TO, PUSH_TO], [Math.log(K1), Math.log(K2)], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
  }
  return Math.exp(
    interpolate(f, [PUSH_TO, DURATION - 1], [Math.log(K2), Math.log(K3)], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
};

const cameraCentre = (f: number): [number, number] => {
  const p = interpolate(f, [CREEP_TO, PUSH_TO], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return [US_CX + (CF_CX - US_CX) * p, US_CY + (CF_CY - US_CY) * p];
};

// ------------------------------------------------------------- panel layout --
const LOCAL_TO_WORLD = 82.71196221139313 / 1000; // 0.082712, the sister cut's unit
const LOCAL_W = POLY_W / LOCAL_TO_WORLD; // 1430.63
const LOCAL_H = POLY_H / LOCAL_TO_WORLD; // 1250.24

const STRING_W = 158;
const STRING_H = 24;
const END_GAP = 8;
const COL_STEP = STRING_W + END_GAP; // 166
/** A full string split in two: 75 + 8 end gap + 75 = 158, so the halves sit on
 *  the same grid as the full strings they replace at the ragged edge. */
const HALF_W = 75;
const HALF_OFFSET = HALF_W + END_GAP; // 83
const LANE = 12;
const ROW_PITCH = STRING_H + LANE; // 36
const ACCESS_EVERY = 6;
const ACCESS_EXTRA = 20; // the lane is 32 instead of 12 after every 6 rows
const GRID_TOP = 16;

const DROP_F = 8;
const ARRIVE_MIN = 50; // nothing drops before the camera lands
const ARRIVE_MAX = 92; // 92 + 8 = 100, the last string lands on f100

const hash01 = (a: number, b: number) => {
  let h = Math.imul(a + 0x9e37, 73856093) ^ Math.imul(b + 0x85eb, 19349663);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Even-odd ray cast, world coords. */
const insidePoly = (px: number, py: number) => {
  let c = false;
  for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
    const [xi, yi] = POLY[i];
    const [xj, yj] = POLY[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

const localToWorldX = (lx: number) => POLY_MIN_X + lx * LOCAL_TO_WORLD;
const localToWorldY = (ly: number) => POLY_MIN_Y + ly * LOCAL_TO_WORLD;

type Tile = {x: number; y: number; w: number; arrive: number; flip: boolean};

/** All four corners of a w x STRING_H local-space tile inside the polygon. */
const tileInside = (lx: number, ly: number, w: number) => {
  const x0 = localToWorldX(lx);
  const x1 = localToWorldX(lx + w);
  const y0 = localToWorldY(ly);
  const y1 = localToWorldY(ly + STRING_H);
  return insidePoly(x0, y0) && insidePoly(x1, y0) && insidePoly(x0, y1) && insidePoly(x1, y1);
};

const buildTiles = (): Tile[] => {
  const ys: number[] = [];
  for (let k = 0; ; k++) {
    const y = GRID_TOP + k * ROW_PITCH + Math.floor(k / ACCESS_EVERY) * ACCESS_EXTRA;
    if (y + STRING_H > LOCAL_H) break;
    ys.push(y);
  }
  const xs: number[] = [];
  for (let x = 0; x + STRING_W <= LOCAL_W; x += COL_STEP) xs.push(x);

  const rows = ys.length; // 31
  const cols = xs.length; // 8

  // Never clip. A string is placed only when all four of its corners are inside
  // the polygon. Where the FULL string fails, its two halves are tested
  // separately, so the edge follows the land instead of stepping back a whole
  // 158-long string at a time.
  const kept: {k: number; ci: number; cf: number; x: number; w: number}[] = [];
  for (let k = 0; k < rows; k++) {
    for (let c = 0; c < cols; c++) {
      if (tileInside(xs[c], ys[k], STRING_W)) {
        kept.push({k, ci: c * 2, cf: c, x: xs[c], w: STRING_W});
        continue;
      }
      if (tileInside(xs[c], ys[k], HALF_W)) {
        kept.push({k, ci: c * 2, cf: c, x: xs[c], w: HALF_W});
      }
      if (tileInside(xs[c] + HALF_OFFSET, ys[k], HALF_W)) {
        kept.push({k, ci: c * 2 + 1, cf: c + 0.5, x: xs[c] + HALF_OFFSET, w: HALF_W});
      }
    }
  }

  // The wave normalises over the strings ACTUALLY placed — halves included —
  // not over the bbox, so it still runs the full 0..1 range across the shape.
  const kMin = Math.min(...kept.map((t) => t.k));
  const kMax = Math.max(...kept.map((t) => t.k));
  const cMin = Math.min(...kept.map((t) => t.cf));
  const cMax = Math.max(...kept.map((t) => t.cf));

  return kept.map(({k, ci, cf, x, w}) => {
    const i = (kMax - k) / (kMax - kMin); // 1 at the top row, 0 at the bottom
    const cn = (cf - cMin) / (cMax - cMin);
    // One diagonal wave from the bbox's bottom-left: row dominates, column tilts.
    const t = 0.78 * i + 0.22 * cn;
    const base = ARRIVE_MIN + 42 * t;
    const jitter = Math.round((hash01(k, ci) * 2 - 1) * 2);
    // Mirror roughly half the tiles so hundreds of copies of one photo do not
    // read as a tiled texture swatch.
    const flip = hash01(ci, k) < 0.5;
    return {
      x,
      y: ys[k],
      w,
      arrive: Math.min(ARRIVE_MAX, Math.max(ARRIVE_MIN, base + jitter)),
      flip,
    };
  });
};

const TILES = buildTiles();

const POLY_LOCAL = POLY.map(
  ([wx, wy]) =>
    [(wx - POLY_MIN_X) / LOCAL_TO_WORLD, (wy - POLY_MIN_Y) / LOCAL_TO_WORLD] as [number, number],
);
const POLY_LOCAL_STR = POLY_LOCAL.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

// ------------------------------------------------------------------ outline --
const RAW_POINTS = (outlineJson as unknown as {points: [number, number][]}).points;

const buildOutline = () => {
  const pts = RAW_POINTS;
  return (
    `M ${pts[0][0]} ${pts[0][1]} ` +
    pts
      .slice(1)
      .map((p) => `L ${p[0]} ${p[1]}`)
      .join(' ') +
    ' Z'
  );
};

// -------------------------------------------------------------------- label --
const LABEL_IN_FROM = 97;
const LABEL_IN_TO = 103;
const LABEL_RISE = 6; // px, settling to 0
const LABEL_FS = 40;
const LABEL_GAP = 24; // px from the polygon's bottom edge to the label's cap-top
/** Line-box top -> cap top for Barlow 700 at 40 px / 40 px line-height, as in
 *  the sister cut. The label is placed by its cap-top, so the 24 px gap is the
 *  gap the eye actually sees. */
const LABEL_CAP_INSET = 6.4;

// ---------------------------------------------------------------- coalfield --
const UNDER_COLOR = '#234a8a';
const UNDER_OPACITY = 0.72;

type CoalfieldProps = {
  frame: number;
  k: number;
};

const Coalfield: React.FC<CoalfieldProps> = ({frame, k}) => {
  // The solid block under the strings exists for the wide shot, where a string
  // is sub-pixel and the land would otherwise moire. Same camera gating as the
  // sister cut: it arrives only as K drops from 5 to 2. This cut never goes
  // wide again after the push-in, so it is never visible — the code path is
  // kept identical on purpose.
  const blockGate = interpolate(k, [2, 5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fill = interpolate(frame, [ARRIVE_MIN, ARRIVE_MAX + DROP_F], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const underOp = UNDER_OPACITY * Math.min(fill, blockGate);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: LOCAL_W,
        height: LOCAL_H,
        transform: `scale(${LOCAL_TO_WORLD})`,
        transformOrigin: '0 0',
      }}
    >
      {/* The block under the strings, clipped to the land's own shape. */}
      {underOp > 0 ? (
        <svg
          width={LOCAL_W}
          height={LOCAL_H}
          viewBox={`0 0 ${LOCAL_W} ${LOCAL_H}`}
          style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
        >
          <polygon points={POLY_LOCAL_STR} fill={UNDER_COLOR} opacity={underOp} />
        </svg>
      ) : null}
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
            key={`${t.x}-${t.y}-${t.w}`}
            style={{
              position: 'absolute',
              left: t.x,
              top: t.y,
              width: t.w,
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
                width: t.w,
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
                width: t.w,
                height: STRING_H,
                objectFit: 'fill',
                display: 'block',
                transform: t.flip ? 'scaleX(-1)' : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// -------------------------------------------------------------------- scene --
export const CoalMiningLand: React.FC<z.infer<typeof schema>> = ({debug}) => {
  const frame = useCurrentFrame();
  const outlineD = useMemo(buildOutline, []);

  const k = cameraScale(frame);
  const [cx, cy] = cameraCentre(frame);

  const sx = (wx: number) => (wx - cx) * k + SCREEN_CX;
  const sy = (wy: number) => (wy - cy) * k + SCREEN_CY;

  // The label is drawn in screen space, not in the world, so the type stays
  // crisp and a fixed 40 px at every camera scale — and it tracks the creep
  // because these are recomputed every frame.
  const labelX = sx(CF_CX);
  const labelY = sy(POLY_MAX_Y);

  const labelIn = interpolate(frame, [LABEL_IN_FROM, LABEL_IN_TO], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
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
        {/* The North America plate at scale 1, NO mask: it runs past the frame
            at every camera key. The plate ends at world y 3695, 53.8 world px
            short of the f0 frame bottom at K 0.366, so the same 80 px mirrored
            skirt as the sister cut continues its bottom row with no join. */}
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

        {/* The sharp z8 Appalachia patch, feathered 60 world px on all four
            sides so no seam shows during the push-in. Two nested
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
              src={staticFile('us-solar/appalachia_z8.jpg')}
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

        {/* PANEL — the coalfield polygon's bbox, in local units scaled by
            0.082712, exactly as the sister cut's square. */}
        <div
          style={{
            position: 'absolute',
            left: POLY_MIN_X,
            top: POLY_MIN_Y,
            width: POLY_W,
            height: POLY_H,
          }}
        >
          <Coalfield frame={frame} k={k} />
        </div>

        {/* US OUTLINE — fully drawn from f0 (this cut opens where the sister cut
            ended). Stroke and shadow divided by k so both are constant on
            screen, since a CSS-transformed SVG scales its own stroke. */}
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
            d={outlineD}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2 / k}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.8}
          />
        </svg>

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
            <polygon
              points={POLY.map((p) => `${p[0]},${p[1]}`).join(' ')}
              fill="none"
              stroke="#00ff00"
              strokeWidth={4 / k}
            />
          </svg>
        ) : null}
      </div>

      {/* ONE LABEL — screen space, centred on the polygon centroid's screen x,
          placed by its cap-top 24 px below the polygon bbox's bottom edge and
          recomputed from the camera transform every frame so it rides the
          creep. In f97-f103 on "right?", and it stays to the end. */}
      {labelIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: labelX,
            top: labelY + LABEL_GAP - LABEL_CAP_INSET,
            transform: `translate(-50%, ${labelRise}px)`,
            fontFamily,
            fontWeight: 700,
            fontSize: LABEL_FS,
            lineHeight: `${LABEL_FS}px`,
            letterSpacing: '0.02em',
            color: '#ffffff',
            whiteSpace: 'nowrap',
            opacity: labelIn,
            textShadow: '0 2px 6px rgba(0,0,0,0.55)',
          }}
        >
          coal mining land
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default CoalMiningLand;
