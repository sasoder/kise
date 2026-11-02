import {Composition} from 'remotion';
import DirtyDogs, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-victorians/DirtyDogs';

// Private render entry for DirtyDogs (wip-victorians; Works in Progress style): a bulldog in a top hat on a turning globe as the empire prints red.
// Opaque 1080x1920, 24 fps, 65 frames.
export const RemotionRoot = () => (
  <Composition
    id="DirtyDogs"
    component={DirtyDogs}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
