import {Composition} from 'remotion';
import SlackInTwelveHours, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-twelve-hours/SlackInTwelveHours';

// Private render entry for SlackInTwelveHours (paul-twelve-hours; Paul world, look C): the 12-hour dial sweeps, then five of the seven Anthropic Slack tiles slide open, CATHEDRAL at the foot.
// Opaque 1080x1920, 23.976 fps, 91 frames.
export const RemotionRoot = () => (
  <Composition
    id="SlackInTwelveHours"
    component={SlackInTwelveHours}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
