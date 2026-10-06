import {Composition} from 'remotion';
import NoRelevantTargets, {DURATION, FPS, defaultProps, schema} from '../generated/components/NoRelevantTargets';

// Private render entry for Bharat "Project Maven's data problem" cut B
// (NoRelevantTargets, 1920x1080), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NoRelevantTargets"
      component={NoRelevantTargets}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
