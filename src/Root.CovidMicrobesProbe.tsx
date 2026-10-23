import {Composition} from 'remotion';
import CovidMicrobesProbe, {DURATION, FPS, defaultProps, schema} from '../generated/components/kyle-covid/covidMicrobesProbe';

// Private render entry for the kyle-covid microbes probe sheets (covidMicrobes.tsx): one sheet per frame.
export const RemotionRoot = () => (
  <Composition
    id="CovidMicrobesProbe"
    component={CovidMicrobesProbe}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
