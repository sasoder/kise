import {Composition} from 'remotion';
import NoEyesOnIt, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/will-mars-ocean/NoEyesOnIt';

// Private render entry for NoEyesOnIt (Cheeky Pint S4E02, "no eyes on it"): opaque 1080x1920 at
// 23.976 fps, 147 frames (135 + a 12-frame hold handle). Render with --gl=angle (WebGL2 globe).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NoEyesOnIt"
        component={NoEyesOnIt}
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
