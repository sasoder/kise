import {Composition} from 'remotion';
import OneDoor, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OneDoor';

// Private render entry for Jordan Schneider "Hu Jintao's 25 million jobs",
// graphic B take 2 (OneDoor, delivered as 48_BigSwathsNoJob.mov), so it renders
// while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="OneDoor"
      component={OneDoor}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
