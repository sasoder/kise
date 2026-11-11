import {Composition} from 'remotion';
import EmpireOfHerself, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-taylor-swift/EmpireOfHerself';

// Private render entry for EmpireOfHerself (wip-taylor-swift; Works in Progress style): Taylor rises on a tower of her own pictures beside Meta and SpaceX, and gold leaf runs up its frames.
// Opaque 1080x1920, 24 fps, 180 frames.
export const RemotionRoot = () => (
  <Composition
    id="EmpireOfHerself"
    component={EmpireOfHerself}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
