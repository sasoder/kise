import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:00.000 -> 00:00:04.799 of the source cut.
export const DURATION = 144;

const CANVAS_W = 1080;
const CANVAS_H = 1920;

// Cluster the survivors resolve into: three across, as many rows as needed.
const CLUSTER_COLS = 3;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
// Stable per-tile scatter — same value every frame, so nothing flickers.
const hash = (i: number) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  cols: z.number().int().min(2).max(12),
  rows: z.number().int().min(2).max(16),
  tile: z.number().min(40).max(240),
  gap: z.number().min(4).max(120),
  radiusRatio: z.number().min(0).max(0.5),
  litOpacity: z.number().min(0).max(1),
  dimOpacity: z.number().min(0).max(1),
  // How far a culled tile shrinks: the cull is encoded twice, dimmer and smaller.
  cullScale: z.number().min(0.2).max(1),
  clusterScale: z.number().min(1).max(1.6),
  // Softness of the wavefront edge, in px. Tiles inside it cross over gradually.
  waveFalloff: z.number().min(40).max(600),
  survivors: z
    .array(z.object({col: z.number().int(), row: z.number().int()}))
    .min(1)
    .max(12),
  // Beat frames lifted from the SRT at 30fps:
  //   0 "there's a lot of SaaS applications" · 49 "not sure they're all"
  //   78 "strictly necessary" · 106 "and worth the price"
  beats: z.object({
    fill: z.number().int(),
    wave: z.number().int(),
    waveEnd: z.number().int(),
    resolve: z.number().int(),
  }),
});

export type SaasNotAllNecessaryProps = z.infer<typeof schema>;

export const defaultProps: SaasNotAllNecessaryProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#FFC543',
  shadow: 'rgba(0, 0, 0, 0.28)',
  cols: 6,
  rows: 8,
  tile: 120,
  gap: 28,
  radiusRatio: 0.22,
  litOpacity: 0.85,
  dimOpacity: 0.1,
  cullScale: 0.56,
  clusterScale: 1.15,
  waveFalloff: 210,
  // Spread through the grid so the wave keeps turning up another one.
  survivors: [
    {col: 1, row: 1},
    {col: 4, row: 2},
    {col: 2, row: 4},
    {col: 5, row: 5},
    {col: 0, row: 6},
    {col: 3, row: 7},
  ],
  beats: {fill: -12, wave: 47, waveEnd: 104, resolve: 106},
});

