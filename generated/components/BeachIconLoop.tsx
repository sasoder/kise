import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

// Beach icon loop — a quiet afternoon: palm sways, water laps, sun glints.
//
// The supplied PNG is never redrawn. It is split into five clipped copies of
// the SAME bitmap (SaplingIconLoop's technique): the palm (crown + whole
// trunk), the island mound, the sun, and each wave line as its own strip.
// Every clip is a polygon in the icon's 512 space (BEACH_PIECES), applied in
// the piece's local coordinates, so the clip travels with the piece and each
// piece only ever carries its own ink. Only the palm and mound share ink,
// across a deliberate overlap band that hides the seam; the sun and wave
// strips are disjoint from everything (checked by rasterising the polygons
// against the alpha: every inked pixel is owned, no strip steals a neighbour's).
//
// Motion, and why — three gestures and a breath, nothing else:
//  1. The palm sways in the breeze. The trunk is curved, so a cut part-way up
//     it would open a gap the moment the crown turned. The cut is therefore at
//     the ROOT, along the line where the trunk meets the island: from the left
//     junction corner (64,380) to the right one (115,397), measured off the
//     alpha. The whole palm rotates about the midpoint of that line
//     (PIVOT 89.5,388.5), so seam points sit at most ~27 units from the pivot
//     and move <= 0.7 units at 1.5deg (<= 1.4 at liveliness 2), against a
//     5-unit overlap INSIDE the trunk: the palm runs 2.5 below the line, the
//     static island (drawn on top) starts 2.5 above it. Outside the corners
//     both clips run through white, and at each corner they meet at the corner
//     point, so neither layer holds a copy of the other's edge — the trunk's
//     outline simply meets the sand, and what moves reads as the trunk flexing
//     at its root. (Checked with 5x crops at both extremes, at liveliness 1
//     and 2.) One slow sway per loop plus a 0.25 second harmonic (phase 0.9),
//     normalised so the deepest lean is exactly SWAY_DEG * liveliness: 1.5deg
//     landward (crown left, into the onshore breeze's push) and 1.1deg back
//     toward the sea, so it leans and lingers instead of metronoming.
//  2. The water laps. Each wave line drifts on a small orbit — x +-WAVE_DX,
//     y +-WAVE_DY a quarter-cycle behind, which is how water particles
//     actually move under a passing wave — and the two lines run half a cycle
//     apart, so the gap between them breathes. A 5-unit shift on a wave whose
//     wavelength is ~116 units reads as the crest travelling, not a bar
//     sliding.
//  3. The sun's glitter path — the one flair. Short black dashes (stroke 7,
//     about a third of the wave stroke, round caps) BEHIND the PNG in the
//     three water gaps straight below the sun — just under the disc, between
//     the waves, under the lower wave — the path widening toward the viewer
//     like a real glitter path. Slots are dealt round-robin to the gaps; each
//     gap is its own evenly spaced train of firings that never overlap, so two
//     dashes never stack into a darker double, and the gaps are offset by a
//     third of a spacing so the path glitters in a loose top-to-bottom ripple.
//     Each firing (~16 frames) opens from a point and keeps stretching as it
//     fades; its x is re-hashed per firing (index mod GLINT_FIRES, so the loop
//     still shuts). The waves occlude the glints as they lap over them, which
//     is the point of drawing them behind.
//  4. A barely-there volume-preserving breath on the whole icon (x up, y down,
//     <= 0.3%), anchored at the island's base so the island stays planted.
//
// Everything is a pure function of one normalised `cycle` (beachPose), so
// changing fps/duration resamples the motion, and the core-memory version can
// reuse the exact same pose with beachPieceStyle() on its masked flat layers.
//
// Measured on the 1080x1080 render (see report): frame 95 -> 0 difference is
// within the adjacent-frame range; nothing comes within 40px of the edge.

export const schema = z.object({
  icon: z.string(),
  iconSize: z.number().min(240).max(960),
  /** Glint slots, dealt round-robin to the three gaps; each fires GLINT_FIRES times per loop. */
  glintCount: z.number().int().min(0).max(12),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(2),
});

export type BeachIconLoopProps = z.infer<typeof schema>;

export const defaultProps: BeachIconLoopProps = schema.parse({
  icon: 'beach.png',
  iconSize: 760,
  glintCount: 6,
  liveliness: 1,
});

export const FPS = 24;
export const DURATION = 96; // 4s

