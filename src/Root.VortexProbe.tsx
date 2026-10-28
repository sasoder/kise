import {Composition} from 'remotion';
import VortexProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-navier-stokes/VortexProbe';

// Private render entry for VortexProbe (sam-navier-stokes; the vortexSky world's probe stills, not a cut).
export const RemotionRoot = () => (
  <Composition id="VortexProbe" component={VortexProbe} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
