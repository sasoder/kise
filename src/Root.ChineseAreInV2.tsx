import {Composition} from 'remotion';
import ChineseAreInV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ChineseAreInV2';

// Private render entry for ChineseAreInV2 (V1 ChineseAreIn stays untouched):
// the same cut extended by one second (102 -> 126 frames) with no holds: the
// PVA columns keep pouring in and the UN front keeps giving way to the last
// frame. Opaque, 1080x1920, 24fps, 126 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ChineseAreInV2"
        component={ChineseAreInV2}
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
