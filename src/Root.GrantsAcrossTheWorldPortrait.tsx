import {Composition} from 'remotion';
import GrantsAcrossTheWorldPortrait, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer-vertical/GrantsAcrossTheWorldPortrait';

// Private render entry for GrantsAcrossTheWorldPortrait (shruti-trailer-vertical; Core memory podcast style): <one line on the picture>.
// Opaque 1080x1920, 23.976 fps, 95 frames.
export const RemotionRoot = () => (
  <Composition
    id="GrantsAcrossTheWorldPortrait"
    component={GrantsAcrossTheWorldPortrait}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
