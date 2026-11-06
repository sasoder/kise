import {Composition} from 'remotion';
import OrgWorldProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/OrgWorldProbe';

// Private render entry for OrgWorldProbe (toto-twenty-person; Cheeky Pint style (stout)): stills of the shared
// world (orgWorld.tsx) at RECAP and each team's HOME. Opaque 1080x1920, 25 fps, 1 frame.
export const RemotionRoot = () => (
  <Composition
    id="OrgWorldProbe"
    component={OrgWorldProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
