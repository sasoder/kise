import {Composition} from 'remotion';
import GrantsAcrossTheWorld, {DURATION, FPS, defaultProps, schema} from '../generated/components/shruti-trailer/GrantsAcrossTheWorld';

// Private render entry for GrantsAcrossTheWorld (shruti-trailer; Core memory podcast style): grant envelopes fly from Arlington to dots all over a printed world map.
// Opaque 1920x1080, 23.976 fps, 105 frames.
export const RemotionRoot = () => (
  <Composition
    id="GrantsAcrossTheWorld"
    component={GrantsAcrossTheWorld}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
