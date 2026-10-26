import {Composition} from 'remotion';
import PasteurNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/PasteurNameTag';

// Private render entry for PasteurNameTag (kyle-vaccine; Name tag): "Louis Pasteur / Chemist and microbiologist" over his portrait still.
// Transparent overlay 1080x1920, 29.97 fps, 91 frames.
export const RemotionRoot = () => (
  <Composition
    id="PasteurNameTag"
    component={PasteurNameTag}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
