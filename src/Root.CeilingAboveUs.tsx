import {Composition} from 'remotion';
import CeilingAboveUs, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-stupidest-species/CeilingAboveUs';

// Private render entry for CeilingAboveUs (rsi-stupidest-species; Dwarkesh 3D style): a ruler rises from the human in his lit niche and the camera cranes with it to a vast orange blueprint grid ceiling far above, then pulls back to the whole measured span.
// Opaque 1080x1920, 23.976 fps, 69 frames.
export const RemotionRoot = () => (
  <Composition
    id="CeilingAboveUs"
    component={CeilingAboveUs}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
