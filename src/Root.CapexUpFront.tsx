import {Composition} from 'remotion';
import CapexUpFront, {DURATION, FPS, defaultProps, schema} from '../generated/components/CapexUpFront';

// Private render entry for CapexUpFront (Cheeky Pint S4E03 Meta, "what frontier AI training costs",
// cut 1; stout style): opaque 1080x1920 at 23.976 fps, 147 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CapexUpFront"
        component={CapexUpFront}
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
