import {Composition} from 'remotion';
import ImpossibleTasks, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ImpossibleTasks';

// Dwarkesh `impossible-tasks` 0:01.960-0:08.939, orange Dwarkesh style: OpenAI
// deals five task tiles into a sandbox; their lines stop at the wall, the
// internet ring sits outside it, and the gate under the ring was never built.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ImpossibleTasks"
        component={ImpossibleTasks}
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
