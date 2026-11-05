import {Composition} from 'remotion';
import TechLogosPop, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-neobanks-us/TechLogosPop';

// Private render entry for TechLogosPop (nik-neobanks-us; Cheeky Pint style (stout)): Google, Apple and Meta tiles pop in over the courtyard, logos only.
// Transparent overlay 1080x1920, 23.976 fps, 87 frames.
export const RemotionRoot = () => (
  <Composition
    id="TechLogosPop"
    component={TechLogosPop}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
