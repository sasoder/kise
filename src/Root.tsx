import {Composition} from 'remotion';
import ReachLurches, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ReachLurches';

// dario - always the first day — "what's going to catch on".
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:21.260 -> 0:32.780 */}
      <Composition
        id="ReachLurches"
        component={ReachLurches}
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
