import {Composition} from 'remotion';
import Hydra, {DURATION, FPS, defaultProps, schema} from '../generated/components/caro-firing-moses/Hydra';

// Private render entry for Hydra (caro-firing-moses; Dwarkesh style): the three hydra acts on one timeline under one living camera, with the eye count-off and the snip flinch.
// Opaque 1080x1920, 24 fps, 366 frames.
export const RemotionRoot = () => (
  <Composition
    id="Hydra"
    component={Hydra}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
