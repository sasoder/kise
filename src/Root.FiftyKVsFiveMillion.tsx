import {Composition} from 'remotion';
import FiftyKVsFiveMillion, {DURATION, FPS, defaultProps, schema} from '../generated/components/FiftyKVsFiveMillion';

// Private render entry for FiftyKVsFiveMillion (Cheeky Pint S4E02 "will - $50k drone vs $5m navy drone", cut 3,
// stout): opaque 1080x1920 at 23.976 fps.
export const RemotionRoot = () => {
  return (
    <Composition
      id="FiftyKVsFiveMillion"
      component={FiftyKVsFiveMillion}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
