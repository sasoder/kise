import {Composition} from 'remotion';
import CenturiesOfLittleScience, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-rome-industrial/CenturiesOfLittleScience';

// Private render entry for CenturiesOfLittleScience (kyle-rome-industrial; Dwarkesh 3D style): a hall of six Roman centuries, nearly empty.
// Opaque 1080x1920, 29.97 fps, 276 frames.
export const RemotionRoot = () => (
  <Composition
    id="CenturiesOfLittleScience"
    component={CenturiesOfLittleScience}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
