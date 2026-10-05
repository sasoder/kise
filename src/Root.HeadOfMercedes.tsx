import {Composition} from 'remotion';
import HeadOfMercedes, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HeadOfMercedes';

// Private render entry for HeadOfMercedes (Toto Wolff, "how he got the Mercedes job", Cheeky Pint S4E01), so
// this cut renders while other builders own src/Root.tsx. One world: mercJobShared.tsx (Act B: mercJobActB.tsx).
// Opaque, 1920x1080 (the Premiere sequence), 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HeadOfMercedes"
        component={HeadOfMercedes}
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
