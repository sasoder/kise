import {Composition} from 'remotion';
import FirstDayAtTheCompany, {DURATION, FPS, defaultProps, schema} from '../generated/components/rsi-years-in-days/FirstDayAtTheCompany';

// Private render entry for FirstDayAtTheCompany (rsi-years-in-days; Dwarkesh style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 302 frames.
export const RemotionRoot = () => (
  <Composition
    id="FirstDayAtTheCompany"
    component={FirstDayAtTheCompany}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