// ---------------------------------------------------------------------------
// Geometry measured off public/beach.png's own pixels, in its 512x512 space.
// Ink is pure #000000 on alpha. Artwork bbox x 0..511, y 40..471.
//   Crown   x 22..361, y 40..~232 (fronds meet the trunk top ~y 184..232)
//   Trunk   curves from x ~170..210 at y 184 down-left to x 65..133 at y 380
//   Island  x 0..181, y 373..471; trunk joins it at (64,380) and (115,397)
//   Sun     disc centre (340.8, 315.1), r 45.7, bbox x 296..386, y 270..360
//   Waves   stroke ~18.5, wavelength ~116, crests at x ~225/341/457
//           upper x 171..511, y 385..417 (centre line ~y 395..408)
//           lower x 231..450, y 426..458
// ---------------------------------------------------------------------------
export const VIEW = 512;

export const SUN = {cx: 340.8, cy: 315.1, r: 45.7};

/** Where the trunk meets the island: the two concave junction corners. */
export const ROOT_LEFT = {x: 64, y: 380};
export const ROOT_RIGHT = {x: 115, y: 397};
const ROOT_SLOPE = (ROOT_RIGHT.y - ROOT_LEFT.y) / (ROOT_RIGHT.x - ROOT_LEFT.x);
/** y of the root cut line at x. */
const rootLine = (x: number) => ROOT_LEFT.y + (x - ROOT_LEFT.x) * ROOT_SLOPE;
/** Half the palm/mound overlap, in icon units (5 units total). */
export const SEAM_OVERLAP = 2.5;
/** The palm rotates about the middle of its root line. */
export const PIVOT = {
  x: (ROOT_LEFT.x + ROOT_RIGHT.x) / 2,
  y: (ROOT_LEFT.y + ROOT_RIGHT.y) / 2,
};
/** Island base: the breath is anchored here. */
export const BASE = {x: 90, y: 471};

/** Right edge of the palm/island pieces: clear of the upper wave's cap (x 171). */
const LAND_X = 166;
/** Boundary between the two wave strips (upper wave ends 421, lower starts 426). */
const WAVE_SPLIT = 424;

export type PieceId = 'palm' | 'island' | 'sun' | 'waveUpper' | 'waveLower';
type Pt = readonly [number, number];

/**
 * Clip polygons in 512 space. Outer edges run past the box (-8 / 520) so no
 * antialiased edge pixel is ever cropped. Draw order = array order.
 */
export const BEACH_PIECES: readonly {id: PieceId; poly: readonly Pt[]}[] = [
  {
    id: 'palm',
    poly: [
      [-8, -8],
      [372, -8],
      [372, 252], // under the crown (bottom ~232), above the sun (top 270)
      [222, 252],
      [222, 320],
      [LAND_X, 370], // trunk right edge is x <= 173 here
      // The overlap band exists ONLY between the two root corners. Outside
      // them the clip climbs clear of the sand through white, so the palm
      // never carries (and rotates) a sliver of the island's surface.
      // At each corner the clip steps in to the corner point itself, so the
      // antialiased tip of the sand stays with the island (a sliver of it on
      // the palm showed as a sub-pixel speck at 3deg).
      [118, 395],
      [ROOT_RIGHT.x + 0.5, ROOT_RIGHT.y],
      [ROOT_RIGHT.x - 3, rootLine(ROOT_RIGHT.x - 3) + SEAM_OVERLAP],
      [ROOT_LEFT.x + 3, rootLine(ROOT_LEFT.x + 3) + SEAM_OVERLAP],
      [ROOT_LEFT.x - 0.5, ROOT_LEFT.y],
      [58, 370],
      [-8, 370],
    ],
  },
  {
    id: 'waveUpper',
    poly: [
      [LAND_X, 376],
      [520, 376],
      [520, WAVE_SPLIT],
      [LAND_X, WAVE_SPLIT],
    ],
  },
  {
    id: 'waveLower',
    poly: [
      [216, WAVE_SPLIT],
      [520, WAVE_SPLIT],
      [520, 520],
      [216, 520],
    ],
  },
  {
    id: 'sun',
    poly: [
      [280, 256],
      [400, 256],
      [400, 372],
      [280, 372],
    ],
  },
  {
    // Drawn after the palm, so its static copy of the trunk root covers the
    // palm's cut edge.
    id: 'island',
    // Its top runs through white outside the corners (the palm's own
    // diagonals), dips to the corner points and only rises SEAM_OVERLAP
    // above the root line inside the trunk. So the static layer never holds a
    // copy of the trunk's EDGE beside the moving one (that stepped by ~1px at
    // 3deg); at the corners the trunk edge just meets the sand.
    poly: [
      [-8, 370],
      [58, 370],
      [ROOT_LEFT.x, ROOT_LEFT.y + 0.5],
      [ROOT_LEFT.x + 8, rootLine(ROOT_LEFT.x + 8) - SEAM_OVERLAP],
      [ROOT_RIGHT.x - 8, rootLine(ROOT_RIGHT.x - 8) - SEAM_OVERLAP],
      [ROOT_RIGHT.x, ROOT_RIGHT.y + 0.5],
      [119, 396],
      [LAND_X, 370],
      [LAND_X, WAVE_SPLIT],
      [216, WAVE_SPLIT],
      [216, 520],
      [-8, 520],
    ],
  },
];

