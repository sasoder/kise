import {Composition} from 'remotion';
import ZeroedItDown, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ZeroedItDown';

// Private render entry for cut C of "brent - the mine death count"
// (ZeroedItDown, 1080x1920, 24000/1001 fps), so it renders without
// src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="ZeroedItDown"
      component={ZeroedItDown}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
