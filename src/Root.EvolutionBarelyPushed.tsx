import {Composition} from 'remotion';
import EvolutionBarelyPushed, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/EvolutionBarelyPushed';

// Private render entry for EvolutionBarelyPushed (rsi-stupidest-species; Dwarkesh 3D style): the EVOLUTION mast lift raises the human a short way up the species tower, past the chimp, and stops far below the capital.
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
