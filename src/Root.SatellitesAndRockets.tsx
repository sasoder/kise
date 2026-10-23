import {Composition} from 'remotion';
import SatellitesAndRockets, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-superpower/SatellitesAndRockets';

// Private render entry for SatellitesAndRockets (zach-superpower; Core memory podcast style): a Starlink train glides across the sky and the Falcon 9 climbs up past it.
// Opaque 1080x1920, 23.976 fps, 43 frames.
export const RemotionRoot = () => (
  <Composition
    id="SatellitesAndRockets"
    component={SatellitesAndRockets}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
