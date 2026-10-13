import {Composition} from 'remotion';
import AllTheOtherParts, {DURATION, FPS, defaultProps, schema} from '../generated/components/AllTheOtherParts';

// Private render entry for AllTheOtherParts (Cheeky Pint S4E03 Meta, "what frontier AI training costs",
// cut 2; stout style): opaque 1080x1920 at 23.976 fps, 159 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AllTheOtherParts"
        component={AllTheOtherParts}
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
