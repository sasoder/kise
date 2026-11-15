import {Composition} from 'remotion';
import ProofOnItsOwn, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-since-writing/ProofOnItsOwn';

// Private render entry for ProofOnItsOwn (rsi-since-writing; Dwarkesh 3D style): the Genius walks the length of a lecture-hall blackboard writing a proof in chalk, boxes the result and ticks it in orange, then steps back to look.
// Opaque 1080x1920, 23.976 fps, 102 frames.
export const RemotionRoot = () => (
  <Composition
    id="ProofOnItsOwn"
    component={ProofOnItsOwn}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