// ---------------------------------------------------------------------------
// Motion constants (at liveliness 1).
// ---------------------------------------------------------------------------
/** Peak palm sway, degrees. */
export const SWAY_DEG = 1.5;
const SWAY_H2 = 0.25;
const SWAY_H2_PHASE = 0.9;
/** Wave orbit, icon units. */
export const WAVE_DX = 5;
export const WAVE_DY = 1.5;
/** Whole-icon breath, fraction. */
const BREATH_X = 0.003;
const BREATH_Y = 0.003;

/** Firings per glint slot per loop (integer, or the loop opens). */
export const GLINT_FIRES = 2;
/** A firing lasts this fraction of the loop (~16 frames), capped per row. */
const GLINT_LIFE = 0.17;
export const GLINT_STROKE = 7;
export const GLINT_OPACITY = 0.42;
/**
 * The water gaps under the sun, nearest the horizon first. `y` is the dash
 * centre line, `half` the half-width of the glitter path at that depth, `len`
 * the dash's full length. Slots are dealt to the rows round-robin.
 */
export const GLINT_ROWS = [
  {y: 373, half: 20, len: 22}, // just under the disc, above the upper wave
  {y: 416, half: 30, len: 30}, // between the two waves
  {y: 470, half: 40, len: 38}, // under the lower wave
] as const;

const TAU = Math.PI * 2;

/** Stable hash: same value every loop, so nothing flickers frame to frame. */
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

const swayShape = (c: number) =>
  Math.sin(TAU * c) + SWAY_H2 * Math.sin(2 * TAU * c + SWAY_H2_PHASE);

/** Peak of |swayShape|, found once, so SWAY_DEG is the true peak. */
const SWAY_NORM = (() => {
  let m = 0;
  for (let i = 0; i < 2000; i++) {
    m = Math.max(m, Math.abs(swayShape(i / 2000)));
  }
  return m;
})();

export type Glint = {
  key: string;
  x1: number;
  x2: number;
  y: number;
  opacity: number;
};

export type BeachPose = {
  /** Palm rotation about PIVOT, degrees (positive = clockwise, crown right). */
  palmDeg: number;
  waveUpper: {dx: number; dy: number};
  waveLower: {dx: number; dy: number};
  glints: Glint[];
  /** Whole-icon breath about BASE. */
  breath: {sx: number; sy: number};
};

