import {Composition} from 'remotion';
import ContinuouslyCollect, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ContinuouslyCollect';

// Private render entry for Bharat "Project Maven's data problem" cut C
// (ContinuouslyCollect, 16:9), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ContinuouslyCollect"
      component={ContinuouslyCollect}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
