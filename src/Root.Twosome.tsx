import {Composition} from 'remotion';
import Twosome, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/Twosome';

// Private render entry for Twosome (Sarah Paine, Korea clip, cut 1:
// "and he thinks if it's just a twosome that he can win that thing").
// Opaque, 1080x1920, 24fps, 4.375 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Twosome"
        component={Twosome}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
