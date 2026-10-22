import {Composition} from 'remotion';
import StormMovingIn, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-weather-fired/StormMovingIn';

// Private render entry for StormMovingIn (scott-weather-fired; Cheeky Pint style (stout)): a storm sails in from the west, strikes inside the 3-mile ring, the ring closes amber.
// Opaque 1080x1920, 23.976 fps, 85 frames.
export const RemotionRoot = () => (
  <Composition
    id="StormMovingIn"
    component={StormMovingIn}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
