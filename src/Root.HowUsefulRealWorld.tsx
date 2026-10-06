import {Composition} from 'remotion';
import HowUsefulRealWorld, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HowUsefulRealWorld';

// Private render entry for the Bharat synthetic-data clip, cut A
// (3_HowUsefulRealWorld), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="HowUsefulRealWorld"
      component={HowUsefulRealWorld}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
