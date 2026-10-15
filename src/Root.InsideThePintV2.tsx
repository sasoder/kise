import {Composition} from 'remotion';
import InsideThePintV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/InsideThePintV2';

// Private render entry for InsideThePintV2 (Cheeky Pint S4E02 "will - guinness invented the t-test", cut 1, stout):
// opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="InsideThePintV2"
      component={InsideThePintV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
