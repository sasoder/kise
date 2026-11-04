import {Composition} from 'remotion';
import EqualDronesAndArmor, {DURATION, FPS, defaultProps, schema} from '../generated/components/kofman-vivaldi/EqualDronesAndArmor';

// Private render entry for EqualDronesAndArmor (kofman-vivaldi; ChinaTalk style (newsprint)): three red drones pair one-to-one with three ink armoured vehicles, close into an even formation and roll across the front line together.
// Opaque 1080x1920, 24 fps, 289 frames.
export const RemotionRoot = () => (
  <Composition
    id="EqualDronesAndArmor"
    component={EqualDronesAndArmor}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
