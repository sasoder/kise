import {Composition} from 'remotion';
import RerouteAroundTheStorm, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-weather-fired/RerouteAroundTheStorm';

// Private render entry for RerouteAroundTheStorm (scott-weather-fired; Cheeky Pint style (stout)): the ghost forecast storms drain away, the east one becomes the one real storm; held jets peel out, the SE stream bends round its west side onto 17L, departures fan out.
// Opaque 1080x1920, 23.976 fps, 194 frames.
export const RemotionRoot = () => (
  <Composition
    id="RerouteAroundTheStorm"
    component={RerouteAroundTheStorm}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
