import {Composition} from 'remotion';
import TenfoldEveryYear, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/TenfoldEveryYear';

// Private render entry for TenfoldEveryYear (rsi-ten-earths; Dwarkesh 3D style): one robot becomes 10, 100, 1,000, 10,000 and a sea, each rising out of the floor on its lift in a ripple, under one log-space crane up and back.
// Opaque 1080x1920, 23.976 fps, 156 frames.
export const RemotionRoot = () => (
  <Composition
    id="TenfoldEveryYear"
    component={TenfoldEveryYear}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
