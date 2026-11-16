import {Composition} from 'remotion';
import RaisedCloseTo155M, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/RaisedCloseTo155M';

// Private render entry for RaisedCloseTo155M (skyroot-trailer; Core memory podcast style): "$155M" as the house text-only sting (chain copies slide up behind the white core), over news card B.
// Transparent overlay 2048x1080, 23.976 fps, 50 frames.
export const RemotionRoot = () => (
  <Composition
    id="RaisedCloseTo155M"
    component={RaisedCloseTo155M}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
