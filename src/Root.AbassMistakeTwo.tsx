import {Composition} from 'remotion';
import AbassMistakeTwo, {DURATION, FPS, defaultProps, schema} from '../generated/components/abass-brushing-mistakes/AbassMistakeTwo';

// Private render entry for AbassMistakeTwo (abass-brushing-mistakes; Humble Co. style): Three overlooked tooth regions, a filled station at each spoken point.
// Transparent overlay 1080x1920, 60 fps, 185 frames.
export const RemotionRoot = () => (
  <Composition
    id="AbassMistakeTwo"
    component={AbassMistakeTwo}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
