import {Composition} from 'remotion';
import ThreeOrFourSurvived, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-europe-worst-market/ThreeOrFourSurvived';

// Private render entry for ThreeOrFourSurvived (nik-europe-worst-market; Cheeky Pint style (stout), 3D): 50 bank phones on the Europe slab sink away until four stand, and Revolut's rises amber. Render with --gl=angle.
// Opaque 1080x1920, 23.976 fps, 223 frames.
export const RemotionRoot = () => (
  <Composition
    id="ThreeOrFourSurvived"
    component={ThreeOrFourSurvived}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
