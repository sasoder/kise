import {Composition} from 'remotion';
import IAmBeingObservedO55, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/IAmBeingObservedO55';

// Private render entry for IAmBeingObservedO55 (Noam_Punishing_AIs, cut 8 of 8,
// O55 rebuild): the model stops, the reader comes down on it, it writes the bad
// thought, and the thought presses flat only under the reader's line.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IAmBeingObservedO55"
        component={IAmBeingObservedO55}
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
