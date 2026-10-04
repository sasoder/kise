import {Composition} from 'remotion';
import SeemedImpressive, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SeemedImpressive';

// Private render entry for SeemedImpressive (cut B of the Tlaxcala clip,
// Dwarkesh with Si Sheppard), so it renders while other builders own
// src/Root.tsx. "the Aztec Empire, from a distance, if you look at a map,
// seemed impressive." f0 = cut A f131. Opaque Dwarkesh map style,
// 1080x1920, 24fps, 99 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SeemedImpressive"
        component={SeemedImpressive}
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
