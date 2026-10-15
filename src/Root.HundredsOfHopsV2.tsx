import {Composition} from 'remotion';
import HundredsOfHopsV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/HundredsOfHopsV2';

// Private render entry for HundredsOfHopsV2 (cold-review pass on HundredsOfHops; Cheeky Pint S4E02 "will -
// guinness invented the t-test", stout): opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="HundredsOfHopsV2"
      component={HundredsOfHopsV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
