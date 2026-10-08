import {Composition} from 'remotion';
import ThreeYearsBefore, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ThreeYearsBefore';

// Private render entry for ThreeYearsBefore (cut 1 of Si Sheppard "Texcoco"):
// "three years before Cortés arrived in Mesoamerica". Dwarkesh map style on the
// Cortés world; opaque 1080x1920, 23.976 fps, 52 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ThreeYearsBefore"
        component={ThreeYearsBefore}
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
