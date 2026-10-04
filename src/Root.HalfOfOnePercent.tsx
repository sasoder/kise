import {Composition} from 'remotion';
import HalfOfOnePercent, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HalfOfOnePercent';

// Private render entry for HalfOfOnePercent (cut E of the Tlaxcalans clip),
// so this cut renders while other builders own src/Root.tsx. Si Sheppard: "The
// conquistadors were maybe one half of one percent in raw numbers of
// that force."
// Opaque vintage map, 1080x1920, 24fps, 151 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HalfOfOnePercent"
        component={HalfOfOnePercent}
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
