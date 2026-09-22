import {Composition} from 'remotion';
import FollowerCount, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FollowerCount';

// Private render entry for FollowerCount, so this piece renders while other
// builders own src/Root.tsx. Native screenshot size, 1179x2556 at 24fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="FollowerCount"
      component={FollowerCount}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      // The screenshot's native width. Odd on purpose: the deliverable is
      // ProRes, which has no even-dimension constraint.
      // eslint-disable-next-line @remotion/even-dimensions
      width={1179}
      height={2556}
    />
  );
};
