import {Composition} from 'remotion';
import CoffeeHundredWorkdays, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/CoffeeHundredWorkdays';

// Private render entry for CoffeeHundredWorkdays (rsi-since-writing; Dwarkesh 3D style): the Genius fills a stack of 100 WorkSheets while you drink one coffee.
// Opaque 1080x1920, 23.976 fps, 117 frames.
export const RemotionRoot = () => (
  <Composition
    id="CoffeeHundredWorkdays"
    component={CoffeeHundredWorkdays}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
