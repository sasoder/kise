import {Composition} from 'remotion';
import AbassMistakeOne, {DURATION, FPS, defaultProps, schema} from '../generated/components/abass-brushing-mistakes/AbassMistakeOne';

// Private render entry for AbassMistakeOne (abass-brushing-mistakes; Humble Co. style): Three overlooked tooth regions, a filled station at each spoken point.
// Transparent overlay 1080x1920, 60 fps, 274 frames.
export const RemotionRoot = () => (
  <Composition
    id="AbassMistakeOne"
    component={AbassMistakeOne}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
