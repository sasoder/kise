import {Composition} from 'remotion';
import BarcaRealShirt, {DURATION, FPS, defaultProps, schema} from '../generated/components/barca-real/BarcaRealShirt';

// Private render entry for BarcaRealShirt (barca-real; Sporttouchen style): The Barcelona GOLF shirt slides up beneath the captions..
// Transparent overlay 1080x1920, 27.921 fps, 104 frames.
export const RemotionRoot = () => (
  <Composition
    id="BarcaRealShirt"
    component={BarcaRealShirt}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
