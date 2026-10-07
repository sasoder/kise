import {Composition} from 'remotion';
import InsideTheUltradome, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/InsideTheUltradome';

// Private render entry for InsideTheUltradome, so this cut renders while other
// builders own src/Root.tsx. "What happens inside the Ultradome is kind of hard
// to describe: part journalism, part gossip, and part sports broadcast." Core
// memory podcast graphic standard, opaque paper, 1080x1920, 24fps, 171 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="InsideTheUltradome"
        component={InsideTheUltradome}
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
