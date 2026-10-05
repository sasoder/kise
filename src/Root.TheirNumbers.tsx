import {Composition} from 'remotion';
import TheirNumbers, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TheirNumbers';

// Private render entry for TheirNumbers (Toto Wolff, "how he got the Mercedes job", Cheeky Pint S4E01), so
// this cut renders while other builders own src/Root.tsx. One world: mercJobShared.tsx.
// Opaque, 1080x1920 (9:16), 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TheirNumbers"
        component={TheirNumbers}
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
