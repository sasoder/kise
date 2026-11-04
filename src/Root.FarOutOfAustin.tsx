import {Composition} from 'remotion';
import FarOutOfAustin, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-johnson-ranch/FarOutOfAustin';

// Private render entry for FarOutOfAustin (robert-johnson-ranch; Dwarkesh 3D style): a 1970s sedan drives out of Austin, through a cattle guard and 22 miles of caliche road to the farm of cut 26 (take 2).
// Opaque 1080x1920, 23.976 fps, 322 frames.
export const RemotionRoot = () => (
  <Composition
    id="FarOutOfAustin"
    component={FarOutOfAustin}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
