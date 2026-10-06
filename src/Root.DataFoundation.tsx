import {Composition} from 'remotion';
import DataFoundation, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/DataFoundation';

// Private render entry for Bharat "Project Maven's data problem" V3 cut A
// (DataFoundation), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="DataFoundation"
      component={DataFoundation}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
