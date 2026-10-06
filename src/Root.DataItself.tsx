import {Composition} from 'remotion';
import DataItself, {DURATION, FPS, defaultProps, schema} from '../generated/components/DataItself';

// Private render entry for Bharat "Project Maven's data problem" cut A
// (DataItself, 1920x1080), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="DataItself"
      component={DataItself}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
