import {Composition} from 'remotion';
import PointsAndLines, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-insurgency/PointsAndLines';

// Private render entry for PointsAndLines (sarah-insurgency; Dwarkesh 3D style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 145 frames.
export const RemotionRoot = () => (
  <Composition
    id="PointsAndLines"
    component={PointsAndLines}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