const SaasNotAllNecessary: React.FC<SaasNotAllNecessaryProps> = ({
  ink,
  accent,
  shadow,
  cols,
  rows,
  tile,
  gap,
  radiusRatio,
  litOpacity,
  dimOpacity,
  cullScale,
  clusterScale,
  waveFalloff,
  survivors,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const step = tile + gap;
  const gridW = cols * step - gap;
  const gridH = rows * step - gap;
  const gridX = (CANVAS_W - gridW) / 2;
  const gridY = (CANVAS_H - gridH) / 2;
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const rx = tile * radiusRatio;

  const homeX = (col: number) => gridX + col * step;
  const homeY = (row: number) => gridY + row * step;
  const distOf = (col: number, row: number) =>
    Math.hypot(homeX(col) + tile / 2 - cx, homeY(row) + tile / 2 - cy);

  const maxDist = distOf(0, 0);

  // The wavefront is the only clock for the cull: every tile's state is read off
  // this radius, so retiming the beat can never desync the tiles from the ring.
  // Linear on purpose. Eased, the front crawls for half a second after the
  // beat and then eats the outer ring all at once; linear keeps tiles going
  // out at a steady rate the whole way across.
  const wavePhase = interpolate(frame, [beats.wave, beats.waveEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const radius = wavePhase * (maxDist + waveFalloff);
  const passed = (d: number) => smooth(clamp01((radius - d) / waveFalloff));

  const ringOpacity =
    0.42 *
    clamp01(radius / 90) *
    (1 - smooth(clamp01((radius - maxDist * 0.95) / (maxDist * 0.25))));

  // Once the survivors take over, the culled field steps back further so the
  // accent has somewhere to exist.
  const recede = interpolate(frame, [beats.resolve, beats.resolve + 18], [1, 0.58], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const survivorIndex = new Map<string, number>();
  survivors.forEach((s, i) => survivorIndex.set(`${s.col},${s.row}`, i));

  // Slots are handed out top-to-bottom, then left-to-right within a row, so the
  // six paths into the cluster never cross each other.
  const clusterRows = Math.ceil(survivors.length / CLUSTER_COLS);
  const cTile = tile * clusterScale;
  const cStep = cTile + gap * 1.4;
  const cW = Math.min(CLUSTER_COLS, survivors.length) * cStep - gap * 1.4;
  const cH = clusterRows * cStep - gap * 1.4;
  const cX = (CANVAS_W - cW) / 2;
  const cY = (CANVAS_H - cH) / 2;

  const ordered = survivors
    .map((s, i) => ({...s, i}))
    .sort((a, b) => a.row - b.row || a.col - b.col);
  const slotFor = new Map<number, {x: number; y: number}>();
  for (let band = 0; band < clusterRows; band++) {
    const inBand = ordered
      .slice(band * CLUSTER_COLS, (band + 1) * CLUSTER_COLS)
      .sort((a, b) => a.col - b.col);
    inBand.forEach((s, k) => {
      slotFor.set(s.i, {x: cX + k * cStep, y: cY + band * cStep});
    });
  }

  const tiles: React.ReactElement[] = [];
  const lifted: React.ReactElement[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const sIdx = survivorIndex.get(`${col},${row}`);
      const isSurvivor = sIdx !== undefined;

      // Fills roughly top-down with a little scatter, landing the last tile on
      // the word "applications".
      const delay = beats.fill + row * 4.8 + hash(idx) * 8;
      const enter = interpolate(frame, [delay, delay + 12], [0, 1], {
        easing: Easing.bezier(0.2, 1.4, 0.35, 1),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      if (enter <= 0) {
        continue;
      }

      const d = distOf(col, row);
      const p = passed(d);
      // Bump peaks as the wavefront crosses this tile, so a survivor visibly
      // takes the hit and stays standing.
      const bump = 4 * p * (1 - p);

      let x = homeX(col);
      let y = homeY(row);
      let size = tile;
      let opacity = 0;
      let fill = ink;

      if (isSurvivor) {
        const lift = spring({
          frame: frame - (beats.resolve + sIdx * 2),
          fps,
          config: {damping: 22, mass: 1, stiffness: 90},
          durationInFrames: 30,
        });
        const slot = slotFor.get(sIdx) as {x: number; y: number};
        const scale = (1 + 0.07 * bump) * (1 + (clusterScale - 1) * lift);
        size = tile * scale;
        x = homeX(col) + (slot.x - homeX(col)) * lift - (size - tile) / 2;
        y = homeY(row) + (slot.y - homeY(row)) * lift - (size - tile) / 2;
        const tint = interpolate(
          frame,
          [beats.resolve + sIdx * 2, beats.resolve + sIdx * 2 + 10],
          [0, 1],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );
        fill = interpolateColors(tint, [0, 1], [ink, accent]);
        opacity = (litOpacity + (0.97 - litOpacity) * Math.max(bump, lift)) * enter;
      } else {
        const scale = 1 + (cullScale - 1) * p;
        size = tile * scale;
        x = homeX(col) + (tile - size) / 2;
        y = homeY(row) + (tile - size) / 2;
        opacity = (litOpacity + (dimOpacity - litOpacity) * p) * enter * (p > 0 ? recede : 1);
      }

      const el = (
        <rect
          key={`t${idx}`}
          x={x}
          y={y - (1 - enter) * 34}
          width={size}
          height={size}
          rx={rx * (size / tile)}
          fill={fill}
          opacity={opacity}
        />
      );
      if (isSurvivor) {
        lifted.push(el);
      } else {
        tiles.push(el);
      }
    }
  }

  return (
    <AbsoluteFill>
      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
      >
        {tiles}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={ink}
          strokeWidth={3}
          opacity={ringOpacity}
        />
        {lifted}
      </svg>
    </AbsoluteFill>
  );
};

export default SaasNotAllNecessary;
