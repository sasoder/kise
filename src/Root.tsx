import {Composition} from 'remotion';
import ProgressStopped, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ProgressStopped';

// dario - always the first day — "if the progress in models stopped".
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:00.000 -> 0:04.879 */}
      <Composition
        id="ProgressStopped"
        component={ProgressStopped}
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
