import {Composition} from 'remotion';
import TraditionalTechCompanies, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-neobanks-us/TraditionalTechCompanies';

// Private render entry for TraditionalTechCompanies (nik-neobanks-us; Cheeky Pint style (stout)): a push into the Apple Park still as the Google, Apple and Meta tiles rise out of the courtyard.
// Transparent overlay 1080x1920, 23.976 fps, 87 frames.
export const RemotionRoot = () => (
  <Composition
    id="TraditionalTechCompanies"
    component={TraditionalTechCompanies}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
