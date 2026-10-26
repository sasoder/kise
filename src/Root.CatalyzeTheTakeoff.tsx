import {Composition} from 'remotion';
import CatalyzeTheTakeoff, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/CatalyzeTheTakeoff';

// Private render entry for CatalyzeTheTakeoff (kyle-rome-industrial; Dwarkesh 3D style): a crane up from Rome's street to the orange-lit ramp of industry.
// Opaque 1080x1920, 29.97 fps, 131 frames.
export const RemotionRoot = () => (
  <Composition
    id="CatalyzeTheTakeoff"
    component={CatalyzeTheTakeoff}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
