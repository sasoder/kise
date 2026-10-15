import {Composition} from 'remotion';
import NoEyesOnItV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NoEyesOnItV2';

// Private render entry for NoEyesOnItV2 (Cheeky Pint S4E02, "no eyes on it"): opaque 1080x1920 at
// 23.976 fps, 147 frames (135 + a 12-frame hold handle). Render with --gl=angle (WebGL2 globe).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NoEyesOnItV2"
        component={NoEyesOnItV2}
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
