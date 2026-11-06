import {Composition} from 'remotion';
import PotentialInTheKart, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-champion-eight/PotentialInTheKart';
import TrackProbe, {defaultProps as trackProps, schema as trackSchema} from '../generated/components/toto-champion-eight/TrackProbe';
import ChampProbe, {defaultProps as probeProps, schema as probeSchema} from '../generated/components/toto-champion-eight/ChampProbe';

// Private render entry for PotentialInTheKart (toto-champion-eight; Cheeky Pint style (stout)): a kid in a kart, and the
// amber F1 car he could become drawn round him. ChampProbe: the shared world's probe still (measurement only).
// TrackProbe: the shared racetrack world's probe (frame 0 close, frame 1 wide).
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
    <Composition id="TrackProbe" component={TrackProbe} schema={trackSchema} defaultProps={trackProps} durationInFrames={2} fps={FPS} width={1080} height={1920} />
  </>
);
