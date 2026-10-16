import {Composition} from 'remotion';
import ThousandYearCycles, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-plague/ThousandYearCycles';

// Private render entry for ThousandYearCycles: cut 1 of the plague timeline chart (three pandemic bursts on a 1-2100 ruler; the 500-year ghosts and the 10-year comb).
// Opaque, 1080x1920, 29.97 fps. Chart shared in ThousandYearCyclesShared.tsx.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ThousandYearCycles"
        component={ThousandYearCycles}
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
