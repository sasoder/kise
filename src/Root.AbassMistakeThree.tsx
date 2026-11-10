import {Composition} from 'remotion';
import AbassMistakeThree, {DURATION, FPS, defaultProps, schema} from '../generated/components/abass-brushing-mistakes/AbassMistakeThree';

// Private render entry for AbassMistakeThree (abass-brushing-mistakes; Humble Co. style): Three overlooked tooth regions, a filled station at each spoken point.
// Transparent overlay 1080x1920, 60 fps, 161 frames.
export const RemotionRoot = () => (
  <Composition
    id="AbassMistakeThree"
    component={AbassMistakeThree}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
