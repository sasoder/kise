import {Composition} from 'remotion';
import HundredthOfTheCost, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-navier-stokes/HundredthOfTheCost';

// Private render entry for HundredthOfTheCost (sam-navier-stokes; Cheeky Pint style (stout)): a newsprint page with the real vortex photo; 99 of 100 amber cost cubes sink into printed squares, the dateline rolls SEPT 2026 -> 2027.
// Opaque 1080x1920, 23.976 fps, 96 frames.
export const RemotionRoot = () => (
  <Composition
    id="HundredthOfTheCost"
    component={HundredthOfTheCost}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
