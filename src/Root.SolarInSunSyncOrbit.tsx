import {Composition} from 'remotion';
import SolarInSunSyncOrbit, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-orbit/SolarInSunSyncOrbit';

// Private render entry for SolarInSunSyncOrbit (scott-nolan-orbit; Cheeky Pint style (stout)): the SOLAR array lifts off its plinth and cranes up into orbit as an amber-winged satellite riding the day/night line over Earth.
// Opaque 1080x1920, 23.976 fps, 98 frames.
export const RemotionRoot = () => (
  <Composition
    id="SolarInSunSyncOrbit"
    component={SolarInSunSyncOrbit}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
