import {Composition} from 'remotion';
import TakingThatIndividual, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/TakingThatIndividual';

// Private render entry for TakingThatIndividual (G2 of the Sheppard
// "Centralized empires fell fast" set), so this cut renders while other
// builders own src/Root.tsx. "Taking that individual destabilizes the whole
// system, potentially even means that it can be functionally governed through
// the use of intermediaries or even puppets." Opaque engraved page,
// 1080x1920, 24 fps, 164 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TakingThatIndividual"
        component={TakingThatIndividual}
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
