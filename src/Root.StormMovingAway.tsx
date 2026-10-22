import {Composition} from 'remotion';
import StormMovingAway, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-weather-fired/StormMovingAway';

// Private render entry for StormMovingAway (scott-weather-fired; Cheeky Pint style (stout)): a storm east of DEN sails away east, one bolt inside the ring still closes it amber, the field back in sun.
// Opaque 1080x1920, 23.976 fps, 75 frames.
export const RemotionRoot = () => (
  <Composition
    id="StormMovingAway"
    component={StormMovingAway}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
