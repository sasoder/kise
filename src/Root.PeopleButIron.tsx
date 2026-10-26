import {Composition} from 'remotion';
import PeopleButIron, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/PeopleButIron';

// Private render entry for PeopleButIron (kyle-rome-industrial; Dwarkesh 3D style): a Roman work yard of many hands and plain iron tools; the camera rises over the crowd, glides past a rope team and pushes in on a smith striking on "Iron".
// Opaque 1080x1920, 29.97 fps, 206 frames.
export const RemotionRoot = () => (
  <Composition
    id="PeopleButIron"
    component={PeopleButIron}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
