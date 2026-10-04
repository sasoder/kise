import {Composition} from 'remotion';
import KdRatioOfInfinity, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/KdRatioOfInfinity';

// Private render entry for KdRatioOfInfinity, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard on Cajamarca: "...literally a K/D
// ratio of infinity. Of, you know, 10,000 to zero." Opaque engraved page,
// 1080x1920, 24fps, 138 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="KdRatioOfInfinity"
        component={KdRatioOfInfinity}
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
