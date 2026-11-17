import {Composition} from 'remotion';
import KpisAllMet, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-detecting-bullshit/KpisAllMet';

// Private render entry for KpisAllMet (nik-detecting-bullshit; Cheeky Pint style (stout)): "KPIs*" with its footnote over three KPI tiles whose bars each meet their lit target lines (the middle tile is cut 20's).
// Opaque 1080x1920, 23.976 fps, 66 frames.
export const RemotionRoot = () => (
  <Composition
    id="KpisAllMet"
    component={KpisAllMet}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
