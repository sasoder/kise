import {Composition} from 'remotion';
import LopsidedV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/LopsidedV2';

// Private render entry for LopsidedV2 (Lopsided stays untouched): the same
// cut with the page in world space, one smooth authored camera, a low-passed
// beam spring and slower settling dots. Opaque, 1080x1920, 24fps, 10.17 s.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="LopsidedV2"
        component={LopsidedV2}
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
