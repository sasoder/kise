import {Composition} from 'remotion';
import EveryDomainInNumbers, {DURATION, FPS, defaultProps, schema} from '../generated/components/zach-kelly-johnson/EveryDomainInNumbers';

// Private render entry for EveryDomainInNumbers (zach-kelly-johnson; Core Memory archive collage): a cross-section of sky, sea and deep; a destroyer, a submarine and a rocket each step out into a production run.
// Opaque 1080x1920, 23.976 fps, 188 frames.
export const RemotionRoot = () => (
  <Composition
    id="EveryDomainInNumbers"
    component={EveryDomainInNumbers}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
