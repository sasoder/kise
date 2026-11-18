import {Composition} from 'remotion';
import OneCarRunsAway, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-write-rules/OneCarRunsAway';

// Private render entry for OneCarRunsAway (toto-write-rules; Cheeky Pint style (stout)): the free-reign car rolls out of
// its pit box and runs away from a train of plain cars on the next lane, the empty track opening up as the camera pulls out.
// Opaque 1080x1920, 25 fps, 128 frames.
export const RemotionRoot = () => (
  <Composition
    id="OneCarRunsAway"
    component={OneCarRunsAway}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
