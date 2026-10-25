import {Composition} from 'remotion';
import BarcaRealPrediction, {DURATION, FPS, defaultProps, schema} from '../generated/components/barca-real/BarcaRealPrediction';

// Private render entry for BarcaRealPrediction (barca-real; Sporttouchen style): <one line on the picture>.
// Transparent overlay 1080x1920, 27.921 fps, 132 frames.
export const RemotionRoot = () => (
  <Composition
    id="BarcaRealPrediction"
    component={BarcaRealPrediction}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
