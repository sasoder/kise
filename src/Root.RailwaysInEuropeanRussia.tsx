import {Composition} from 'remotion';
import RailwaysInEuropeanRussia, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/RailwaysInEuropeanRussia';

// Private render entry for RailwaysInEuropeanRussia, so this cut renders while
// other builders own src/Root.tsx. Sarah Paine: the war money would have built
// railways in European Russia, "really helpful fighting World War I". Opaque
// vintage map, 1080x1920, 24fps, 270 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="RailwaysInEuropeanRussia"
        component={RailwaysInEuropeanRussia}
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
