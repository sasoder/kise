import {Composition} from 'remotion';
import EightBeatsTen, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-champion-eight/EightBeatsTen';

// Private render entry for EightBeatsTen (toto-champion-eight; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 25 fps, 115 frames.
export const RemotionRoot = () => (
  <Composition
    id="EightBeatsTen"
    component={EightBeatsTen}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
