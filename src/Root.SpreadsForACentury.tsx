import {Composition} from 'remotion';
import SpreadsForACentury, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-vaccine/SpreadsForACentury';

// Private render entry for SpreadsForACentury (kyle-vaccine; Dwarkesh 3D style): the plum practice creeps from Africa and China over a baked map to England; the orange light kindles at Berkeley. RENDER WITH --gl=angle.
// Opaque 1080x1920, 29.97 fps, 133 frames.
export const RemotionRoot = () => (
  <Composition
    id="SpreadsForACentury"
    component={SpreadsForACentury}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
