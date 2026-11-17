import {Composition} from 'remotion';
import LeakedSecrets, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-twelve-hours/LeakedSecrets';

// Private render entry for LeakedSecrets (paul-twelve-hours; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 158 frames.
export const RemotionRoot = () => (
  <Composition
    id="LeakedSecrets"
    component={LeakedSecrets}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
