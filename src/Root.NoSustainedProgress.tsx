import {Composition} from 'remotion';
import NoSustainedProgress, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-greek-math/NoSustainedProgress';

// Private render entry for NoSustainedProgress (kyle-greek-math; Dwarkesh 3D style): opens on cut C's last frame, cranes up over Euclid's landing where the stair stops; he turns to face the void and a dashed orange stair that was never built is drawn on up into the light.
// Opaque 1080x1920, 29.97 fps, 188 frames.
export const RemotionRoot = () => (
  <Composition
    id="NoSustainedProgress"
    component={NoSustainedProgress}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
