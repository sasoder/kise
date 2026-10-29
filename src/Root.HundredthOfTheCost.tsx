import {Composition} from 'remotion';
import HundredthOfTheCost, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-navier-stokes/HundredthOfTheCost';

// Private render entry for HundredthOfTheCost (sam-navier-stokes; Cheeky Pint style (stout)): the 3D Navier-Stokes vortex in vortexSky's air world; a sky-scale mound of 100 cash bundles beside it sinks to one lit bundle, the date tick rolls SEPT 2026 -> 2027. Render with --gl=angle.
// Opaque 1080x1920, 23.976 fps, 96 frames.
export const RemotionRoot = () => (
  <Composition
    id="HundredthOfTheCost"
    component={HundredthOfTheCost}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
