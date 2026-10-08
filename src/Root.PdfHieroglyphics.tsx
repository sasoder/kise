import {Composition} from 'remotion';
import PdfHieroglyphics, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PdfHieroglyphics';

// Private render entry for PdfHieroglyphics, so this cut renders while other
// builders own src/Root.tsx. Hadrian 05: "The industry operates basically on
// PDFs full of manufacturing hieroglyphics." A PDF icon rises, the camera
// pushes into the page, and it is a wall of real GD&T. 1080x1920, 24fps, 87
// frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PdfHieroglyphics"
        component={PdfHieroglyphics}
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
