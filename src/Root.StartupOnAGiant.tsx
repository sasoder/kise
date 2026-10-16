import {Composition} from 'remotion';
import StartupOnAGiant, {DURATION, FPS, defaultProps, schema} from '../generated/components/meta-talent-density/StartupOnAGiant';

// Private render entry for StartupOnAGiant (Cheeky Pint S4E03 "Talent density beat team size", cut 3;
// stout): opaque 1080x1920 at 23.976 fps, 99-frame slot + 12-frame tail.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="StartupOnAGiant"
        component={StartupOnAGiant}
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
