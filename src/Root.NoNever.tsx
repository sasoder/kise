import {Composition} from 'remotion';
import NoNever, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-lbj-money/NoNever';

// Private render entry for NoNever (robert-lbj-money; Dwarkesh 3D style): Johnson writes "No" on one telegram, shoves it aside, then "No, never" on the next, which goes dead.
// Opaque 1080x1920, 23.976 fps, 102 frames.
export const RemotionRoot = () => (
  <Composition
    id="NoNever"
    component={NoNever}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
