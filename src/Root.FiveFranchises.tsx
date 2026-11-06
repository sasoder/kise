import {Composition} from 'remotion';
import FiveFranchises, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-entertainment/FiveFranchises';

// Private render entry for FiveFranchises (wip-entertainment; Works in Progress style, messy variant): the five biggest films of 2025 dealt onto the page as b&w posters, then each one's original pulled out from under it.
// Opaque 1080x1920, 24 fps, 102 frames.
export const RemotionRoot = () => (
  <Composition
    id="FiveFranchises"
    component={FiveFranchises}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
