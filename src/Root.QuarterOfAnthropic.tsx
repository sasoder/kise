import {Composition} from 'remotion';
import QuarterOfAnthropic, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-anthropic/QuarterOfAnthropic';

// Private render entry for QuarterOfAnthropic (wip-anthropic; Works in Progress style): one SF tile of real IPO logos, three more tiles, and Anthropic printed across them.
// Opaque 1080x1920, 24 fps, 189 frames.
export const RemotionRoot = () => (
  <Composition
    id="QuarterOfAnthropic"
    component={QuarterOfAnthropic}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
