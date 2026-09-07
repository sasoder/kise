import {Composition} from 'remotion';
import SecretMessageBoards, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SecretMessageBoards';

// The field — three regions of the crowd go dark, threads start posting inside
// them, and the traffic escalates until each pocket is packed solid with held
// messages inside a field that is otherwise still.
// Ajeya, 0:16.120 -> 0:20.140 (+16 frame tail).
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
