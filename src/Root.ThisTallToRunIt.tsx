import {Composition} from 'remotion';
import ThisTallToRunIt, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-years-in-days/ThisTallToRunIt';

// Private render entry for ThisTallToRunIt (rsi-years-in-days; Dwarkesh style): the 2028 intern, far taller than today's mark, still short of the "this tall to run a business" gauge.
// Opaque 1080x1920, 23.976 fps, 171 frames.
export const RemotionRoot = () => (
  <Composition
    id="ThisTallToRunIt"
    component={ThisTallToRunIt}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
