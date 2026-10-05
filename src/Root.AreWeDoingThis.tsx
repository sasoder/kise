import {Composition} from 'remotion';
import AreWeDoingThis, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AreWeDoingThis';

// Private render entry for AreWeDoingThis, so this cut renders while other
// builders own src/Root.tsx. Toto Wolff / Cheeky Pint S4E01, "...against
// Ferrari, so I sat down with my colleague of Ferrari and said, are we doing
// this?": Mercedes and Ferrari race, rest short of the trophy, and the show's
// light slides up and waits. Opaque, 1920x1080, 24fps, 128 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AreWeDoingThis"
        component={AreWeDoingThis}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
