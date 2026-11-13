import {Composition} from 'remotion';
import UltraOnTop, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-any-idea/UltraOnTop';

// Private render entry for UltraOnTop (nik-any-idea; Cheeky Pint style (stout)): the Ultra card rises from behind Revolut's plan ladder and lands on top of Metal.
// Opaque 1080x1920, 23.976 fps, 120 frames.
export const RemotionRoot = () => (
  <Composition
    id="UltraOnTop"
    component={UltraOnTop}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
