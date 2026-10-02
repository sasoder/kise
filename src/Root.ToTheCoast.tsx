import {Composition} from 'remotion';
import ToTheCoast, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/ToTheCoast';

// Private render entry for ToTheCoast, so this cut renders while other
// builders own src/Root.tsx. Si Sheppard on Cortes: "... takes as many men as
// he can to the coast." Opaque vintage map, 1080x1920, 24fps, 58 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ToTheCoast"
        component={ToTheCoast}
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
