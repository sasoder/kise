import {Composition} from 'remotion';
import OthersWantOurCompute, {DURATION, FPS, defaultProps, schema} from '../generated/components/meta-ai-bet/OthersWantOurCompute';

// Private render entry for OthersWantOurCompute (Cheeky Pint S4E03 Meta, "what frontier AI training
// costs"; stout style): opaque 1080x1920 at 23.976 fps, 187 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OthersWantOurCompute"
        component={OthersWantOurCompute}
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
