import {Composition} from 'remotion';
import PaidToPay, {DURATION, FPS, defaultProps, schema} from '../generated/components/wip-victorians/PaidToPay';

// Private render entry for PaidToPay (wip-victorians; Works in Progress style): <one line on the picture>.
// Opaque 1080x1920, 24 fps, 178 frames.
export const RemotionRoot = () => (
  <Composition
    id="PaidToPay"
    component={PaidToPay}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
