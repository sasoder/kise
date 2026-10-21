import {Composition} from 'remotion';
import HugeWorldOfBacteria, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-pandemics/HugeWorldOfBacteria';

// Private render entry for HugeWorldOfBacteria (kyle-pandemics; Dwarkesh map style): a low dolly through a world of cream bacteria to one orange TB rod, a crane up to the horizon, a macrophage swallows the rod.
// Opaque 1080x1920, 29.97 fps, 235 frames.
export const RemotionRoot = () => (
  <Composition
    id="HugeWorldOfBacteria"
    component={HugeWorldOfBacteria}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
