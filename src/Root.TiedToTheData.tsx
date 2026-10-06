import {Composition} from 'remotion';
import TiedToTheData, {DURATION, FPS, defaultProps, schema} from '../generated/components/TiedToTheData';

// Private render entry for the Bharat "Project Maven's data problem" clip,
// cut D (TiedToTheData), so it renders while other builders own src/Root.tsx.
// LANDSCAPE: 1920x1080 (the final is rendered at --scale=2).
export const RemotionRoot = () => {
  return (
    <Composition
      id="TiedToTheData"
      component={TiedToTheData}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