/** The whole motion as a pure function of the loop position. */
export const beachPose = (
  cycle: number,
  liveliness: number,
  glintCount: number,
): BeachPose => {
  const palmDeg = (swayShape(cycle) / SWAY_NORM) * SWAY_DEG * liveliness;

  const orbit = (phase: number) => ({
    dx: WAVE_DX * liveliness * Math.sin(TAU * (cycle + phase)),
    dy: -WAVE_DY * liveliness * Math.cos(TAU * (cycle + phase)),
  });

  const glints: Glint[] = [];
  const nRows = GLINT_ROWS.length;
  for (let i = 0; i < glintCount; i++) {
    // Each gap is its own train: slots are dealt round-robin to the rows, and
    // a row's firings are spaced evenly round the loop and never overlap, so
    // two dashes never stack into a darker double in one gap. The rows are
    // offset by a third of a spacing, so the path glitters top-to-bottom in
    // a loose ripple rather than all at once. Small hashed jitter keeps it
    // from ticking.
    const r = i % nRows;
    const row = GLINT_ROWS[r];
    const k = Math.floor(i / nRows);
    const inRow = Math.ceil((glintCount - r) / nRows);
    const spacing = 1 / (inRow * GLINT_FIRES); // loop fraction between firings
    const lifeSpan = Math.min(GLINT_LIFE, 0.85 * spacing);
    const jitter = 0.12 * spacing * (hash(i, 3) - 0.5);
    const phase = (k + (r + 0.5) / nRows) / inRow / GLINT_FIRES + jitter;
    const t = (cycle + phase) * GLINT_FIRES;
    const fire = ((Math.floor(t) % GLINT_FIRES) + GLINT_FIRES) % GLINT_FIRES;
    const life = (t - Math.floor(t)) / GLINT_FIRES / lifeSpan;
    if (life >= 1) {
      continue;
    }
    // Per-firing position across the path.
    const seed = i * GLINT_FIRES + fire;
    const cx = SUN.cx + (hash(seed, 17) * 2 - 1) * row.half;
    const y = row.y + (hash(seed, 23) - 0.5) * 4;
    const full = row.len * (0.7 + 0.5 * hash(seed, 29));
    // Opens from a point (ease-out), keeps stretching as it fades.
    const grow = 1 - Math.pow(1 - life, 2.2);
    const len = full * (0.12 + 0.88 * grow);
    const alpha =
      smoothstep(life / 0.22) * (1 - smoothstep((life - 0.4) / 0.6));
    glints.push({
      key: `g-${i}`,
      x1: cx - len / 2,
      x2: cx + len / 2,
      y,
      opacity: GLINT_OPACITY * Math.min(1, liveliness) * alpha,
    });
  }

  const b = Math.sin(TAU * cycle) * liveliness;

  return {
    palmDeg,
    waveUpper: orbit(0),
    waveLower: orbit(0.5),
    glints,
    breath: {sx: 1 + b * BREATH_X, sy: 1 - b * BREATH_Y},
  };
};

const pct = (v: number) => `${(v / VIEW) * 100}%`;

/** CSS clip-path for a piece, in the element's own box. */
export const pieceClip = (poly: readonly Pt[]) =>
  `polygon(${poly.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(', ')})`;

/**
 * Style for one piece of the icon at a pose — clip, origin and transform. Put
 * it on anything that draws the PNG's pixels (an <Img>, or a flat-colour div
 * wearing the PNG as mask-image) and the piece moves exactly as here.
 */
export const beachPieceStyle = (
  id: PieceId,
  pose: BeachPose,
): React.CSSProperties => {
  const piece = BEACH_PIECES.find((p) => p.id === id);
  const clipPath = piece ? pieceClip(piece.poly) : undefined;
  if (id === 'palm') {
    return {
      clipPath,
      transformOrigin: `${pct(PIVOT.x)} ${pct(PIVOT.y)}`,
      transform: `rotate(${pose.palmDeg}deg)`,
    };
  }
  if (id === 'waveUpper' || id === 'waveLower') {
    const {dx, dy} = id === 'waveUpper' ? pose.waveUpper : pose.waveLower;
    // Percent of the element's own box, so the drift scales with iconSize.
    return {clipPath, transform: `translate(${pct(dx)}, ${pct(dy)})`};
  }
  return {clipPath};
};

/** The glitter path, in 512 space. Put it BEHIND the artwork. */
export const BeachGlints: React.FC<{pose: BeachPose; color?: string}> = ({
  pose,
  color = '#000000',
}) => (
  <>
    {pose.glints.map((g) => (
      <line
        key={g.key}
        x1={g.x1}
        y1={g.y}
        x2={g.x2}
        y2={g.y}
        stroke={color}
        strokeWidth={GLINT_STROKE}
        strokeLinecap="round"
        opacity={g.opacity}
      />
    ))}
  </>
);

const layer: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

const BeachIconLoop: React.FC<BeachIconLoopProps> = ({
  icon,
  iconSize,
  glintCount,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const cycle = (frame % durationInFrames) / durationInFrames;
  const pose = beachPose(cycle, liveliness, glintCount);

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          transformOrigin: `${pct(BASE.x)} ${pct(BASE.y)}`,
          transform: `scale(${pose.breath.sx}, ${pose.breath.sy})`,
        }}
      >
        {/* Behind the artwork, so the waves occlude the glints as they lap. */}
        <svg
          style={{...layer, overflow: 'visible'}}
          viewBox={`0 0 ${VIEW} ${VIEW}`}
        >
          <BeachGlints pose={pose} />
        </svg>

        {/* The supplied artwork, never redrawn: five clipped copies. */}
        {BEACH_PIECES.map((piece) => (
          <Img
            key={piece.id}
            src={staticFile(icon)}
            style={{...layer, ...beachPieceStyle(piece.id, pose)}}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default BeachIconLoop;
