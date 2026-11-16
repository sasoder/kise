import {Composition} from 'remotion';
import FirstPrivateToOrbit, {DURATION, FPS, defaultProps, schema} from '../generated/components/skyroot-trailer/FirstPrivateToOrbit';

// Private render entry for FirstPrivateToOrbit (skyroot-trailer; Core memory podcast style): Vikram-1 lifts off from Sriharikota on the photo Earth, the camera follows it up as it pitches over, then pulls back to reveal it riding its orbit over the Earth's cap (dashed planned orbit); chain crown on the trail on "orbit".
// Opaque 2048x1080, 23.976 fps, 76 frames.
export const RemotionRoot = () => (
  <Composition
    id="FirstPrivateToOrbit"
    component={FirstPrivateToOrbit}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={2048}
    height={1080}
  />
);
