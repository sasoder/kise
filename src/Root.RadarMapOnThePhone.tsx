import {Composition} from 'remotion';
import RadarMapOnThePhone, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-radar-map/RadarMapOnThePhone';

// Private render entry for RadarMapOnThePhone (scott-radar-map; Cheeky Pint style (stout)): a customer's phone rises into frame in the terminal; United's delay text arrives, then a radar map sweeps in showing the storm line west of O'Hare.
// Opaque 1080x1920, 23.976 fps, 53 frames.
export const RemotionRoot = () => (
  <Composition
    id="RadarMapOnThePhone"
    component={RadarMapOnThePhone}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
