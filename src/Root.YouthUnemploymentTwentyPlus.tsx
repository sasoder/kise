import {Composition} from 'remotion';
import YouthUnemploymentTwentyPlus, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/YouthUnemploymentTwentyPlus';

// Private render entry for Jordan Schneider "Hu Jintao's 25 million jobs",
// graphic A (17_YouthUnemploymentTwentyPlus), so it renders while other
// builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="YouthUnemploymentTwentyPlus"
      component={YouthUnemploymentTwentyPlus}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
