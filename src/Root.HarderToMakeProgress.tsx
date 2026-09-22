import {Composition} from 'remotion';
import HarderToMakeProgress, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HarderToMakeProgress';

// Private render entry for HarderToMakeProgress (Noam_Challenge_The_Model, cut
// 5), so this cut renders while other builders own src/Root.tsx. Orange
// Dwarkesh on the grid background: the model answers the last question the
// column held and the camera pulls up to show that the next one is a whole
// screen away. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HarderToMakeProgress"
        component={HarderToMakeProgress}
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
