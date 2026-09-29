import {Composition} from 'remotion';
import InterventionV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/InterventionV2';

// Private render entry for InterventionV2: ThirdPartyIntervention + CivilRegionalGlobal
// reimagined as one calmer graphic on the same global clock (V1 untouched).
// Opaque, 1080x1920, 24 fps, 373 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="InterventionV2"
        component={InterventionV2}
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
