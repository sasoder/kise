import {Composition} from 'remotion';
import TheMonorepo, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-twelve-hours/TheMonorepo';

// Private render entry for TheMonorepo (paul-twelve-hours; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 110 frames.
export const RemotionRoot = () => (
  <Composition
    id="TheMonorepo"
    component={TheMonorepo}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
