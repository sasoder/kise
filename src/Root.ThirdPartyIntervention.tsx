import {Composition} from 'remotion';
import ThirdPartyIntervention, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ThirdPartyIntervention';

// Private render entry for ThirdPartyIntervention (the Korea 1950 world pair, one global clock
// in generated/components/worldCamera.ts). Opaque, 1080x1920, 24 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ThirdPartyIntervention"
        component={ThirdPartyIntervention}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
