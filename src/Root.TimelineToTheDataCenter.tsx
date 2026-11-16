import {Composition} from 'remotion';
import TimelineToTheDataCenter, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-ten-earths/TimelineToTheDataCenter';

// Private render entry for TimelineToTheDataCenter (rsi-ten-earths, rev 1; Dwarkesh 3D style): one continuous flight, low over a road with the years 2026-2030 painted on the asphalt, through the data center's rolling door as it rises, then a crane up and back over a hall of orange robots typing at desks between rack rows into the haze.
// Opaque 1080x1920, 23.976 fps, 173 frames.
export const RemotionRoot = () => (
  <Composition
    id="TimelineToTheDataCenter"
    component={TimelineToTheDataCenter}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
