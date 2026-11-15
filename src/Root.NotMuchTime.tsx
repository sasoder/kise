import {Composition} from 'remotion';
import NotMuchTime, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/NotMuchTime';

// Private render entry for NotMuchTime (rsi-stupidest-species; Dwarkesh 3D style): the camera cranes down a long winding trunk of ancestry to the fork; the chimps take the left branch, our short stub runs to today, with three forager scenes around it (teaching, a haul, a dashed orange plan).
// Opaque 1080x1920, 23.976 fps, 223 frames.
export const RemotionRoot = () => (
  <Composition
    id="NotMuchTime"
    component={NotMuchTime}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
