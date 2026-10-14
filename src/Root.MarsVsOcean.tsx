import {Composition} from 'remotion';
import MarsVsOcean, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/MarsVsOcean';

// Private render entry for MarsVsOcean (Cheeky Pint S4E02, "surface of Mars than
// the depths of our ocean"): opaque 1080x1920 at 23.976 fps, 79 frames
// (67 + 12 handle). Render with --gl=angle (WebGL globes).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MarsVsOcean"
        component={MarsVsOcean}
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
