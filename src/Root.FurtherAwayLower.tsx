import {Composition} from 'remotion';
import FurtherAwayLower, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-insurgency/FurtherAwayLower';

// Private render entry for FurtherAwayLower (sarah-insurgency; Dwarkesh 3D style): from the farm the camera cranes up over the Atlantic while a cream route from London shrinks its cream column.
// Opaque 1080x1920, 24 fps, 112 frames.
export const RemotionRoot = () => (
  <Composition
    id="FurtherAwayLower"
    component={FurtherAwayLower}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
