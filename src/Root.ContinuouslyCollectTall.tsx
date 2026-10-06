import {Composition} from 'remotion';
import ContinuouslyCollectTall, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ContinuouslyCollectTall';

// Private render entry for Bharat "Project Maven's data problem" cut C
// (ContinuouslyCollectTall, 9:16), so it renders while other builders own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ContinuouslyCollectTall"
      component={ContinuouslyCollectTall}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
