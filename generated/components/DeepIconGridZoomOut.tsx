import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  icon: z.string(),
  // How many whole icons sit across the frame once the zoom has landed.
  visibleColumns: z.number().int().min(2).max(24),
  // Icon width as a fraction of its cell, i.e. how much air sits between icons.
  iconScale: z.number().min(0.4).max(1),
  // On-screen width of the single centred icon at frame 0. The gap to the frame
  // edge is the "padding" the opening shot needs.
  heroWidth: z.number().min(200).max(1080),
  holdFrames: z.number().int().min(0).max(60),
  zoomFrames: z.number().int().min(6).max(120),
  // How long a single icon takes to fade up once its ring is reached.
  fadeFrames: z.number().int().min(1).max(60),
  // The field keeps easing outwards after the reveal so the hold is not frozen.
  driftScale: z.number().min(0.8).max(1),
});

export type DeepIconGridZoomOutProps = z.infer<typeof schema>;

export const defaultProps: DeepIconGridZoomOutProps = schema.parse({
  icon: 'deep.png',
  visibleColumns: 10,
  iconScale: 0.78,
  // 1080 wide frame, so this leaves 160px of air on each side.
  heroWidth: 760,
  holdFrames: 10,
  zoomFrames: 30,
  fadeFrames: 10,
  driftScale: 0.975,
});

const DeepIconGridZoomOut: React.FC<DeepIconGridZoomOutProps> = ({
  icon,
  visibleColumns,
  iconScale,
  heroWidth,
  holdFrames,
  zoomFrames,
  fadeFrames,
  driftScale,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  const cell = width / visibleColumns;
  const iconSize = cell * iconScale;

  // Odd counts on both axes, so one cell sits exactly on the frame centre and
  // the whole field can be scaled about that cell without drifting off centre.
  // The spare ring on each side covers the outward drift during the hold.
  const toOdd = (n: number) => (n % 2 === 0 ? n + 1 : n);
  const columns = toOdd(visibleColumns + 3);
  const rows = toOdd(Math.ceil(height / cell) + 3);

  const zoomEnd = holdFrames + zoomFrames;
  // Scale is interpolated in log space: a linear ramp from 9x to 1x reads as a
  // violent lurch at the start and a crawl at the end, because equal steps of
  // scale are not equal steps of apparent movement.
  const startScale = heroWidth / iconSize;
  const zoomProgress = interpolate(frame, [holdFrames, zoomEnd], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const landedScale = interpolate(frame, [zoomEnd, durationInFrames], [1, driftScale], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // At the opening scale the four nearest neighbours are already inside the
  // frame, so scale alone cannot hold a single icon on screen. Everything but
  // the centre icon starts invisible and fades up in rings as the pull-back
  // uncovers it, which turns the zoom into the reveal rather than a wide shot
  // that was always there.
  const centreColumn = (columns - 1) / 2;
  const centreRow = (rows - 1) / 2;
  const maxDistance = Math.hypot(centreColumn, centreRow);
  const opacityAt = (column: number, row: number) => {
    const distance = Math.hypot(column - centreColumn, row - centreRow);
    if (distance === 0) {
      return 1;
    }
    // The last ring starts before the zoom lands, so the field is fully up
    // shortly after the movement stops instead of long afterwards.
    const delay = holdFrames + (distance / maxDistance) * zoomFrames * 0.85;
    return interpolate(frame, [delay, delay + fadeFrames], [0, 1], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  return (
    // Overlay asset: no background of any kind, so the icons and the holes
    // inside them carry straight through to whatever sits underneath.
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: columns * cell,
          height: rows * cell,
          scale:
            Math.exp(
              Math.log(startScale) * (1 - zoomProgress) + Math.log(landedScale) * zoomProgress,
            ) + '',
        }}
      >
        {new Array(rows).fill(true).map((_, row) => (
          <div
            key={row}
            style={{
              display: 'flex',
              flexDirection: 'row',
              height: cell,
            }}
          >
            {new Array(columns).fill(true).map((__, column) => (
              <div
                key={column}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: cell,
                  height: cell,
                  opacity: opacityAt(column, row),
                }}
              >
                <Img
                  src={staticFile(icon)}
                  style={{width: iconSize, height: iconSize}}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default DeepIconGridZoomOut;
