import {Composition} from 'remotion';
import EqualDronesAndArmor, {DURATION, FPS, defaultProps, schema} from '../generated/components/kofman-vivaldi/EqualDronesAndArmor';

// Private render entry for EqualDronesAndArmor (kofman-vivaldi; ChinaTalk style (newsprint)): on the Lyman sector map six ink armoured companies mass behind the Ukrainian line, a matching red drone twin lands beside each one, and the combined force rolls across the front.
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
