import {Composition} from 'remotion';
import NoRelevantTargetsTall, {DURATION, FPS, defaultProps, schema} from '../generated/components/NoRelevantTargetsTall';

// Private render entry for Bharat "Project Maven's data problem" cut B, 9:16
// (NoRelevantTargetsTall, 1080x1920), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NoRelevantTargetsTall"
      component={NoRelevantTargetsTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
