import {Composition} from 'remotion';
import WeatherDelaysCut, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-weather-fired/WeatherDelaysCut';

// Private render entry for WeatherDelaysCut (scott-weather-fired; Cheeky Pint style (stout)): DEN's split-flap departures board, a storm outside; 4 then 6 of 8 DELAYED rows flip to ON TIME.
// Opaque 1080x1920, 23.976 fps, 165 frames.
export const RemotionRoot = () => (
  <Composition
    id="WeatherDelaysCut"
    component={WeatherDelaysCut}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
