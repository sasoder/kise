import {Composition} from 'remotion';
import GraftMachine, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-graft-machine/GraftMachine';

// Private render entry for GraftMachine (robert-graft-machine; the show's own Moses pictogram, re-staged 9:16): each group takes its cut from Moses and is collected into the row under his label.
// Opaque 1080x1920, 24 fps, 286 frames.
export const RemotionRoot = () => (
  <Composition
    id="GraftMachine"
    component={GraftMachine}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
