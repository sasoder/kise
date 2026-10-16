import {Composition} from 'remotion';
import CerroOpening, {
  CUT1_DURATION,
  CUT2_DURATION,
  FPS,
  MASTER_DURATION,
  schema,
} from '../generated/components/CerroOpening';

// Private render entry for the Brent / Cerro Gordo trailer opening, 16:9 (1920x1080):
// cut 1 CerroGordo, cut 2 EightHundredMillion, and the master for join checks.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CerroGordo"
        component={CerroOpening}
        schema={schema}
        defaultProps={{cut: '1' as const, readout: '800M' as const}}
        durationInFrames={CUT1_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="EightHundredMillion"
        component={CerroOpening}
        schema={schema}
        defaultProps={{cut: '2' as const, readout: '800M' as const}}
        durationInFrames={CUT2_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="CerroOpeningMaster"
        component={CerroOpening}
        schema={schema}
        defaultProps={{cut: 'master' as const, readout: '800M' as const}}
        durationInFrames={MASTER_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
