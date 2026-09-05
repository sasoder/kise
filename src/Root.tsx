import {Composition} from 'remotion';
import CatchesOn, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CatchesOn';

// dario - always the first day — "what's going to catch on".
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:21.219 -> 0:28.780 */}
      <Composition
        id="CatchesOn"
        component={CatchesOn}
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
