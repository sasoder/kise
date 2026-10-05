import {Composition} from 'remotion';
import SameBudgets, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SameBudgets';

// Private render entry for SameBudgets (Toto Wolff, "how he got the Mercedes job", Cheeky Pint S4E01), so
// this cut renders while other builders own src/Root.tsx. One world: mercJobShared.tsx.
// Opaque, 1080x1920 (9:16), 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SameBudgets"
        component={SameBudgets}
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
