import {Composition} from 'remotion';
import IncreasinglyCapable, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/IncreasinglyCapable';

// Private render entry for IncreasinglyCapable, the third cut of Noam_Children.
// It returns to the standing picture at world time 307 + f and turns cut 2's one
// threshold into a ladder of three: each tier's comets are bigger, wider and
// faster, and the flow obeys continuity so the ladder never fuses. A person
// outline half-draws itself over one comet and is taken back.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IncreasinglyCapable"
        component={IncreasinglyCapable}
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
