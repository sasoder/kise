import {Composition} from 'remotion';
import PoolingAssets, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PoolingAssets';

// Private render entry for PoolingAssets, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard: "...the most raw, unbridled
// capitalism at its finest, pooling assets to derive enormous profits".
// Dwarkesh map style (non-map page), 1080x1920, 24000/1001 fps, 206 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PoolingAssets"
        component={PoolingAssets}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
