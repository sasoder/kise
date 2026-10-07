import {Composition} from 'remotion';
import LearnedFromHispaniola, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LearnedFromHispaniola';

// Private render entry for LearnedFromHispaniola (the quick Hispaniola cut of Sheppard_Vikings), so
// this cut renders while other builders own src/Root.tsx. Opaque Dwarkesh map
// style, 1080x1920, 24fps, 42 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LearnedFromHispaniola"
        component={LearnedFromHispaniola}
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
