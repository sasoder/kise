import {Composition} from 'remotion';
import CerroOpeningTall, {
  CUT1_DURATION,
  CUT2_DURATION,
  FPS,
  MASTER_DURATION,
  schema,
} from '../generated/components/CerroOpeningTall';

// Private render entry for the Brent / Cerro Gordo opening, 9:16 (1080x1920):
// cut 1 CerroGordoTall, cut 2 EightHundredMillionTall, and the master for join checks.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CerroGordoTall"
        component={CerroOpeningTall}
        schema={schema}
        defaultProps={{cut: '1' as const, readout: '800M' as const}}
        durationInFrames={CUT1_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="EightHundredMillionTall"
        component={CerroOpeningTall}
        schema={schema}
        defaultProps={{cut: '2' as const, readout: '800M' as const}}
        durationInFrames={CUT2_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="CerroOpeningTallMaster"
        component={CerroOpeningTall}
        schema={schema}
        defaultProps={{cut: 'master' as const, readout: '800M' as const}}
        durationInFrames={MASTER_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
