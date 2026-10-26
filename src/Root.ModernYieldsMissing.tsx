import {Composition} from 'remotion';
import ModernYieldsMissing, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/ModernYieldsMissing';

// Private render entry for ModernYieldsMissing (kyle-rome-industrial; Dwarkesh 3D style): a dolly past the Roman farm with dashed orange ghosts of the tractor, fertiliser, modern wheat and harvest.
// Opaque 1080x1920, 29.97 fps, 274 frames.
export const RemotionRoot = () => (
  <Composition
    id="ModernYieldsMissing"
    component={ModernYieldsMissing}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
