import {Composition} from 'remotion';
import BurdenProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-gulf-war/burdenProbe';

// Private render entry for burdenProbe (sarah-gulf-war; Dwarkesh 3D style): probe stills of the shared burdenWorld
// (the soldier and bundle sprites, the world at cut 69's last frame, a cash-stack test). Opaque 1080x1920, 24 fps.
export const RemotionRoot = () => (
  <Composition
    id="BurdenProbe"
    component={BurdenProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
