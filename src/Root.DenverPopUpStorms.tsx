import {Composition} from 'remotion';
import DenverPopUpStorms, {DURATION, FPS, defaultProps, schema} from '../generated/components/scott-weather-fired/DenverPopUpStorms';

// Private render entry for DenverPopUpStorms (scott-weather-fired; Cheeky Pint style (stout)): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 65 frames.
export const RemotionRoot = () => (
  <Composition
    id="DenverPopUpStorms"
    component={DenverPopUpStorms}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
