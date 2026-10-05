import {Composition} from 'remotion';
import SacredShiaShrine, {DURATION, FPS, defaultProps, schema} from '../generated/components/SacredShiaShrine';

// Private render entry for SacredShiaShrine (cut G of the Sheppard Iraq clip, builder N), so it
// renders while other builders own src/Root.tsx. Opaque Dwarkesh map style, 1080x1920, 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SacredShiaShrine"
        component={SacredShiaShrine}
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
