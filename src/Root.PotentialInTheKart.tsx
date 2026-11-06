import {Composition} from 'remotion';
import PotentialInTheKart, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-champion-eight/PotentialInTheKart';
import ChampProbe, {defaultProps as probeProps, schema as probeSchema} from '../generated/components/toto-champion-eight/ChampProbe';

// Private render entry for PotentialInTheKart (toto-champion-eight; Cheeky Pint style (stout)): a kid in a kart, and the
// amber F1 car he could become drawn round him. ChampProbe: the shared world's probe still (measurement only).
// Opaque 1080x1920, 25 fps, 139 frames.
export const RemotionRoot = () => (
  <>
    <Composition
      id="PotentialInTheKart"
      component={PotentialInTheKart}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition id="ChampProbe" component={ChampProbe} schema={probeSchema} defaultProps={probeProps} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
