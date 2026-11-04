import {Composition} from 'remotion';
import BelieveTheSolarCurve, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-nolan-orbit/BelieveTheSolarCurve';

// Private render entry for BelieveTheSolarCurve (scott-nolan-orbit; Cheeky Pint style (stout)): the solar price curve grows back to 1975 and turns amber; the short battery curve dims.
// Opaque 1080x1920, 23.976 fps, 113 frames.
export const RemotionRoot = () => (
  <Composition
    id="BelieveTheSolarCurve"
    component={BelieveTheSolarCurve}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
