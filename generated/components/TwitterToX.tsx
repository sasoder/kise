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

export const FPS = 24;
export const DURATION = 120;

export const schema = z.object({
  tileSize: z.number().min(120).max(1080),
  crackWidth: z.number().min(1).max(16),
  partDistance: z.number().min(0).max(800),
  liveliness: z.number().min(0).max(2),
  previewBackground: z.string().nullable(),
});

export type TwitterToXProps = z.infer<typeof schema>;

export const defaultProps: TwitterToXProps = schema.parse({
  tileSize: 480,
  crackWidth: 3,
  partDistance: 150,
  liveliness: 1,
  previewBackground: null,
});

// Beats, at 24fps.
const HOLD_END = 24;
const CRACK_END = 34;
const PART_END = 58;
const SHOVE_END = 76; // halves are clear of the frame by here
const X_IN = 34; // the X first shows as black inside the crack
const X_FULL = 84;

// Measured off public/x-tile-ref.png (265x265 png, tile spans 1..263):
// corner radius 30 / tile 263 = 0.114, glyph width 182 / 263 = 0.692.
// The Twitter tile's own radius measures 200 / 2109 = 0.095; the X reference is
// the real mark, so the rebuilt tile uses the X reference's own radius.
const X_VB = 263;
const X_RADIUS = 30;
const GLYPH_SCALE = 182 / 24; // simple-icons path is a 24x24 viewBox
const X_PATH =
  'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z';

const SHADOW = 'drop-shadow(0 18px 24px rgba(0,0,0,0.28))';

// The X tile is rebuilt as vector so it stays crisp at 640px.
const XTile: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox={`0 0 ${X_VB} ${X_VB}`}>
    <rect
      x={0}
      y={0}
      width={X_VB}
      height={X_VB}
      rx={X_RADIUS}
      ry={X_RADIUS}
      fill="#000000"
    />
    <g
      transform={`translate(${X_VB / 2 - 12 * GLYPH_SCALE} ${
        X_VB / 2 - 11.9995 * GLYPH_SCALE
      }) scale(${GLYPH_SCALE})`}
    >
      <path d={X_PATH} fill="#FFFFFF" />
    </g>
  </svg>
);

// Exported so the clearance between the parting halves and the emerging X tile
// can be checked frame by frame without rendering.
export const geometry = (frame: number, props: TwitterToXProps) => {
  const {tileSize, partDistance, liveliness} = props;
  const half = tileSize / 2;

  // Halves travel perpendicular to the cut: the top-right half by (+d, -d),
  // the bottom-left half by (-d, +d). One motion: a slow open, then the growing
  // X shoves them out of frame.
  const open = interpolate(frame, [CRACK_END, PART_END], [0, partDistance * liveliness], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shoveT = interpolate(frame, [PART_END, SHOVE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'extend',
  });
  const shove = shoveT <= 0 ? 0 : (900 - partDistance * liveliness) * shoveT * shoveT;
  // Capped once they are far outside the frame, so the numbers stay sane.
  const dist = Math.min(open + shove, 1600);

  const spin = Math.min(1, Math.max(0, shoveT)) ** 2;
  // Each half tips away from the cut: 0 at the moment it splits, 5 deg by the
  // end of the open, carrying on to 28 deg as it is shoved out.
  const tilt = interpolate(frame, [CRACK_END, PART_END], [0, 5], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rot = (tilt + 23 * spin) * liveliness;

  // X tile: a black sliver inside the crack, then up and out to full size.
  const scale =
    frame < X_IN
      ? 0
      : frame < 40
        ? interpolate(frame, [X_IN, 40], [0.18, 0.45])
        : interpolate(frame, [40, X_FULL], [0.45, 1], {
            easing: Easing.inOut(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
  const rise = interpolate(frame, [40, X_FULL], [40, 0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return {dist, rot, scale, rise, half, xHalf: half * scale};
};

const TwitterToX: React.FC<TwitterToXProps> = (props) => {
  const {tileSize, crackWidth, previewBackground} = props;
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const {dist, rot, scale, rise} = geometry(frame, props);

  // One twitch as the tile gives: a kick on frame 24 that settles by 27. Dead
  // zero before frame 24 — the hold is a still.
  const shudder =
    frame < HOLD_END
      ? 0
      : interpolate(frame, [HOLD_END, HOLD_END + 3], [1, 0], {
          easing: Easing.out(Easing.quad),
          extrapolateRight: 'clamp',
        });
  const twitchX = 3 * shudder;
  const twitchY = -2.4 * shudder;
  const twitchRot = 0.6 * shudder;

  // The crack draws out from the centre along the corner-to-corner diagonal.
  const crack = interpolate(frame, [HOLD_END, CRACK_END], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const crackOpacity = interpolate(frame, [CRACK_END, CRACK_END + 3], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const reach = (tileSize / 2) * crack;

  const split = frame >= CRACK_END;

  const tileBox: React.CSSProperties = {
    position: 'absolute',
    left: (width - tileSize) / 2,
    top: (height - tileSize) / 2,
    width: tileSize,
    height: tileSize,
  };

  const img = (
    <Img
      src={staticFile('twitter-tile.png')}
      style={{width: '100%', height: '100%', display: 'block'}}
    />
  );

  return (
    <AbsoluteFill
      style={previewBackground ? {backgroundColor: previewBackground} : undefined}
    >
      {/* The X sits behind the halves and comes up through the gap. */}
      {scale > 0 ? (
        <div
          style={{
            ...tileBox,
            transformOrigin: '50% 50%',
            transform: `translateY(${rise}px) scale(${scale})`,
            filter: SHADOW,
          }}
        >
          <XTile size={tileSize} />
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `${width / 2}px ${height / 2}px`,
          transform: `translate(${twitchX}px, ${twitchY}px) rotate(${twitchRot}deg)`,
        }}
      >
        {split ? (
          <>
            {/* Bottom-left half: down-left, rotating away from the cut. */}
            <div
              style={{
                ...tileBox,
                clipPath: `polygon(1px -1px, calc(100% + 1px) calc(100% - 1px), 100% 100%, 0% 100%)`,
                transformOrigin: `${tileSize / 3}px ${(tileSize * 2) / 3}px`,
                transform: `translate(${-dist}px, ${dist}px) rotate(${-rot}deg)`,
                filter: SHADOW,
              }}
            >
              {img}
            </div>
            {/* Top-right half: up-right. */}
            <div
              style={{
                ...tileBox,
                clipPath: `polygon(-1px 1px, 100% 0%, 100% 100%, calc(100% - 1px) calc(100% + 1px))`,
                transformOrigin: `${(tileSize * 2) / 3}px ${tileSize / 3}px`,
                transform: `translate(${dist}px, ${-dist}px) rotate(${rot}deg)`,
                filter: SHADOW,
              }}
            >
              {img}
            </div>
          </>
        ) : (
          <div style={{...tileBox, filter: SHADOW}}>{img}</div>
        )}

        {crackOpacity > 0 ? (
          <svg
            style={{position: 'absolute', inset: 0, width, height}}
            viewBox={`0 0 ${width} ${height}`}
          >
            <line
              x1={width / 2 - reach}
              y1={height / 2 - reach}
              x2={width / 2 + reach}
              y2={height / 2 + reach}
              stroke="#000000"
              strokeWidth={crackWidth}
              strokeLinecap="square"
              opacity={crackOpacity}
            />
          </svg>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default TwitterToX;
