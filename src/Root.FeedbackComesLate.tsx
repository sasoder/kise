import {Composition} from 'remotion';
import FeedbackComesLate, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-trend-friend/FeedbackComesLate';

// Private render entry for FeedbackComesLate (nik-trend-friend; Cheeky Pint style (stout)): eight bets crawl out round the loop, none comes back, the manager is swapped.
// Opaque 1080x1920, 23.976 fps, 146 frames.
export const RemotionRoot = () => (
  <Composition
    id="FeedbackComesLate"
    component={FeedbackComesLate}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
