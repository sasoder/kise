import {Composition} from 'remotion';
import ThroughTheNeighborhood, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-moses-ruthless/ThroughTheNeighborhood';

// Private render entry for ThroughTheNeighborhood (robert-moses-ruthless; Dwarkesh 3D style): a solid orange expressway presses a packed East Tremont row flat as its people flood out; the dashed alternative along Crotona Park takes three small houses.
// Opaque 1080x1920, 23.976 fps, 242 frames.
export const RemotionRoot = () => (
  <Composition
    id="ThroughTheNeighborhood"
    component={ThroughTheNeighborhood}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
