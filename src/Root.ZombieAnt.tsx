import {Composition} from 'remotion';
import ZombieAnt, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-pandemics/ZombieAnt';
import {CordycepsProbe} from '../generated/components/kyle-pandemics/cordycepsProbe';

// Private render entry for ZombieAnt (kyle-pandemics; Dwarkesh map style): a fungus walks a carpenter ant up a stem,
// makes it bite a leaf vein, and its stalk bursts out of the ant's neck. Opaque 1080x1920, 29.97 fps, 145 frames.
// CordycepsProbe: the probe still of the shared fungus module (cordyceps.tsx, imported by cut 74).
export const RemotionRoot = () => (
  <>
    <Composition
      id="ZombieAnt"
      component={ZombieAnt}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition id="CordycepsProbe" component={CordycepsProbe} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
