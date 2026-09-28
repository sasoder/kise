import {Composition} from 'remotion';
import NobodyCanSettleV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NobodyCanSettleV2';

// Private render entry for NobodyCanSettleV2, so this cut renders while other
// builders own src/Root.tsx. Sarah Paine, "why nobody could end WWI" (in-point
// 64.44 s): the Europe wide, the Entente lit on "alliance system", then the
// Adriatic, where two allies want one coast and a settlement line never
// settles; opaque 1080x1920, 24 fps, 245 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NobodyCanSettleV2"
        component={NobodyCanSettleV2}
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
