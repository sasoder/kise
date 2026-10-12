import {Composition} from 'remotion';
import LonelyMessage, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LonelyMessage';

// Private render entry for "LonelyMessage" (CM_EARLY_JS trailer, 16:9 round:
// 2048x1080, 24000/1001 fps; final at --scale 2 = 4096x2160), so it renders
// without src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="LonelyMessage"
      component={LonelyMessage}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={2048}
      height={1080}
    />
  );
};
