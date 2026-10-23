import {Composition} from 'remotion';
import DefensePaysFirst, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-kelly-johnson/DefensePaysFirst';

// Private render entry for DefensePaysFirst (zach-kelly-johnson; Core Memory archive collage): C-130s roll out of a hangar and their coins print the Constellation above.
// Opaque 1080x1920, 23.976 fps, 130 frames.
export const RemotionRoot = () => (
  <Composition
    id="DefensePaysFirst"
    component={DefensePaysFirst}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
