import {Composition} from 'remotion';
import SixOrSevenTools, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/SixOrSevenTools';

// Private render entry for SixOrSevenTools (kyle-vaccine; Dwarkesh 3D style): the six public-health tools as icon signs, then one glide right along the people doing them to the vaccination.
// Opaque 1080x1920, 29.97 fps, 400 frames.
export const RemotionRoot = () => (
  <Composition
    id="SixOrSevenTools"
    component={SixOrSevenTools}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
