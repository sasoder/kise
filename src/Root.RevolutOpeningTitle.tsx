import {Composition} from 'remotion';
import RevolutOpeningTitle, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-products-opening/RevolutOpeningTitle';

// Private render entry for RevolutOpeningTitle (nik-products-opening; Cheeky Pint style (stout)): cream title across the split-screen divider.
// Transparent overlay 1080x1920, 23.976 fps, 94 frames.
export const RemotionRoot = () => (
  <Composition
    id="RevolutOpeningTitle"
    component={RevolutOpeningTitle}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
