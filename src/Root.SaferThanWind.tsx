import {Composition} from 'remotion';
import SaferThanWind, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-wind/SaferThanWind';

// Private render entry for SaferThanWind (scott-nolan-wind; Cheeky Pint style (stout)): glass tubes of deaths per TWh rise out of coal, gas and nuclear, then the chart zooms into its floor (nuclear 0.03 below wind 0.035).
// Opaque 1080x1920, 23.976 fps, 155 frames.
export const RemotionRoot = () => (
  <Composition
    id="SaferThanWind"
    component={SaferThanWind}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
