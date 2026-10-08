import {Composition} from 'remotion';
import GaveTheTitle, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GaveTheTitle';
import TexcocoSheet from '../generated/components/TexcocoSheet';

// Private render entry for GaveTheTitle (Si Sheppard, "Texcoco"): Moctezuma
// steps in between the two brothers and sets the diadem of Texcoco on one of
// them. Opaque umber page, 1080x1920, 23.976 fps, 95 frames. TexcocoSheetPages
// is the review sheet of the texcocoFigures cast (frame = page).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GaveTheTitle"
        component={GaveTheTitle}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="TexcocoSheetPages" component={TexcocoSheet} durationInFrames={8} fps={24} width={1080} height={1920} />
    </>
  );
};
