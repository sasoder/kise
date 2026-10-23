import {Composition} from 'remotion';
import SunnyAirportStormLine, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-radar-map/SunnyAirportStormLine';

// Private render entry for SunnyAirportStormLine (scott-radar-map; Cheeky Pint at-sea variant in the air): O'Hare in sunshine, departures route into a storm wall on the horizon and break into holding circles.
// Opaque 1080x1920, 23.976 fps, 184 frames.
export const RemotionRoot = () => (
  <Composition
    id="SunnyAirportStormLine"
    component={SunnyAirportStormLine}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
