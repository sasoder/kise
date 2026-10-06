import {Composition} from 'remotion';
import OnlyDivergence, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/OnlyDivergence';

// Private render entry for OnlyDivergence (cut C of Sheppard_Vikings), so this
// cut renders while other builders own src/Root.tsx. Si Sheppard: "only
// divergence that would have given pre-Columbian peoples a real long-term
// chance to hold off the Europeans" — an engraved timeline on the umber page,
// an orange branch forking off it for five centuries. Opaque, 1080x1920,
// 24fps, 141 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="OnlyDivergence"
        component={OnlyDivergence}
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
