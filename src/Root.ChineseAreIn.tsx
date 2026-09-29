import {Composition} from 'remotion';
import ChineseAreIn, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ChineseAreIn';

// Private render entry for ChineseAreIn (cut 5, Sarah Paine Korea clip,
// delivered as 48_ChineseAreIn.mov): the UN front reaches the Yalu, the border
// lights, the PVA pours across and the front gives way. Opaque, 1080x1920,
// 24fps, 102 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ChineseAreIn"
        component={ChineseAreIn}
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
