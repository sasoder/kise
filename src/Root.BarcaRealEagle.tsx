import {Composition} from 'remotion';
import BarcaRealEagle, {DURATION, FPS, defaultProps, schema} from '../generated/components/barca-real/BarcaRealEagle';

// Private render entry for BarcaRealEagle (barca-real; Sporttouchen style): A bald eagle glides in on the Texas punchline..
// Transparent overlay 1080x1920, 27.921 fps, 34 frames.
export const RemotionRoot = () => (
  <Composition
    id="BarcaRealEagle"
    component={BarcaRealEagle}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
