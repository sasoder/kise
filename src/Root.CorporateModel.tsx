import {Composition} from 'remotion';
import CorporateModel, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CorporateModel';

// Private render entry for CorporateModel (Toto Wolff, "how he got the Mercedes job", Cheeky Pint
// S4E01): "the corporate running a Formula One team doesn't function". One world: mercJobShared.tsx.
// Opaque, 1080x1920 (9:16), 24fps, 118 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CorporateModel"
        component={CorporateModel}
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
