import {Composition} from 'remotion';
import PropertyAndContracts, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/PropertyAndContracts';

// Private render entry for PropertyAndContracts (kyle-rome-industrial; Dwarkesh 3D style): a crane down from a surveyed Roman grid to a stone being set and a sealed contract.
// Opaque 1080x1920, 29.97 fps, 259 frames.
export const RemotionRoot = () => (
  <Composition
    id="PropertyAndContracts"
    component={PropertyAndContracts}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
