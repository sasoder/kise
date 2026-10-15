import {Composition} from 'remotion';
import FiftyKVsFiveMillionV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/FiftyKVsFiveMillionV2';

// Private render entry for FiftyKVsFiveMillionV2 (Cheeky Pint S4E02 "will - $50k drone vs $5m navy drone", cut 3, V2 improvement loop,
// stout): opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="FiftyKVsFiveMillionV2"
      component={FiftyKVsFiveMillionV2}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
