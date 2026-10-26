import {Composition} from 'remotion';
import WheatForGlass, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/WheatForGlass';

// Private render entry for WheatForGlass (kyle-rome-industrial; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 29.97 fps, 295 frames.
export const RemotionRoot = () => (
  <Composition
    id="WheatForGlass"
    component={WheatForGlass}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
