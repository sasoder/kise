import {Composition} from 'remotion';
import VeryLongTime, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/VeryLongTime';

// Private render entry for VeryLongTime, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard: "...resist European powers for a very
// long time." The Apache country holds while the year runs 1600 -> 1886.
// Dwarkesh map style, 1080x1920, 24fps, 63 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VeryLongTime"
        component={VeryLongTime}
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
