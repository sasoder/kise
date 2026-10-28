import {Composition} from 'remotion';
import BenchmaxxedTower, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-benchmaxxing/BenchmaxxedTower';

// Private render entry for BenchmaxxedTower (sam-benchmaxxing; Cheeky Pint style (stout)): a fair benchmark chart on the airfield apron; OpenAI's amber column keeps rising, an airliner passes beneath its tile, the others are stubs.
// Opaque 1080x1920, 23.976 fps, 69 frames.
export const RemotionRoot = () => (
  <Composition
    id="BenchmaxxedTower"
    component={BenchmaxxedTower}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
