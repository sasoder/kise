import {Composition} from 'remotion';
import OnlyAirlineAtScale, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-free-wifi/OnlyAirlineAtScale';

// Private render entry for OnlyAirlineAtScale (scott-free-wifi; Cheeky Pint air variant on wifiSky): a pull-back over a sky full of airliners; cream Starlink links drop to every United jet, none to the others. Render with --gl=angle.
// Opaque 1080x1920, 23.976 fps, 110 frames.
export const RemotionRoot = () => (
  <Composition
    id="OnlyAirlineAtScale"
    component={OnlyAirlineAtScale}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
