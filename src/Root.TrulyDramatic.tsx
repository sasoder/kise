import {Composition} from 'remotion';
import TrulyDramatic, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TrulyDramatic';

// Private render entry for the Logan Wright growth clip (TrulyDramatic, S 829-1087),
// so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="TrulyDramatic"
      component={TrulyDramatic}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
