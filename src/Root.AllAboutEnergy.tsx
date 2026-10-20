import {Composition} from 'remotion';
import AllAboutEnergy, {AllAboutEnergyPoses, AllAboutEnergyTurnProbe, DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-first-farmers/AllAboutEnergy';

// Private render entry for AllAboutEnergy (kyle-first-farmers; Dwarkesh map style): reapers cut a wheat field, carriers
// shake their sheaves over a growing grain heap, the camera pulls back to show the field is a clearing in the wild.
// Opaque 1080x1920, 29.97 fps, 241 frames. AllAboutEnergyPoses: the carriers' poses for review.
export const RemotionRoot = () => (
  <>
    <Composition
      id="AllAboutEnergy"
      component={AllAboutEnergy}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition id="AllAboutEnergyPoses" component={AllAboutEnergyPoses} durationInFrames={60} fps={FPS} width={1080} height={1920} />
    <Composition id="AllAboutEnergyTurnProbe" component={AllAboutEnergyTurnProbe} durationInFrames={24} fps={FPS} width={1080} height={1920} defaultProps={{x: 424, y: 0, k: 1.6, f0: 22}} />
  </>
);
