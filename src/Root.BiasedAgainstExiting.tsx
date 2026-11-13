import {Composition} from 'remotion';
import BiasedAgainstExiting, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-managers-underperformers/BiasedAgainstExiting';

// Private render entry for BiasedAgainstExiting (nik-managers-underperformers; Cheeky Pint style (stout)): a manager stands over a sleeping underperformer and lifts his review clipboard over his own eyes, the amber EXIT unused behind him.
// Opaque 1080x1920, 23.976 fps, 77 frames.
export const RemotionRoot = () => (
  <Composition
    id="BiasedAgainstExiting"
    component={BiasedAgainstExiting}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
