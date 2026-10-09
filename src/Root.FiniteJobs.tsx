import {Composition} from 'remotion';
import FiniteJobs, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FiniteJobs';

// Private render entry for Jordan Schneider "Hu Jintao's 25 million jobs",
// graphic 48 take 3 (FiniteJobs), so it renders while other builders own
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="FiniteJobs"
      component={FiniteJobs}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
