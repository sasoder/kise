import {Composition} from 'remotion';
import HighwaysHeBuilt, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-graft-machine/HighwaysHeBuilt';

// Private render entry for HighwaysHeBuilt (robert-graft-machine; the show's own map style): Moses's black highways draw on across the NYC map as the count climbs to 672 of 899 miles.
// Opaque 1080x1920, 24 fps, 194 frames.
export const RemotionRoot = () => (
  <Composition
    id="HighwaysHeBuilt"
    component={HighwaysHeBuilt}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
