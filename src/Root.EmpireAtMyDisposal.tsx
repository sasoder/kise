import {Composition} from 'remotion';
import EmpireAtMyDisposal, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/EmpireAtMyDisposal';

// Private render entry for EmpireAtMyDisposal, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard on Cortes: "the Empire at my
// disposal ... It becomes effectively reinforcements." Opaque vintage map,
// 1080x1920, 24fps, 194 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="EmpireAtMyDisposal"
        component={EmpireAtMyDisposal}
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
