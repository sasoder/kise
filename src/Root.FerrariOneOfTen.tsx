import {Composition} from 'remotion';
import FerrariOneOfTen, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/FerrariOneOfTen';

// Private render entry for FerrariOneOfTen (toto-twenty-person; Cheeky Pint style (stout)): the Ferrari team principal, one cream peg in a row of ten under the amber CEO.
// Opaque 1080x1920, 25 fps, 97 frames.
export const RemotionRoot = () => (
  <Composition
    id="FerrariOneOfTen"
    component={FerrariOneOfTen}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
