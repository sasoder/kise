import {Composition} from 'remotion';
import RedBullShareholders, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/RedBullShareholders';

// Private render entry for RedBullShareholders (toto-twenty-person; Cheeky Pint style (stout)): the camera trucks right from Ferrari to Red Bull's principal; an amber group of shareholders rises on a platform above him, a rule ties him to them, the bulls tile lands on top.
// Opaque 1080x1920, 25 fps, 85 frames.
export const RemotionRoot = () => (
  <Composition
    id="RedBullShareholders"
    component={RedBullShareholders}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
