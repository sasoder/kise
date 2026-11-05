import {Composition} from 'remotion';
import HeBuiltTheMap, {DURATION, FPS, defaultProps, schema} from '../generated/components/robert-power-drug/HeBuiltTheMap';

// Private render entry for HeBuiltTheMap (robert-power-drug; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 288 frames.
export const RemotionRoot = () => (
  <Composition
    id="HeBuiltTheMap"
    component={HeBuiltTheMap}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
