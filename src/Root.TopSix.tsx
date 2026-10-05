import {Composition} from 'remotion';
import TopSix, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TopSix';

// Private render entry for TopSix (Toto Wolff, "how he got the Mercedes job", Cheeky Pint S4E01), so
// this cut renders while other builders own src/Root.tsx. One world: mercJobShared.tsx.
// Opaque, 1080x1920 (9:16), 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TopSix"
        component={TopSix}
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
