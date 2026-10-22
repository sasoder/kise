import {Composition} from 'remotion';
import LightningThreeMiles, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-weather-fired/LightningThreeMiles';

// Private render entry for LightningThreeMiles (scott-weather-fired; Cheeky Pint style, air variant): a bolt strikes inside the 3-mile ring around DEN, the ring closes amber and the ramp stops.
// Opaque 1080x1920, 23.976 fps, 120 frames.
export const RemotionRoot = () => (
  <Composition
    id="LightningThreeMiles"
    component={LightningThreeMiles}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
