import {Composition} from 'remotion';
import WorstCaseCornerPosts, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-weather-fired/WorstCaseCornerPosts';

// Private render entry for WorstCaseCornerPosts (scott-weather-fired; Cheeky Pint style (stout)): pull-up over DEN to the area view; a worst-case forecast blanket, four corner-post gates squeeze, arrivals thin to a trickle with holding loops.
// Opaque 1080x1920, 23.976 fps, 180 frames.
export const RemotionRoot = () => (
  <Composition
    id="WorstCaseCornerPosts"
    component={WorstCaseCornerPosts}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
