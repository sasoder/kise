import {Composition} from 'remotion';
import ResignForm, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/ResignForm';

// Private render entry for ResignForm (caro-firing-moses; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 119 frames.
export const RemotionRoot = () => (
  <Composition
    id="ResignForm"
    component={ResignForm}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
