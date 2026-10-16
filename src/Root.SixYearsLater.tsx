import {Composition} from 'remotion';
import SixYearsLater, {DURATION, FPS, defaultProps, schema} from '../generated/components/brent-cerro-gordo-trailer/SixYearsLater';

// Private render entry for SixYearsLater (Brent / Cerro Gordo trailer), 16:9 (1920x1080).
export const RemotionRoot = () => (
  <Composition
    id="SixYearsLater"
    component={SixYearsLater}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
