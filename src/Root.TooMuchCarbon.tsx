import {Composition} from 'remotion';
import TooMuchCarbon, {DURATION, FPS, defaultProps, schema} from '../generated/components/neal-stephenson-trailer/TooMuchCarbon';

// Private render entry for TooMuchCarbon (neal-stephenson-trailer; Core memory podcast style): opens on cut 18's last frame, pans right along the
// same paper to a second graph, and the Mauna Loa CO2 record (every month, 1958-2026) draws in, sawtooth and all.
// Opaque 1920x1080, 23.976 fps, 110 frames.
export const RemotionRoot = () => (
  <Composition
    id="TooMuchCarbon"
    component={TooMuchCarbon}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
