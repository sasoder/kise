import {Composition} from 'remotion';
import PearlKitDemo, {DURATION, FPS, PACIFIC_DURATION, PULLBACK_DURATION, PearlPacificDemo, PearlPacificPullback, defaultProps, schema} from '../generated/components/PearlKitDemo';

// Private render entry for PearlKitDemo: the review sheet of the Pearl Harbor
// clip's shared kit (pearlShared.tsx; Sarah Paine, Dwarkesh map style). One
// frame per state of the ASIA world (PearlKitDemo) and of the PACIFIC world
// (PearlPacificDemo); 1080x1920, 24 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PearlKitDemo"
        component={PearlKitDemo}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="PearlPacificDemo" component={PearlPacificDemo} durationInFrames={PACIFIC_DURATION} fps={FPS} width={1080} height={1920} />
      <Composition id="PearlPacificPullback" component={PearlPacificPullback} durationInFrames={PULLBACK_DURATION} fps={FPS} width={1080} height={1920} />
    </>
  );
};
