import {Composition} from 'remotion';
import SmallSampleCurve, {DURATION, FPS, defaultProps, schema} from '../generated/components/SmallSampleCurve';

// Private render entry for SmallSampleCurve (Cheeky Pint S4E02 "will - guinness invented the t-test", cut 2,
// stout B1): opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="SmallSampleCurve"
      component={SmallSampleCurve}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
