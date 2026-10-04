import {Composition} from 'remotion';
import KdRatioOfInfinityV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/KdRatioOfInfinityV2';

// Private render entry for KdRatioOfInfinityV2, so this cut renders while other builders own
// src/Root.tsx. Si Sheppard on Cajamarca: "...literally a K/D ratio of
// infinity. Of, you know, 10,000 to zero." V2: the dead and the company as
// engraved figures, no ground rules. Opaque engraved page, 1080x1920, 24fps,
// 138 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="KdRatioOfInfinityV2"
        component={KdRatioOfInfinityV2}
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
