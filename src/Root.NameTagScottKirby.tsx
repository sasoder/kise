import {Composition} from 'remotion';
import NameTagScottKirby, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-free-wifi/NameTagScottKirby';

// Private render entry for NameTagScottKirby (scott-free-wifi; Name tag): <one line on the picture>.
// Transparent overlay 1080x1920, 23.976 fps, 96 frames.
export const RemotionRoot = () => (
  <Composition
    id="NameTagScottKirby"
    component={NameTagScottKirby}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
