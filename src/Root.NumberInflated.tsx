import {Composition} from 'remotion';
import NumberInflated, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NumberInflated';

// Private render entry for cut B of "brent - the mine death count"
// (NumberInflated, 1080x1920, 24000/1001 fps), so it renders without
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NumberInflated"
      component={NumberInflated}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
