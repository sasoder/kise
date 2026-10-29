import {Composition} from 'remotion';
import MosesNameTag, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-moses-ruthless/MosesNameTag';

// Private render entry for MosesNameTag (robert-moses-ruthless; Name tag): "Robert Moses / New York's master builder" over his Battery Bridge model still.
// Transparent overlay 1080x1920, 23.976 fps, 131 frames.
export const RemotionRoot = () => (
  <Composition
    id="MosesNameTag"
    component={MosesNameTag}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
