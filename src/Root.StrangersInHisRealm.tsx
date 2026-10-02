import {Composition} from 'remotion';
import StrangersInHisRealm, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/StrangersInHisRealm';

// Private render entry for StrangersInHisRealm, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard on Pizarro and Atahualpa: "that
// strangers have entered his realm. And again, we're talking 168 men." Opaque
// vintage map, 1080x1920, 24fps, 122 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="StrangersInHisRealm"
        component={StrangersInHisRealm}
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
