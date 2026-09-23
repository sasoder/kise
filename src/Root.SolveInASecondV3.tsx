import {Composition} from 'remotion';
import SolveInASecondV3, {DURATION, FPS, defaultProps, schema} from '../generated/components/SolveInASecondV3';

// Private render entry for SolveInASecondV3 (Noam_Challenge_The_Model V3), so this cut renders
// while other sessions own src/Root.tsx. Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => (
  <Composition
    id="SolveInASecondV3"
    component={SolveInASecondV3}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
