import {Composition} from 'remotion';
import LivingThereAllHerLife, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-johnson-ranch/LivingThereAllHerLife';

// Private render entry for LivingThereAllHerLife (robert-johnson-ranch; Dwarkesh 3D style): one push-in from the lone farmhouse at the end of the road to the old woman rocking on its porch.
// Opaque 1080x1920, 23.976 fps, 78 frames.
export const RemotionRoot = () => (
  <Composition
    id="LivingThereAllHerLife"
    component={LivingThereAllHerLife}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
