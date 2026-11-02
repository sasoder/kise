import {Composition} from 'remotion';
import DifferentTastes, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-anthropic/DifferentTastes';

// Private render entry for DifferentTastes (wip-anthropic; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 52 frames.
export const RemotionRoot = () => (
  <Composition
    id="DifferentTastes"
    component={DifferentTastes}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
