import {Composition} from 'remotion';
import VivaldiTookBack, {DURATION, FPS, defaultProps, schema} from '../generated/components/kofman-vivaldi/VivaldiTookBack';

// Private render entry for VivaldiTookBack (kofman-vivaldi; ChinaTalk style (newsprint)): red soaks across the real Vivaldi salient north of Lyman, Aug -> Oct 2026.
// Opaque 1080x1920, 24 fps, 145 frames.
export const RemotionRoot = () => (
  <Composition
    id="VivaldiTookBack"
    component={VivaldiTookBack}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
