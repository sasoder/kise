import {Composition} from 'remotion';
import ComesAndGoes, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-plague/ComesAndGoes';

// Private render entry for ComesAndGoes: cut 2 of the plague timeline chart (the same chart pushed in on the present; the dashed, wandering future).
// Opaque, 1080x1920, 29.97 fps. Chart shared in ThousandYearCyclesShared.tsx.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ComesAndGoes"
        component={ComesAndGoes}
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
