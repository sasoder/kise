import {Composition} from 'remotion';
import PasteurSystematizes, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/PasteurSystematizes';

// Private render entry for PasteurSystematizes (kyle-vaccine; Dwarkesh 3D style): a lone orange flask, then Pasteur sets his flask into a rack and the orange runs through it in order.
// Opaque 1080x1920, 29.97 fps, 106 frames.
export const RemotionRoot = () => (
  <Composition
    id="PasteurSystematizes"
    component={PasteurSystematizes}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
