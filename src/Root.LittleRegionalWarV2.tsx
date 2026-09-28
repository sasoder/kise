import {Composition} from 'remotion';
import LittleRegionalWarV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LittleRegionalWarV2';

// Private render entry for LittleRegionalWarV2: the fixed-framing (no camera)
// version of LittleRegionalWar. Sarah Paine, in-point 3.60 s. TRANSPARENT 1914
// land-only overlay, 1080x1920, 24 fps, 192 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LittleRegionalWarV2"
        component={LittleRegionalWarV2}
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
