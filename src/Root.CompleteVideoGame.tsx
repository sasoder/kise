import {Composition} from 'remotion';
import CompleteVideoGame, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-kids-mind-blown/CompleteVideoGame';

// Private render entry for CompleteVideoGame (sam-kids-mind-blown; Cheeky Pint style (stout)): a kid on a too-tall stool, one push-in to the screen where the whole platform game builds itself.
// Opaque 1080x1920, 23.976 fps, 79 frames.
export const RemotionRoot = () => (
  <Composition
    id="CompleteVideoGame"
    component={CompleteVideoGame}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
