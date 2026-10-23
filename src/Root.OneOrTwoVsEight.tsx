import {Composition} from 'remotion';
import OneOrTwoVsEight, {
  DURATION,
  FPS,
  OneOrTwoProbe,
  PROBE_DURATION,
  defaultProps,
  schema,
} from '../generated/components/zach-superpower/OneOrTwoVsEight';

// Private render entry for OneOrTwoVsEight (zach-superpower; Core memory podcast style): America's two take off,
// eight identical copies are stamped down onto the ground and stay there.
// Opaque 1080x1920, 23.976 fps, 183 frames. OneOrTwoVsEightProbe = glyph stills (jet angles, plume).
export const RemotionRoot = () => (
  <>
    <Composition
      id="OneOrTwoVsEight"
      component={OneOrTwoVsEight}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="OneOrTwoVsEightProbe"
      component={OneOrTwoProbe}
      durationInFrames={PROBE_DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
