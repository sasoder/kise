import {Composition} from 'remotion';
import SmallSampleCurveV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/SmallSampleCurveV2';

// Private render entry for SmallSampleCurveV2 (cold-review copy; Cheeky Pint S4E02 "will - guinness invented the t-test", cut 2,
// stout B1): opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="SmallSampleCurveV2"
      component={SmallSampleCurveV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
