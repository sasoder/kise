import {Composition} from 'remotion';
import TopHumanInMonths, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-years-in-days/TopHumanInMonths';

// Private render entry for TopHumanInMonths (rsi-years-in-days; Dwarkesh style): seven fields rise on a calendar chart to TOP HUMANS within months.
// Opaque 1080x1920, 23.976 fps, 204 frames.
export const RemotionRoot = () => (
  <Composition
    id="TopHumanInMonths"
    component={TopHumanInMonths}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
