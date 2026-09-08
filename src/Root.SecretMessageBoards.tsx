import {Composition} from 'remotion';
import SecretMessageBoards, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SecretMessageBoards';

// A private entry for rendering SecretMessageBoards on its own, so a pass on
// this cut never touches `src/Root.tsx` while other cuts are being built beside
// it. Registers exactly the one composition and nothing else.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SecretMessageBoards"
        component={SecretMessageBoards}
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
