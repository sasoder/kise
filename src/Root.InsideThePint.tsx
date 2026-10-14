import {Composition} from 'remotion';
import InsideThePint, {DURATION, FPS, defaultProps, schema} from '../generated/components/InsideThePint';

// Private render entry for InsideThePint (Cheeky Pint S4E02 "will - guinness invented the t-test", cut 1, stout):
// opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="InsideThePint"
      component={InsideThePint}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
