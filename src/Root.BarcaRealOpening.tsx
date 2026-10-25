import {Composition} from 'remotion';
import BarcaRealOpening, {DURATION, FPS, defaultProps, schema} from '../generated/components/barca-real/BarcaRealOpening';

// Private render entry for BarcaRealOpening (barca-real; Sporttouchen style): <one line on the picture>.
// Transparent overlay 1080x1920, 27.921 fps, 125 frames.
export const RemotionRoot = () => (
  <Composition
    id="BarcaRealOpening"
    component={BarcaRealOpening}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
