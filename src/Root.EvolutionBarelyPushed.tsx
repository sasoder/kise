import {Composition} from 'remotion';
import EvolutionBarelyPushed, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/EvolutionBarelyPushed';

// Private render entry for EvolutionBarelyPushed (rsi-stupidest-species; Dwarkesh 3D style): a march-of-progress walk trucked left to right (chimp, early hominin, forager, modern man, each swap hidden behind a slim near object that leaves the outgoing stage as a cream afterimage), then a pull-back and rise onto the lineup, each head with a small orange glow that barely grows.
// Opaque 1080x1920, 23.976 fps, 113 frames.
export const RemotionRoot = () => (
  <Composition
    id="EvolutionBarelyPushed"
    component={EvolutionBarelyPushed}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
