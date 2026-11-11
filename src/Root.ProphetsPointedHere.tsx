import {Composition} from 'remotion';
import ProphetsPointedHere, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-biblical/ProphetsPointedHere';

// Private render entry for ProphetsPointedHere (wip-biblical; Works in Progress style): one red point, five Doré prophets slid up along the century rule, dotted red lines from the three raised hands and gazes to it.
// Opaque 1080x1920, 24 fps, 117 frames.
export const RemotionRoot = () => (
  <Composition
    id="ProphetsPointedHere"
    component={ProphetsPointedHere}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
