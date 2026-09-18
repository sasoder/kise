import {Composition} from 'remotion';
import ChainOfThought, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ChainOfThought';

// Private render entry for ChainOfThought, the fourth cut of Noam_Children. Same
// world, on the ladder at world time 630 + f: three comets veer off the stream,
// each gets the white ring that means we see it, and each grows a chain of
// orange beads ahead of it along the path it means to take.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ChainOfThought"
        component={ChainOfThought}
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
