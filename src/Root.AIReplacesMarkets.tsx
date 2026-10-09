import {Composition} from 'remotion';
import AIReplacesMarkets, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AIReplacesMarkets';

// Private render entry for AIReplacesMarkets, so this cut renders while other
// builders own src/Root.tsx. Logan Wright, "Brezhnev chose decay" (ChinaTalk),
// cut D: "They think AI is the way we can get out of relying on markets. We
// don't need to rely on markets anymore because AI will tell us how to
// allocate resources more appropriately." ChinaTalk slightly-vintage kit,
// opaque, 1080x1920, 24 fps, 191 frames (179 + 12 tail).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AIReplacesMarkets"
        component={AIReplacesMarkets}
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
