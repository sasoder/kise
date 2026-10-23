import {Composition} from 'remotion';
import KellysProductionRun, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-kelly-johnson/KellysProductionRun';

// Private render entry for KellysProductionRun (zach-kelly-johnson; Core memory podcast style, archive collage): his aircraft stream out from behind Kelly Johnson's shoulder into rows of identical aircraft above him.
// Opaque 1080x1920, 23.976 fps, 95 frames.
export const RemotionRoot = () => (
  <Composition
    id="KellysProductionRun"
    component={KellysProductionRun}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
